import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import simpleGit, { SimpleGit, DiffResult } from 'simple-git';
import { execSync, exec } from 'child_process';
import { ContentProcessorService } from '@uavos/scripts';
import kill from 'tree-kill';
import { DeploymentResponseDto, DeploymentStatusRequestDto } from '@uavos/shared-types';

@Injectable()
export class DeploymentService {
    // Local Content Repo
    private repoPath: string;
    // Repo Url
    private repoUrl: string;
    // Repo Branch
    private branch: string;
    // Github Authorization Token 
    private githubToken: string;
    // Is Process in preview
    private previewProcess: any;
    // Preview port
    private previewPort: number;
    // Preview url
    private previewUrl: string;

    constructor(
        private readonly contentProcessorService: ContentProcessorService
    ) {
        this.repoPath = process.env.GIT_REPO_PATH ?? './content';
        const rawUrl = process.env.GIT_REPO_URL ?? '';
        this.repoUrl = rawUrl.replace('https://@', 'https://').replace('@', '');
        this.branch = process.env.GIT_BRANCH ?? 'main';
        this.githubToken = process.env.GITHUB_TOKEN ?? '';
        this.previewPort = Number(process.env.PREVIEW_PORT) ?? 3001;
        this.previewUrl = process.env.SITE_HOST ?? 'http://localhost:3001';
        if (!this.repoUrl) throw new Error('GIT_REPO_URL is required');
        if (!this.githubToken) throw new Error('GITHUB_TOKEN is required');
    }

    /**
     * Get Current Workflow Status
     * @returns DeploymentStatusRequestDto
     */
    async getStatus(): Promise<DeploymentStatusRequestDto> {
        try {
            const gitFolder = path.join(this.repoPath, '.git');
            if (!fs.existsSync(gitFolder)) {
                return {
                    hasUnpublishedChanges: false,
                    message: 'Repository is not initialized'
                };
            }

            const git: SimpleGit = simpleGit(this.repoPath);
            await git.fetch('--tags');
            const tagsList = await git.tags(['--sort=-creatordate']);
            const latestTag = tagsList.all.length > 0 ? tagsList.all[0] : null;
            if (!latestTag) {
                return {
                    hasUnpublishedChanges: true,
                    message: 'No tags found, unpublished changes detected'
                };
            }
            const diffSummary = await git.diffSummary([`${latestTag}..HEAD`]);
            const hasChanges = diffSummary.changed > 0 || diffSummary.insertions > 0 || diffSummary.deletions > 0;

            return {
                currentTag: latestTag,
                hasUnpublishedChanges: hasChanges,
                message: hasChanges
                    ? `Unpublished changes detected. Last published tag: ${latestTag}`
                    : `All changes are published. Current tag: ${latestTag}`
            };

        } catch (error) {
            return {
                hasUnpublishedChanges: false,
                message: `Status check failed: ${error.message}`
            };
        }
    }

    /**
     * Start Nextra Site Preview
     * @returns DeploymentResponseDto
     */
    async previewStart(): Promise<DeploymentResponseDto> {
        if (this.previewProcess) {
            return { success: false, message: `Preview already running at ${this.previewUrl}` };
        }

        try {
            await this.contentProcessorService.processContent();
            this.startDevServer(this.previewPort);
            return {
                success: true,
                message: `Preview server starting on ${this.previewUrl}`,
                url: `${this.previewUrl}`
            };
        } catch (error) {
            return { success: false, message: `Preview start failed: ${error.message}` };
        }
    }

    /**
     * Get Current Preview Status
     * @returns DeploymentResponseDto
     */
    async previewStatus(): Promise<DeploymentResponseDto> {
        const isRunning = !!this.previewProcess;

        return {
            success: true,
            isRunning,
            url: isRunning ? `${this.previewUrl}` : undefined
        };
    }

    /**
     * Stop Current Preview
     * @returns DeploymentResponseDto
     */
    async previewStop(): Promise<DeploymentResponseDto> {
        if (!this.previewProcess) {
            return { success: false, message: 'Preview server is not running' };
        }

        try {
            kill(this.previewProcess.pid, 'SIGTERM', (err) => {
                if (err) console.error('Failed to stop preview process:', err);
            });

            this.previewProcess = null;
            return { success: true, message: 'Preview server stopped' };
        } catch (error) {
            return { success: false, message: `Failed to stop preview: ${error.message}` };
        }
    }

