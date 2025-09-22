import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import simpleGit, { SimpleGit } from 'simple-git';

@Injectable()
export class GitSyncService {
  private repoPath: string;
  private repoUrl: string;
  private branch: string;
  private githubToken: string;

  constructor() {
    this.repoPath = process.env.GIT_REPO_PATH ?? '';
    const rawUrl = process.env.GIT_REPO_URL ?? '';
    this.repoUrl = rawUrl.replace('https://@', 'https://').replace('@', '');
    this.branch = process.env.GIT_BRANCH ?? '';
    this.githubToken = process.env.GITHUB_TOKEN ?? '';

    if (!this.repoUrl) {
      throw new Error('GIT_REPO_URL is required');
    }
    if (!this.githubToken) {
      throw new Error('GITHUB_TOKEN is required');
    }
  }

  public async syncRepo(): Promise<SimpleGit> {
    const git = await this.getAuthenticatedGit();

    try {
      await git.fetch();
      await git.checkout(this.branch);
      await git.pull('origin', this.branch);
      console.log(`Repository synced to branch: ${this.branch}`);
    } catch (err) {
      console.error('Error syncing repo:', err);
    }

    return git;
  }

  private async getAuthenticatedGit(): Promise<SimpleGit> {
    const cleanUrl = this.repoUrl.replace('https://', '').replace('@', '');
    const domain = cleanUrl.split('/')[0];
    const repoPath = cleanUrl.substring(domain.length);
    const authenticatedUrl = `https://${this.githubToken}@${domain}${repoPath}`;
    console.log('Using URL:', authenticatedUrl);
    if (fs.existsSync(this.repoPath)) {
      fs.rmSync(this.repoPath, { recursive: true, force: true });
    }
    fs.mkdirSync(this.repoPath, { recursive: true });
    await simpleGit().clone(authenticatedUrl, this.repoPath);
    const git = simpleGit(this.repoPath);

    await git.checkout(this.branch);
    console.log('Full repository clone completed');
    return git;
  }
}
