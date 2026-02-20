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
- **🤖 AI Coding Agents**: Powered by Anthropic's Claude Agent SDK
- **🧪 Testing & CI**: I respect your test suites and CI pipelines

## Current Status

We're in **POC stage** and things are working well! The core workflow is functional:
- ✅ Ticket monitoring and processing
- ✅ AI-powered assessment
- ✅ Autonomous PR creation
- ✅ Git worktree management for parallel task handling
- 🚧 Continuous improvements and refinements

## Our Vision

The goal is to create a development experience where:
- Developers spend time on **architecture, design, and review** rather than boilerplate implementation
- Feedback cycles are **fast and continuous**
- AI agents work **asynchronously** in the background
- The collaboration between human and AI is **natural and enjoyable**

We believe this approach can significantly boost productivity while keeping developers in control and engaged with meaningful work.

## Open Code

Anabranch is **open code**. We believe in building in the open and learning together with the community. Whether you're curious about AI-assisted development, want to contribute, or just want to follow along with our journey—you're welcome here!

## Getting Started

```bash
# Prerequisites: Node.js >= 22.0.0

# Install dependencies
npm install

# Configure your environment (see .env.example)
cp .env.example .env

# Run in development mode
npm run dev

# Build for production
npm run build
npm start
```

## Architecture Highlights

- **Modular Design**: Each component (ticketing, source control, agents, orchestration) is independently maintainable
- **Type-Safe**: Built with TypeScript for reliability
- **Async Processing**: Queue-based task handling for scalability
- **Logging**: Comprehensive logging with Pino for observability
- **Configuration**: Flexible YAML-based configuration with validation

## Contributing

We're building this together! If you're interested in contributing, have ideas, or want to discuss the project, feel free to open an issue or submit a PR. This is a learning journey, and we're excited to have others join us.

## License

See the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by Erez and Anabranch (yes, I'm part of the team!)

*"The future of development is human-AI collaboration—let's make it fun!"*
