import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import simpleGit, { SimpleGit } from 'simple-git';

@Injectable()
export class GitService {
  private repoPath: string;
  private repoUrl: string;
  private branch: string;
  private githubToken: string;
  private git: SimpleGit;

  constructor() {
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
      return { success: true, message: `Changes pushed to ${this.branch}` };
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : JSON.stringify(err);
      console.error('Error committing and pushing:', err);
      throw new Error(`Failed to push changes: ${errorMessage}`);
    }
  }
}