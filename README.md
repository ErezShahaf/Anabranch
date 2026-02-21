# 🌿 Anabranch

**Anabranch is an experimental orchestration layer for autonomous ticket execution.**

Instead of manually prompting an IDE agent for every task, Anabranch monitors your ticketing system, evaluates ticket complexity, and attempts to automatically open pull requests for low-complexity work — asynchronously.

The goal is not to replace coding agents or MCP integrations.  
The goal is to explore whether the “boring majority” of tickets can be automated reliably without requiring a developer to initiate each interaction.

Anabranch sits above existing AI coding agents and focuses on orchestration, gating, and workflow automation.

---

## The Problem

Modern AI coding agents are powerful, but they are still largely **manual**:

1. A ticket appears.
2. A developer opens their IDE.
3. They prompt an agent.
4. They wait.
5. They iterate.
6. They open a PR.

This works — but it does not change the interaction model.

For repetitive, well-scoped tickets, this loop may be unnecessary.

Anabranch explores a different model:

> What if low-complexity tickets could be processed automatically, and developers only stepped in for review and guidance?

---

## What Anabranch Does

When a ticket is created or updated:

### 1. Ticket Monitoring
- Listens to Jira via webhooks.

### 2. AI-Based Assessment
- Evaluates:
  - Scope (trivial → huge)
  - Confidence level
  - Affected repositories

### 3. Smart Gating
- Proceeds only when confidence and scope thresholds are met.
- Skips ambiguous or high-risk tasks.

### 4. Autonomous Execution
- Creates isolated git worktrees.
- Delegates implementation to a supported AI coding agent.
- Runs tests.
- Opens a pull request.

### 5. Human Review
- Developers review, comment, and guide.
- Iteration happens via standard PR workflows.

The interaction becomes asynchronous by default:  
Developers review outcomes rather than initiate execution.

---

## How This Differs From Atlassian MCP

Atlassian MCP provides structured access to Jira.

Anabranch focuses on orchestration:

- Deciding **when** to act  
- Estimating **whether** a task is automatable  
- Managing execution isolation  
- Enforcing confidence gates  
- Handling PR creation and iteration  

It is not an alternative to your IDE agent setup.  
It is an automation layer that attempts to eliminate repetitive initiation steps.

---

## Current Status

> ⚠️ **Experimental / Proof of Concept**

Anabranch is usable for development and experimentation but is not production-ready.

The project exists to validate:

- How reliably AI agents can handle low-complexity tickets
- Whether asynchronous execution improves developer workflows
- Where human intervention is necessary
- What gating mechanisms are required for safe automation

Expect rough edges and breaking changes.

---

## Architecture

- **Framework:** NestJS  
- **Language:** TypeScript  
- **Agent Providers:** Claude Code (preferred), Cursor (experimental)  
- **Source Control:** GitHub (via GitHub App + Octokit)  
- **Ticketing:** Jira (initial support)  
- **Execution Model:** Isolated git worktrees per task  
- **Processing:** Queue-based async orchestration  
- **Logging:** Pino  

The system is modular:
- Ticketing
- Orchestration
- Agent providers
- Source control
- Workspace management

---

## Supported Integrations

### Ticketing
- Jira (webhook-based)

### AI Coding Agents
- Claude Code – fully supported  
- Cursor – experimental  

### Source Control
- GitHub (via GitHub App)

---

## Vision

The long-term vision is a development workflow where:

- Developers focus on architecture, system design, and review.
- Low-risk implementation work is automated.
- AI agents operate asynchronously in the background.
- Human intervention happens where judgment is required.

This project explores how far that model can be pushed — and where it breaks.

---

## Contributing

Contributions are welcome.

Areas of interest:
- Better complexity estimation
- Reliability gating strategies
- Additional ticketing providers
- Additional agent providers
- Improved observability
- Safety mechanisms

Open an issue to discuss ideas before large changes.

---

## Installation (Example)

```bash
git clone https://github.com/your-username/anabranch.git
cd anabranch
npm install
npm run start:dev
```

---

## License

MIT