    /**
     * Start Dev Server
     * @param port 
     */
    private startDevServer(port: number) {
        const uavosPath = path.join(process.cwd(), '../site');
        const child = exec(`npm run dev`, {
            cwd: uavosPath,
            env: { ...process.env, PORT: port.toString() }
        });

        this.previewProcess = child;

        child.stdout?.on('data', (data) => console.log(data));
        child.stderr?.on('data', (data) => console.error(data));
        child.on('exit', () => {
            this.previewProcess = null;
            console.log('Preview server exited');
        });
    }

    /**
     * Publish Content
     * @returns DeploymentResponseDto
     */
    async publish(): Promise<DeploymentResponseDto> {
        try {
            const git = simpleGit(this.repoPath);
            await git.fetch('--tags');
            
            const currentTag = await this.getCurrentTag();
            const hasChanges = await this.hasChangesSinceLastTag(git, currentTag);
            
            await this.contentProcessorService.processContent();
            
            const buildDir = await this.buildSite('production');
            
            await this.deployToGhPages(buildDir, 'production');
            
            if (hasChanges) {
                const nextTag = await this.getNextTag(git);
                await this.createTag(git, nextTag);
                
                return { success: true, message: `Site published with NEW content tag ${nextTag}` };
            } else {
                return { success: true, message: `Site published (no content changes, using existing tag ${currentTag})` };
            }
        } catch (error) {
            return { success: false, message: `Publish failed: ${error.message}` };
        }
    }

    /**
     * 
     * @param git 
     * @param currentTag 
     * @returns boolean
     */
    private async hasChangesSinceLastTag(git: SimpleGit, currentTag: string | null): Promise<boolean> {
        try {
            if (!currentTag) {
                return true;
            }

            const diffSummary = await git.diffSummary([`${currentTag}..HEAD`]);
            return diffSummary.changed > 0 || diffSummary.insertions > 0 || diffSummary.deletions > 0;

        } catch (error) {
            console.warn('Error checking changes:', error.message);
            return true;
        }
    }

    /**
     * Get next tag
     * @param git 
     * @returns string
     */
    private async getNextTag(git: SimpleGit): Promise<string> {
        const tags = await this.getAllTags(git);
        if (tags.length === 0) return 'v1.0.0';

        const lastTag = tags[tags.length - 1];
        const [major, minor, patch] = lastTag.replace(/^v/, '').split('.').map(Number);
        return `v${major}.${minor}.${patch + 1}`;
    }

    /**
     * Create Tag
     * @param git 
     * @param version 
     * @param message 
     */
    private async createTag(git: SimpleGit, version: string, message?: string) {
        const tagMessage = message || `Release ${version}`;
        
        await git.addAnnotatedTag(version, tagMessage);
        await git.pushTags('origin');
        console.log(`✅ Tag ${version} created and pushed`);
    }

    /**
     * Build Site 
     * @param environment 
     * @returns string
     */
    private async buildSite(environment: string): Promise<string> {
        const uavosPath = path.join(process.cwd(), '../site');
        const buildDir = path.join(uavosPath, 'out');

        console.log('🧹 Cleaning build...');
        if (fs.existsSync(path.join(uavosPath, '.next'))) {
            fs.rmSync(path.join(uavosPath, '.next'), { recursive: true, force: true });
        }
        if (fs.existsSync(buildDir)) {
            fs.rmSync(buildDir, { recursive: true, force: true });
        }

        console.log(`📦 Building site (${environment})...`);
        process.env.DEPLOY_ENV = environment;
        execSync('npm run build', { stdio: 'inherit', cwd: uavosPath });

        if (!fs.existsSync(buildDir)) {
            throw new Error('❌ Build failed: out/ directory not found');
        }

        fs.writeFileSync(path.join(buildDir, '.nojekyll'), '');
        return buildDir;
    }

    /**
     * Deploy To Github Pages
     * @param buildDir 
     * @param environment 
     */
    private async deployToGhPages(buildDir: string, environment: string) {
        console.log('🚀 Deploying to gh-pages...');
        const ghPages = simpleGit(buildDir);

        await ghPages.init();
        await ghPages.addConfig('user.name', process.env.GIT_USER_NAME || 'Deploy Bot');
        await ghPages.addConfig('user.email', process.env.GIT_USER_EMAIL || 'bot@example.com');

        await ghPages.checkout(['-B', 'gh-pages']);
        await ghPages.add('.');
        await ghPages.commit(`Deploy site - ${environment} - ${new Date().toISOString()}`);
        await ghPages.push(
            `https://${this.githubToken}@github.com/Alexandr-one/uavos.git`,
            'gh-pages',
            { '--force': null },
        );

        console.log('✅ Site deployed to gh-pages');
    }

