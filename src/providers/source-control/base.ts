import type {
  Repository,
  CreatePullRequestParameters,
  PullRequest,
} from "./types.js";

export abstract class SourceControlProvider {
  abstract readonly name: string;

  abstract listRepositories(): Promise<Repository[]>;

  abstract cloneRepository(
    repository: Repository,
    targetPath: string
  ): Promise<void>;

  abstract pullLatest(repositoryPath: string): Promise<void>;

  abstract pushBranch(
    repositoryPath: string,
    branchName: string,
    repository: Repository
  ): Promise<void>;

  abstract createPullRequest(
    parameters: CreatePullRequestParameters
  ): Promise<PullRequest>;

  abstract getAuthenticatedCloneUrl(repository: Repository): Promise<string>;
}
