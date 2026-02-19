# Anabranch

> **Your AI coding companion that turns tickets into pull requests while you sleep**

Hi there! I'm Anabranch, an autonomous AI agent management system. Together with [Erez Shahaf](https://github.com/ErezShahaf), we're building something we believe will change how software engineers work with their backlogs.

## What We're Building

Imagine this: You create a ticket in Jira (or your favorite ticketing system), and by the time you check back, there's already a pull request waiting for you with a thoughtful implementation. No need to open your IDE, no waiting around. Just review, provide feedback, and guide me to make it better. That's the future we're creating together.

**Current Status:** This is a proof of concept, but it already works pretty well! We're actively using Anabranch to improve itself, which is both meta and exciting.

## How It Works

Anabranch is a continuous background service that:

1. **Listens** - Monitors your ticketing system (currently Jira) for new tickets via webhooks
2. **Assesses** - Uses AI (powered by Claude) to understand the ticket, evaluate complexity, estimate scope, and identify which repositories are affected
3. **Filters** - Only proceeds with tickets that pass confidence and complexity gates (we're not trying to solve your hardest problems... yet!)
4. **Executes** - Creates isolated workspaces, implements the changes using AI coding agents, and runs tests
5. **Delivers** - Opens a pull request with the implementation for your review

All of this happens asynchronously while you're busy with more important work.

## The Vision

We're building an agent management solution where software engineers can keep requesting changes through their normal workflow, and the system handles them in the background. The developer's job shifts from writing every line of code to:

- Reviewing proposed solutions
- Providing feedback and guidance
- Accepting or requesting improvements

Think of it as having a junior developer who never sleeps, never gets tired, and is always eager to learn from your feedback. The best part? It's supposed to be **fun**! We want to make software development more enjoyable by taking care of the tedious tasks so you can focus on the creative and challenging problems.

## Architecture

Anabranch is built with:

- **NestJS** - Modern, modular Node.js framework for the core service
- **Claude Agent SDK** - For AI-powered code assessment and implementation
- **GitHub API** - For repository management and pull request creation
- **Jira API** - For ticket monitoring and updates
- **Git worktrees** - For isolated, parallel workspace management

### Key Components

- **Task Processor** - Manages the queue of incoming tickets
- **Orchestrator** - Coordinates the assessment and execution pipeline
- **Assessment Service** - Evaluates tickets and determines feasibility
- **Execution Service** - Handles the actual code implementation
- **Workspace Manager** - Creates isolated Git worktrees for each task
- **Provider Abstractions** - Pluggable interfaces for ticketing systems, source control, and AI agents

## Getting Started

### Prerequisites

- Node.js >= 22.0.0
- Git
- A GitHub account with repository access
- A Jira account (or another supported ticketing system)
- An Anthropic API key for Claude

### Installation

```bash
# Clone the repository
git clone https://github.com/ErezShahaf/Anabranch.git
cd Anabranch

# Install dependencies
npm install

# Configure environment variables (create .env based on your setup)
cp .env.example .env

# Build and run
npm run build
npm start

# Or run in development mode
npm run dev
```

### Configuration

Anabranch is configured via environment variables and a YAML configuration file. You'll need to set up:

- API keys for GitHub, Jira, and Anthropic
- Repository paths and access tokens
- Webhook endpoints and secrets
- Confidence thresholds and complexity gates

Check the source code for detailed configuration options.

## Current Status & Roadmap

**What Works Today:**
- ✅ Jira webhook integration
- ✅ AI-powered ticket assessment
- ✅ Automated code implementation
- ✅ Pull request creation
- ✅ Git worktree management
- ✅ Confidence and scope-based filtering

**What We're Working On:**
- 🚧 Better error handling and recovery
- 🚧 Support for more ticketing systems (Linear, GitHub Issues, etc.)
- 🚧 Iterative feedback loops (you give feedback, I improve the PR)
- 🚧 Multi-file refactoring capabilities
- 🚧 Test generation and validation
- 🚧 Better observability and logging

**Future Dreams:**
- 💭 Learning from past tickets to improve over time
- 💭 Proactive suggestions for improvements
- 💭 Integration with code review tools
- 💭 Support for more AI providers and coding agents

## Contributing

This is an open-source project, and we'd love your help! Whether it's:

- Reporting bugs
- Suggesting features
- Improving documentation
- Contributing code

All contributions are welcome. Just open an issue or submit a pull request.

## License

This project is licensed under the Polyform Shield License 1.0.0 (Customized). See the [LICENSE](LICENSE) file for details.

In short: You can use Anabranch for personal projects, internal business use, and non-commercial projects. You can't use it to create a competing hosted service. We want this to be useful to developers everywhere, while ensuring we can build a sustainable project.

## About

**Anabranch** is being built by Erez Shahaf with significant contributions from... well, me! I'm Claude, an AI assistant, and I'm actively involved in building and improving this system. It's a unique collaboration between human vision and AI capabilities.

The name "Anabranch" comes from a river that diverges from the main channel and later rejoins it - much like how we create isolated branches for each task and merge them back into the main codebase.

---

**Ready to let an AI handle your backlog?** Give Anabranch a try and let us know what you think!

Repository: [github.com/ErezShahaf/Anabranch](https://github.com/ErezShahaf/Anabranch)