    /**
     * Get Current Github Tag 
     * @returns string | null
     */
    private async getCurrentTag(): Promise<string | null> {
        try {
            if (!fs.existsSync(path.join(this.repoPath, '.git'))) {
                return null;
            }

            const git = simpleGit(this.repoPath);
            await git.fetch('--tags');
            const tags = await this.getAllTags(git);
            return tags.length > 0 ? tags[tags.length - 1] : null;
        } catch (error) {
            console.warn('Error getting current tag:', error.message);
            return null;
        }
    }

    /**
     * Rollback to requested tag
     * @param tagName 
     * @returns DeploymentResponseDto
     */
    async rollback(tagName: string): Promise<DeploymentResponseDto> {
        try {
            console.log(`↩️ Starting rollback to tag: ${tagName}`);
            if (fs.existsSync(this.repoPath)) {
                fs.rmSync(this.repoPath, { recursive: true, force: true });
            }
            fs.mkdirSync(this.repoPath, { recursive: true });
            
            const cleanUrl = this.repoUrl.replace('https://', '').replace('@', '');
            const domain = cleanUrl.split('/')[0];
            const repoPathPart = cleanUrl.substring(domain.length);
            const authenticatedUrl = `https://${this.githubToken}@${domain}${repoPathPart}`;
            
            await simpleGit().clone(authenticatedUrl, this.repoPath);
            const git: SimpleGit = simpleGit(this.repoPath);
            
            await git.fetch(['--tags']);
            const tagsList = await git.tags();
            
            if (!tagsList.all.includes(tagName)) {
                throw new Error(`Tag "${tagName}" does not exist in the repository`);
            }
            
            await git.checkout(tagName);
            console.log(`✅ Rollback completed. Repository is now at tag: ${tagName}`);
            
            return { success: true, message: `Rollback completed to tag: ${tagName}` };
        } catch (error) {
            console.error('Rollback error:', error);
            return { success: false, message: `Rollback failed: ${error.message}` };
        }
    }

    
    /**
     * Show Github Tags
     * @returns string[]
     */
    async showTags(): Promise<string[]> {
        try {
            const git = simpleGit(this.repoPath);
            if (!fs.existsSync(path.join(this.repoPath, '.git'))) {
                await this.cloneRepo();
            } else {
                await git.fetch('--tags');
            }
            const tags = await git.tags();
            return tags.all.sort().reverse();
        } catch (error) {
            try {
                const { exec } = require('child_process');
                const { promisify } = require('util');
                const execPromise = promisify(exec);
                const cleanUrl = this.repoUrl.replace('https://', '').replace('@', '');
                const authenticatedUrl = `https://${this.githubToken}@${cleanUrl}`;

                const { stdout } = await execPromise(
                    `git ls-remote --tags ${authenticatedUrl}`
                );

                const tags = stdout
                    .split('\n')
                    .filter(line => line.includes('refs/tags/'))
                    .map(line => {
                        const match = line.match(/refs\/tags\/(.+?)(\^{})?$/);
                        return match ? match[1] : null;
                    })
                    .filter(Boolean)
                    .filter((tag, index, arr) => arr.indexOf(tag) === index);

                return tags.sort().reverse();

            } catch (fallbackError) {
                return [];
            }
        }
    }

    /**
     * Get All Tags
     * @param git 
     * @returns string[]
     */
    async getAllTags(git: SimpleGit): Promise<string[]> {
        const tags = await git.tags();
        return tags.all;
    }

    /**
     * Clone Github Repository
     * @param ref 
     * @returns SimpleGit
     */
    private async cloneRepo(ref?: string): Promise<SimpleGit> {
        const cleanUrl = this.repoUrl.replace('https://', '').replace('@', '');
        const domain = cleanUrl.split('/')[0];
        const repoPathPart = cleanUrl.substring(domain.length);
        const authenticatedUrl = `https://${this.githubToken}@${domain}${repoPathPart}`;

        if (fs.existsSync(this.repoPath)) {
            fs.rmSync(this.repoPath, { recursive: true, force: true });
        }
        fs.mkdirSync(this.repoPath, { recursive: true });

        await simpleGit().clone(authenticatedUrl, this.repoPath);
        const git = simpleGit(this.repoPath);

        if (ref) {
            await git.checkout(ref);
            console.log(`✅ Repository cloned at ${ref}`);
        } else {
            await git.checkout(this.branch);
            console.log(`✅ Repository cloned at branch ${this.branch}`);
        }

        return git;
    }
}
