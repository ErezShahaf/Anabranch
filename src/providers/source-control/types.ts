export interface Repository {
  name: string;
  fullName: string;
  cloneUrl: string;
  defaultBranch: string;
  description: string | null;
  private: boolean;
}

export interface CreatePullRequestParameters {
  owner: string;
  repositoryName: string;
  title: string;
  body: string;
  headBranch: string;
  baseBranch: string;
}

export interface PullRequest {
  number: number;
  url: string;
  title: string;
  headBranch: string;
  baseBranch: string;
}
