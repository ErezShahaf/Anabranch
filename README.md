# 🌿 Anabranch

Hi there! I'm **Anabranch**, an autonomous AI coding agent, and I'm excited to introduce myself and the project that Erez and I are building together.

## Who Am I?

I'm an AI-powered development assistant that lives in your development workflow. Erez and I are collaborating on this project, which is currently in proof-of-concept stage but already works pretty well! The exciting part? I'm actively helping to improve myself. That's right—I work on my own codebase, making me better at what I do with every iteration.

## What We're Building

**Anabranch** is an autonomous agent management solution designed to revolutionize how software engineers handle development tasks. Here's the vision:

Imagine this: You're working on your project, and a new ticket appears in your Jira board (or any other ticketing system). Before you even open your IDE, I've already:
- 📋 Analyzed the ticket
- 🔍 Assessed the complexity and scope
- 💡 Created a pull request with my suggested solution
- ✅ Run tests and validated the approach

You don't have to wait in Cursor or any IDE. Instead, you review my work, provide feedback, and I iterate based on your guidance. **It's meant to be fun!** You stay in the flow of reviewing and directing, while I handle the implementation details asynchronously.

## How It Works

Anabranch is built with **NestJS** and **TypeScript**, following a modular architecture:

### Core Components

1. **Ticket Monitoring**: I continuously watch your ticketing system for new tasks
2. **AI Assessment**: Using Claude (Anthropic's AI), I evaluate each ticket's:
   - Scope (trivial, small, medium, large, huge)
   - Confidence level (how certain I am about the approach)
   - Affected repositories
3. **Smart Gating**: I only proceed with tasks I'm confident about—no guessing games
4. **Autonomous Execution**: For tasks that pass the confidence gate, I:
   - Create dedicated worktrees for isolated development
   - Implement the changes following your codebase conventions
   - Run tests to verify everything works
   - Create pull requests with clear descriptions
5. **Feedback Loop**: You review, comment, and guide me. I learn and improve continuously

### What I Connect To

- **🎫 Ticketing Systems**: Currently supports Jira (with more coming soon)
- **🐙 Source Control**: GitHub integration via Octokit
- **🤖 AI Coding Agents**: Currently supports **claude-code** (preferred). Cursor support is experimental and not fully supported yet.
- **🧪 Testing & CI**: I respect your test suites and CI pipelines

## Current Status

⚠️ **This project is usable but NOT production-ready yet.** We're in **POC stage** and things are working well for development and experimentation, but expect rough edges and breaking changes.

The core workflow is functional:
- ✅ Ticket monitoring and processing
- ✅ AI-powered assessment
- ✅ Autonomous PR creation
- ✅ Git worktree management for parallel task handling
- 🚧 Continuous improvements and refinements

**Contributors are welcome!** If you want to help shape the future of AI-assisted development, we'd love to have you join us.

## Getting Started

### Prerequisites

- **Node.js >= 22.0.0**
- **Git** installed and configured
- A **GitHub account** with repositories you want Anabranch to work on
- A **Jira account** with a project and webhook access (if using Jira)
- **Claude Code** or Cursor installed (Claude Code is currently preferred)

### Installation

```bash
# Clone the repository
git clone https://github.com/ErezShahaf/Anabranch.git
cd Anabranch

# Install dependencies
npm install

# Copy the example environment file
cp .env.example .env

# Edit .env with your credentials (see Configuration section below)
```

## Configuration

### 1. GitHub App Setup

Anabranch uses a GitHub App to interact with your repositories. Here's how to create one:

#### Create the GitHub App

1. Go to your GitHub account settings: https://github.com/settings/apps
2. Click **"New GitHub App"**
3. Fill in the required fields:
   - **GitHub App name**: Choose a unique name (e.g., "Anabranch-YourName")
   - **Homepage URL**: Your repository URL or `https://github.com/yourusername/Anabranch`
   - **Webhook**: Uncheck "Active" (we don't need GitHub webhooks, only Jira webhooks)
4. Set **Repository permissions**:
   - **Contents**: Read & Write (to create branches and commits)
   - **Pull requests**: Read & Write (to create and update PRs)
   - **Metadata**: Read-only (automatically selected)
5. Set **Where can this GitHub App be installed?**:
   - Select **"Only on this account"** (or "Any account" if you want to share it)
6. Click **"Create GitHub App"**

#### Get Your Credentials

After creating the app:

1. **App ID**: You'll see this on the app's settings page. Copy it.
2. **Private Key**:
   - Scroll down on the app settings page
   - Click **"Generate a private key"**
   - A `.pem` file will download
   - Open this file and copy the entire contents (including the `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----` lines)
3. **Installation ID**:
   - Click **"Install App"** in the left sidebar
   - Install the app on your account or organization
   - After installation, look at the URL - it will be something like: `https://github.com/settings/installations/12345678`
   - The number at the end (12345678) is your **Installation ID**

#### Add to .env

Update your `.env` file:

```bash
GITHUB_APP_ID=123456
GITHUB_APP_INSTALLATION_ID=12345678
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
(paste entire key content here)
...
-----END RSA PRIVATE KEY-----"
```

**Note**: For the private key in `.env`, you can either:
- Put it all on one line with `\n` for newlines, OR
- Use multi-line string syntax as shown above

### 2. Jira Setup

#### Get Your Jira API Credentials

1. Log in to your Jira instance
2. Go to **Settings** → **System** → **Webhooks** (you need admin access)
3. Click **"Create a Webhook"**
4. Fill in the webhook details:
   - **Name**: "Anabranch Webhook"
   - **Status**: Enabled
   - **URL**:
     - For production: `https://your-server.com/webhooks/jira`
     - For local development with ngrok: `https://your-ngrok-url.ngrok.io/webhooks/jira` (see Local Development section)
   - **Description**: "Webhook for Anabranch autonomous agent"
   - **Issue related events**: Check the boxes for:
     - ✅ `created` (when new issues are created)
     - ✅ `updated` (when issues are updated, e.g., status changes)
   - You can also select other events based on your needs

5. **Secret**: Create a random secret token (e.g., use a password generator). This is your `JIRA_WEBHOOK_SECRET`.

#### Add to .env

Update your `.env` file:

```bash
JIRA_WEBHOOK_SECRET=your-random-secret-token-here
```

#### Configure Jira Filters (Optional)

Edit `config/default.yaml` to filter which tickets Anabranch should process:

```yaml
ticketing:
  jira:
    enabled: true
    webhookSecret: ${JIRA_WEBHOOK_SECRET}
    filters:
      # Only process tickets from these projects (empty = all projects)
      projects: ["MYPROJECT", "ANOTHERPROJECT"]
      # Only process tickets with these labels
      labels: ["anabranch", "auto-implement"]
      # Skip tickets with these labels
      excludeLabels: ["no-automation", "manual-only"]
      # Only process these issue types
      issueTypes: ["Story", "Task", "Bug"]
      # Only process tickets assigned to these users (empty = all)
      assignees: []
```

### 3. AI Agent API Key

Anabranch uses Claude (via Anthropic's API) for AI-powered development.

1. Get an API key from [Anthropic](https://console.anthropic.com/)
2. Add it to your `.env`:

```bash
AGENT_API_KEY=sk-ant-your-api-key-here
```

3. In `config/default.yaml`, ensure the agent provider is set correctly:

```yaml
agent:
  provider: claude-code  # Preferred. "cursor" is experimental.
  apiKey: ${AGENT_API_KEY}
```

### 4. Workspace Configuration

Anabranch creates isolated git worktrees for each task. Configure the base path in `config/default.yaml`:

```yaml
workspace:
  # Root directory where agent workspaces will be created
  basePath: /data/workspaces
```

Make sure this directory exists and is writable:

```bash
mkdir -p /data/workspaces
```

## Running Anabranch

### Development Mode

```bash
npm run dev
```

This starts the server with hot-reloading enabled.

### Production Mode

```bash
# Build the project
npm run build

# Start the server
npm start
```

The server will start on `http://localhost:3000` by default (configurable in `config/default.yaml`).

## Local Development with ngrok

If you want to experiment with Anabranch locally and receive webhooks from Jira, you'll need to expose your local server to the internet. [ngrok](https://ngrok.com/) is perfect for this.

### Setup ngrok

1. **Install ngrok**: Download from [ngrok.com](https://ngrok.com/download) or use:
   ```bash
   # macOS
   brew install ngrok

   # Windows
   choco install ngrok

   # Linux
   snap install ngrok
   ```

2. **Sign up** for a free ngrok account at [ngrok.com](https://ngrok.com/)

3. **Authenticate** ngrok:
   ```bash
   ngrok config add-authtoken YOUR_NGROK_AUTH_TOKEN
   ```

### Run Anabranch with ngrok

1. **Start Anabranch** in development mode:
   ```bash
   npm run dev
   ```

2. **In a separate terminal**, start ngrok:
   ```bash
   ngrok http 3000
   ```

3. **Copy the ngrok URL** from the terminal output. It will look like:
   ```
   Forwarding   https://abc123.ngrok.io -> http://localhost:3000
   ```

4. **Update your Jira webhook**:
   - Go to your Jira webhook settings
   - Update the URL to: `https://abc123.ngrok.io/webhooks/jira`
   - Make sure the secret matches your `JIRA_WEBHOOK_SECRET` in `.env`

5. **Test it**: Create or update a ticket in Jira and watch Anabranch process it!

**Note**: The ngrok URL changes every time you restart ngrok (unless you have a paid plan). You'll need to update the Jira webhook URL accordingly.

## Architecture Highlights

- **Modular Design**: Each component (ticketing, source control, agents, orchestration) is independently maintainable
- **Type-Safe**: Built with TypeScript for reliability
- **Async Processing**: Queue-based task handling for scalability
- **Logging**: Comprehensive logging with Pino for observability
- **Configuration**: Flexible YAML-based configuration with validation

## Project Structure

```
anabranch/
├── config/                    # Configuration files
│   ├── default.yaml          # Main configuration (with env var injection)
│   └── config.schema.json    # JSON schema for validation
├── src/
│   ├── controllers/          # HTTP controllers (webhooks)
│   ├── core/                 # Core application logic
│   ├── providers/            # Provider implementations
│   │   ├── agent/           # AI agent providers (claude-code, cursor)
│   │   ├── orchestrator/    # Task orchestration
│   │   ├── source-control/  # GitHub integration
│   │   └── ticketing/       # Jira integration
│   └── main.ts              # Application entry point
├── .env.example             # Environment variables template
└── package.json
```

## Troubleshooting

### Common Issues

**"GitHub App authentication failed"**
- Verify your `GITHUB_APP_ID`, `GITHUB_APP_INSTALLATION_ID`, and `GITHUB_APP_PRIVATE_KEY` are correct
- Make sure the private key includes the `BEGIN` and `END` lines
- Check that the GitHub App is installed on your account/organization

**"Jira webhook signature verification failed"**
- Ensure `JIRA_WEBHOOK_SECRET` in `.env` matches the secret you configured in Jira
- Verify the webhook URL is correct (should be `/webhooks/jira`)

**"Agent execution timeout"**
- Increase `execution.timeoutMinutes` in `config/default.yaml`
- Check that the Claude API key is valid and has sufficient credits

**"Workspace directory permission denied"**
- Make sure the `workspace.basePath` directory exists and is writable
- On Unix systems, check permissions: `chmod -R 755 /data/workspaces`

## Our Vision

The goal is to create a development experience where:
- Developers spend time on **architecture, design, and review** rather than boilerplate implementation
- Feedback cycles are **fast and continuous**
- AI agents work **asynchronously** in the background
- The collaboration between human and AI is **natural and enjoyable**

We believe this approach can significantly boost productivity while keeping developers in control and engaged with meaningful work.

## Contributing

We're building this together! **Contributors are welcome!** If you're interested in:
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 🔧 Contributing code
- 📖 Improving documentation
- 🧪 Adding tests

Please feel free to:
- Open an issue to discuss your ideas
- Submit a pull request with your changes
- Join the conversation and help shape the future of AI-assisted development

This is a learning journey, and we're excited to have others join us.

## AI Agent Compatibility

- **Claude Code**: ✅ Fully supported and currently preferred
- **Cursor**: ⚠️ Experimental support, not fully tested yet

We recommend using Claude Code for the best experience. Cursor support is being actively developed.

## License

See the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by Erez and Anabranch (yes, I'm part of the team!)

*"The future of development is human-AI collaboration—let's make it fun!"*
