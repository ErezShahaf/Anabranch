# Anabranch

Autonomous AI ticket-to-PR system. Anabranch monitors your ticketing system for new tickets, evaluates whether they can be safely handled by an AI coding agent, and creates pull requests for the ones that can.

## How it works

1. A new ticket is created in Jira (more providers coming).
2. Jira fires a webhook to your Anabranch server.
3. Anabranch filters the ticket against your configured rules (project, labels, issue type, assignee).
4. The configured AI agent (Claude Code or Cursor CLI) assesses the ticket: is it confident it can do it? Is the scope trivial enough that no critical decisions need to be made?
5. If the assessment passes, the agent implements the changes in an isolated git worktree.
6. Tests are run. If they pass, a pull request is created on GitHub.
7. If the ticket affects multiple repositories, one PR is created per repo, all cross-linked.

## Prerequisites

- **Node.js 22+**
- **Docker** (for containerised deployment)
- A **GitHub App** installed on your organisation (for repository access and PR creation)
- A **Jira Cloud** instance with webhook access
- An API key for your chosen AI agent:
  - `ANTHROPIC_API_KEY` for Claude Code
  - `CURSOR_API_KEY` for Cursor CLI

## Quick start

### 1. Create a GitHub App

In your GitHub organisation, go to **Settings > Developer settings > GitHub Apps > New GitHub App**.

Required permissions:
- **Repository permissions**: Contents (Read & Write), Pull requests (Read & Write)
- **Subscribe to events**: (none required for this app)

After creating the app:
- Note the **App ID**
- Generate and download a **private key** (`.pem` file) — paste its contents into `GITHUB_APP_PRIVATE_KEY`
- Install the app on your organisation and note the **Installation ID**

### 2. Configure Jira webhooks

In your Jira Cloud project, go to **Settings > System > Webhooks** and create a webhook pointing to:

```
https://your-server:3000/webhooks/jira
```

Select the **Issue created** event. Optionally set a webhook secret for HMAC signature verification.

### 3. Set up environment

```bash
cp .env.example .env
# Edit .env with your actual values
```

Set `GITHUB_APP_PRIVATE_KEY` to your GitHub App private key PEM content (use `\n` for newlines if stored as a single line).

### 4. Configure

Edit `config/default.yaml` to set:
- Which AI agent to use (`agent.provider`)
- Confidence thresholds and scope limits
- Jira project filters and label rules

### 5. Run

**With Docker Compose:**

```bash
docker compose up -d
```

**Without Docker:**

```bash
npm install
npm run build
npm start
```

**For development:**

```bash
npm install
npm run dev
```

## Configuration

All configuration lives in `config/default.yaml`. Secrets are passed via environment variables -- never put API keys in the config file.

See `config/config.schema.json` for the full schema with validation rules.

### Key settings

| Setting | Description | Default |
|---|---|---|
| `agent.provider` | AI agent to use: `claude-code` or `cursor` | `claude-code` |
| `agent.assessment.confidenceThreshold` | Minimum confidence (0-100) to proceed | `80` |
| `agent.assessment.maxScope` | Maximum task scope: `trivial`, `small`, `medium`, `large`, `architectural` | `small` |
| `agent.execution.retries` | Number of retries on failure | `3` |
| `ticketing.jira.filters.labels` | Only process tickets with all of these labels | `[]` (all) |
| `ticketing.jira.filters.excludeLabels` | Skip tickets with any of these labels | `[]` |

## Architecture

```
Jira Webhook ─> Express Server ─> TicketProvider ─> TaskQueue ─> Orchestrator
                                                                      │
                                                        ┌─────────────┼─────────────┐
                                                        ▼             ▼             ▼
                                                   Assessment    Execution    PR Creation
                                                   (AI Agent)   (AI Agent)   (GitHub App)
```

The codebase is built around three abstractions designed for extensibility:

- **TicketProvider** -- Jira today, Linear and GitHub Issues in the future.
- **CodingAgent** -- Claude Code and Cursor CLI today, more agents later.
- **SourceControlProvider** -- GitHub today, GitLab in the future.

## Project structure

```
src/
  index.ts                              Entry point
  core/
    types.ts                            Shared types and interfaces
    configuration.ts                    YAML config loader with env var substitution
    logger.ts                           Pino structured logger
    orchestrator.ts                     Main pipeline: assess -> execute -> PR
    queue/
      taskQueue.ts                      TaskQueue interface
      inMemoryTaskQueue.ts              Sequential in-memory implementation
  providers/
    ticketing/
      base.ts                           Abstract TicketProvider
      jira/
        provider.ts                     Jira Cloud webhook handler
        types.ts                        Jira payload types
    agents/
      base.ts                           Abstract CodingAgent
      factory.ts                        Creates the configured agent
      claudeCode/agent.ts              Claude Code SDK implementation
      cursor/agent.ts                   Cursor CLI implementation
      prompts/
        assessment.ts                   Assessment prompt template
        execution.ts                    Execution prompt template
    sourceControl/
      base.ts                           Abstract SourceControlProvider
      github/provider.ts               GitHub App + Octokit implementation
  workspace/
    manager.ts                          Git clone, worktree, and cleanup management
  server/
    app.ts                              Express server with health/status endpoints
    webhookRouter.ts                    Webhook route registration
config/
  default.yaml                          Default configuration
  config.schema.json                    JSON Schema for config validation
```

## License

See [LICENSE](LICENSE) for details.
