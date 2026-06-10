import { config } from '../config/index.js';
import { ApiError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  clone_url: string;
  default_branch: string;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

interface GitHubFile {
  name: string;
  path: string;
  content: string;
  encoding: string;
  size: number;
}

interface GitHubBranch {
  name: string;
  commit: { sha: string; url: string };
}

export const githubService = {
  async getAccessToken(code: string): Promise<string> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code,
      }),
    });

    if (!response.ok) {
      throw new ApiError(502, 'GitHub OAuth token exchange failed');
    }

    const data = (await response.json()) as { access_token?: string; error?: string };
    if (data.error) {
      throw new ApiError(400, `GitHub OAuth error: ${data.error}`);
    }

    return data.access_token!;
  },

  async getUserRepos(accessToken: string): Promise<GitHubRepo[]> {
    const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new ApiError(502, 'Failed to fetch GitHub repos');
    }

    return response.json() as Promise<GitHubRepo[]>;
  },

  async getRepoContents(
    accessToken: string,
    owner: string,
    repo: string,
    path: string = '',
  ): Promise<GitHubFile[]> {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    if (!response.ok) {
      throw new ApiError(502, 'Failed to fetch repo contents');
    }

    return response.json() as Promise<GitHubFile[]>;
  },

  async getFileContent(
    accessToken: string,
    owner: string,
    repo: string,
    path: string,
  ): Promise<GitHubFile> {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    if (!response.ok) {
      throw new ApiError(502, 'Failed to fetch file content');
    }

    const data = (await response.json()) as GitHubFile;
    if (data.encoding === 'base64' && data.content) {
      data.content = Buffer.from(data.content, 'base64').toString('utf-8');
    }

    return data;
  },

  async getRepoBranches(accessToken: string, owner: string, repo: string): Promise<GitHubBranch[]> {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    if (!response.ok) {
      throw new ApiError(502, 'Failed to fetch branches');
    }

    return response.json() as Promise<GitHubBranch[]>;
  },

  async createWebhook(
    accessToken: string,
    owner: string,
    repo: string,
    webhookUrl: string,
    events: string[] = ['push', 'pull_request'],
  ): Promise<void> {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/hooks`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'web',
          active: true,
          events,
          config: {
            url: webhookUrl,
            content_type: 'json',
          },
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      logger.error('Failed to create GitHub webhook', { error });
      throw new ApiError(502, 'Failed to create webhook');
    }
  },
};
