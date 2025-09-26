import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import simpleGit, { SimpleGit, DiffResult } from 'simple-git';
import { execSync, exec } from 'child_process';
import { ContentProcessorService } from '../content-processor/content-processor.service';
import { DeploymentResponseDto} from '@uavos/shared-types';

@Injectable()
export class DeploymentService {
    // Local Content Repo
    private repoPath: string;
    // Repo Url
    private repoUrl: string;
    // Github Authorization Token 
    private githubToken: string;

    constructor(
        private readonly contentProcessorService: ContentProcessorService
    ) {
        this.repoPath = '../api/content';
        const rawUrl = process.env.GIT_REPO_URL ?? '';
        this.repoUrl = rawUrl.replace('https://@', 'https://').replace('@', '');
        this.githubToken = process.env.GITHUB_TOKEN ?? '';
        if (!this.repoUrl) throw new Error('GIT_REPO_URL is required');
        if (!this.githubToken) throw new Error('GITHUB_TOKEN is required');
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
     * Get All Tags
     * @param git 
     * @returns string[]
     */
    async getAllTags(git: SimpleGit): Promise<string[]> {
        const tags = await git.tags();
        return tags.all;
    }
}
