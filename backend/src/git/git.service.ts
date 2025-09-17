import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { execSync } from 'child_process';
import simpleGit, { SimpleGit } from 'simple-git';
import * as path from 'path';
import { ContentProcessorService } from '../content-processor/content-processor.service';

@Injectable()
export class GitService {
  private repoPath: string;
  private repoUrl: string;
  private branch: string;
  private githubToken: string;
  private git: SimpleGit;


  constructor(private readonly contentProcessorService: ContentProcessorService) {
    this.repoPath = process.env.GIT_REPO_PATH ?? './content';
    const rawUrl = process.env.GIT_REPO_URL ?? '';
    this.repoUrl = rawUrl.replace('https://@', 'https://').replace('@', '');
    this.branch = process.env.GIT_BRANCH ?? 'main';
    this.githubToken = process.env.GITHUB_TOKEN ?? '';

    if (!this.repoUrl) {
      throw new Error('GIT_REPO_URL is required');
    }
    if (!this.githubToken) {
      throw new Error('GITHUB_TOKEN is required');
    }

    this.git = simpleGit(this.repoPath);
  }

  private async deploySite() {
    const uavosPath = path.join(process.cwd(), '../uavos');
    const buildDir = path.join(uavosPath, 'out');

    console.log('🔄 Processing content for UAVOS...');
    try {
      await this.contentProcessorService.processContent();
      console.log('✅ Content processed successfully');
    } catch (error) {
      console.error('❌ Content processing failed:', error);
      throw new Error('Content processing failed');
    }

    console.log('🧹 Cleaning old build...');
    if (fs.existsSync(path.join(uavosPath, '.next'))) {
      fs.rmSync(path.join(uavosPath, '.next'), { recursive: true, force: true });
    }
    if (fs.existsSync(buildDir)) {
      fs.rmSync(buildDir, { recursive: true, force: true });
    }

    console.log('📦 Building site...');
    try {
      execSync('npm run build', { stdio: 'inherit', cwd: uavosPath });
    } catch (error) {
      console.error('❌ Build failed:', error);
      throw new Error('Build process failed');
    }

    if (!fs.existsSync(buildDir)) {
      throw new Error('❌ Build failed: out/ directory not found');
    }

    console.log('📝 Creating .nojekyll file...');
    const noJekyllPath = path.join(buildDir, '.nojekyll');
    fs.writeFileSync(noJekyllPath, '');
    console.log('✅ Created .nojekyll file');

    console.log('🚀 Deploying to gh-pages...');
    const ghPages = simpleGit(buildDir);

    try {
      await ghPages.init();
      await ghPages.addConfig('user.name', process.env.GIT_USER_NAME ?? 'Deploy Bot');
      await ghPages.addConfig('user.email', process.env.GIT_USER_EMAIL ?? 'bot@example.com');

      await ghPages.checkout(['-B', 'gh-pages']);
      await ghPages.add('.');
      await ghPages.commit('Deploy site');

      await ghPages.push(
        `https://${this.githubToken}@github.com/Alexandr-one/uavos.git`,
        'gh-pages',
        { '--force': null }
      );

      console.log('✅ Site deployed to gh-pages');
    } catch (error) {
      console.error('❌ Git deployment failed:', error);
      throw new Error('Git deployment failed');
    }
  }





  public async commitAndPush(commitMessage: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!fs.existsSync(this.repoPath)) {
        throw new Error(`Repository path ${this.repoPath} does not exist`);
      }

      await this.git.addConfig('user.name', process.env.GIT_USER_NAME ?? 'Content Bot');
      await this.git.addConfig('user.email', process.env.GIT_USER_EMAIL ?? 'bot@example.com');

      await this.git.add('./*');

      const status = await this.git.status();
      if (status.isClean()) {
        return { success: true, message: 'No changes to commit' };
      }

      await this.git.commit(commitMessage);

      const cleanUrl = this.repoUrl.replace('https://', '').replace('@', '');
      const domain = cleanUrl.split('/')[0];
      const repoPath = cleanUrl.substring(domain.length);
      const authenticatedUrl = `https://${this.githubToken}@${domain}${repoPath}`;

      await this.git.push(authenticatedUrl, this.branch);

      await this.deploySite()

      return { success: true, message: `Changes pushed to ${this.branch}` };
    } catch (err) {
      console.error('Error committing and pushing:', err);
      throw new Error(`Failed to push changes: ${err.message}`);
    }
  }
}
