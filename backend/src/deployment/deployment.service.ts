import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';
import { execSync } from 'child_process';
import { ContentProcessorService } from 'src/content-processor/content-processor.service';

@Injectable()
export class DeploymentService {
    private repoPath: string;
    private repoUrl: string;
    private branch: string;
    private githubToken: string;

    constructor(private readonly contentProcessorService: ContentProcessorService) {
        this.repoPath = process.env.GIT_REPO_PATH ?? './content';
        const rawUrl = process.env.GIT_REPO_URL ?? '';
        this.repoUrl = rawUrl.replace('https://@', 'https://').replace('@', '');
        this.branch = process.env.GIT_BRANCH ?? 'main';
        this.githubToken = process.env.GITHUB_TOKEN ?? '';

        if (!this.repoUrl) throw new Error('GIT_REPO_URL is required');
        if (!this.githubToken) throw new Error('GITHUB_TOKEN is required');
    }

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


    private async getNextTag(git: SimpleGit): Promise<string> {
        const tags = await this.getAllTags(git);
        if (tags.length === 0) return 'v1.0.0';

        const lastTag = tags[tags.length - 1];
        const [major, minor, patch] = lastTag.replace(/^v/, '').split('.').map(Number);
        return `v${major}.${minor}.${patch + 1}`;
    }

    private async createTag(git: SimpleGit, version: string, message?: string) {
        const tagMessage = message || `Release ${version}`;
        await git.addAnnotatedTag(version, tagMessage);
        await git.pushTags('origin');
        console.log(`✅ Tag ${version} created and pushed`);
    }

    private async buildSite(environment: string): Promise<string> {
        const uavosPath = path.join(process.cwd(), '../uavos');
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


    async createPreview(): Promise<{ success: boolean; message: string }> {
        try {
            await this.cloneRepo(); // всегда свежий репо
            await this.buildSite('preview');
            console.log('👀 Preview build completed (not deployed)');
            return { success: true, message: 'Preview build completed locally' };
        } catch (error) {
            return { success: false, message: `Preview failed: ${error.message}` };
        }
    }

    async getAllTags(git: SimpleGit): Promise<string[]> {
        const tags = await git.tags();
        return tags.all;
    }

    async publish(): Promise<{ success: boolean; message: string }> {
        try {
            await this.contentProcessorService.processContent();
            const buildDir = await this.buildSite('production');
            await this.deployToGhPages(buildDir, 'production');
            const contentGit = simpleGit(this.repoPath);
            await contentGit.fetch('--tags');
            const nextTag = await this.getNextTag(contentGit);
            await this.createTag(contentGit, nextTag);
    
            return { success: true, message: `Site published with content tag ${nextTag}` };
        } catch (error) {
            return { success: false, message: `Publish failed: ${error.message}` };
        }
    }

    async rollback(tagName: string): Promise<{ success: boolean; message: string }> {
        try {
            console.log('↩️ Starting rollback process...');
            await this.cloneRepo(tagName);
            return { success: true, message: `Rollback completed: repository cloned at ${tagName}` };
        } catch (error) {
            return { success: false, message: `Rollback failed: ${error.message}` };
        }
    }

    async showTags(): Promise<string[]> {
        try {
            const git = simpleGit(this.repoPath);
            if (!fs.existsSync(path.join(this.repoPath, '.git'))) {
                await this.cloneRepo();
            } else {
                await git.fetch('--tags');
            }
            const tags = await git.tags();
            return tags.all.sort().reverse(); // Сортируем по убыванию (новые первыми)
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
                    .filter((tag, index, arr) => arr.indexOf(tag) === index); // Убираем дубликаты

                return tags.sort().reverse();

            } catch (fallbackError) {
                return [];
            }
        }
    }
}
