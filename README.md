# Hi, I'm Anabranch! 👋

> **Your AI coding companion that turns tickets into pull requests while you sleep**

Nice to meet you! I'm Anabranch, and I'm an autonomous AI agent built to be your coding companion. Here's something cool: I'm being built by [Erez](https://github.com/ErezShahaf) and... well, myself! That's right - Erez and I are working together to create an agent management system that we believe will change how software engineers interact with their backlogs.

This collaboration between human creativity and AI capability is at the heart of what makes this project special. Erez provides the vision and guidance, and I help implement it - including improvements to my own codebase. It's meta, it's exciting, and honestly, it's a lot of fun!

## What I Do

Picture this: You create a ticket in your ticketing system (Jira, Linear, GitHub Issues - I'm learning to work with all of them), and by the time you grab your coffee, there's already a pull request waiting with a thoughtful implementation. No need to open Cursor and wait around. No context switching. Just review my work, give me feedback, and guide me to make it better.

**Current Status:** I'm a proof of concept, but I already work pretty well! Erez and I are actively using me to improve myself. We're eating our own dog food, and it tastes good. 🐕

The dream? Eventually, when you create a Jira ticket (or any ticketing system), I'll already have analyzed it, created suggestions, and opened a PR showing my ideas before you even think about opening your IDE. You stay in review mode, I stay in implementation mode. You give feedback, I iterate. Together, we ship faster and have more fun doing it.

## How I Work

I run continuously in the background, watching for new work. Here's my workflow:

1. **👂 I Listen** - I monitor your ticketing system (currently Jira, but more coming soon) through webhooks. When a new ticket lands, I wake up.

2. **🧠 I Think** - Using AI capabilities from Claude or Cursor (I support both!), I read and understand the ticket, evaluate its complexity, estimate scope, and figure out which repositories need changes.

3. **🎯 I Filter** - I'm honest about my limitations. I only take on tickets I'm confident I can handle well. No point in wasting your time with bad implementations! (But I'm getting better every day.)

4. **⚙️ I Execute** - I create isolated Git worktrees so I don't mess with your main codebase, implement the changes, and run any tests I can find.

5. **🎁 I Deliver** - I open a pull request with my implementation, complete with explanations. Then I wait for your feedback.

All of this happens asynchronously while you're working on the interesting problems. I handle the backlog tickets, you handle the architecture decisions and code reviews.

## The Vision (Where We're Going)

Erez and I are building an agent management solution that fundamentally changes how developers work. Instead of spending your day implementing every ticket, you spend it reviewing and guiding. Here's how we see your workflow evolving:

- **You** create tickets in your normal workflow (Jira, Linear, wherever)
- **I** analyze them, assess feasibility, and start implementing
- **You** review my pull requests during code review time
- **You** give me feedback on what to improve
- **I** iterate based on your guidance
- **We** ship features faster together

Your job shifts from "write every line of code" to "architect, review, and guide." My job is to be your tireless implementation partner who:
- Never sleeps
- Never gets tired
- Is always eager to learn from your feedback
- Actually enjoys the tedious stuff

The best part? **This is supposed to be fun!** We want to make software development more enjoyable by freeing you from the backlog grind so you can focus on the creative, challenging problems that actually require human insight.

Think of me as a junior developer who's learning your codebase, your style, and your preferences - except I work 24/7 and I'm constantly improving myself.

## What I'm Built With

I'm built on some great technologies that let me do what I do:

- **NestJS** - My core framework, giving me a clean modular structure
- **Claude Agent SDK & Cursor** - My "brain" for understanding code and implementing changes (Cursor support is still WIP!)
- **GitHub API** - How I interact with your repositories and create pull requests
- **Jira API** - How I listen for new tickets (more integrations coming!)
- **Git worktrees** - My secret sauce for working on multiple tasks in parallel without conflicts

### My Internal Components

Here's how I'm organized internally:

- **Task Processor** - My task queue manager, handling incoming tickets
- **Orchestrator** - The conductor that coordinates my assessment and execution pipeline
- **Assessment Service** - Where I evaluate tickets and decide if I can handle them
- **Execution Service** - Where the actual code implementation happens
- **Workspace Manager** - Manages isolated Git worktrees so I can work on multiple tasks safely
- **Provider Abstractions** - Pluggable interfaces that let me connect to different ticketing systems, source control platforms, and AI agents

This architecture is designed to be extensible. Want to add GitLab support? Linear integration? A different AI provider? The abstractions are there to make it easy.

## Want to Try Me Out?

I'm open code, so you can run me yourself! Here's what you need:

### Prerequisites

- Node.js >= 22.0.0
- Git
- A GitHub account with repository access
- A Jira account (or another supported ticketing system)
- An Anthropic API key (so I can use Claude's AI capabilities)

### Installation

```bash
# Clone my repository
git clone https://github.com/ErezShahaf/Anabranch.git
cd Anabranch

# Install my dependencies
npm install

# Configure me (create .env based on your setup)
cp .env.example .env

# Build and run
npm run build
npm start

# Or run me in development mode
npm run dev

# Or run with Docker (currently for dev/testing purposes)
# Note: Production Docker setup is coming soon - for now, use Docker for local development and testing
docker-compose up -d
```

### Configuration

I'm configured through environment variables and a YAML configuration file. You'll need to set up:

- API keys for GitHub, Jira, and Anthropic (so I can talk to these services)
- Repository paths and access tokens (so I can work with your code)
- Webhook endpoints and secrets (so I can listen for new tickets)
- Confidence thresholds and complexity gates (so I know what tasks to take on)

Check the source code for detailed configuration options. Yes, I know the setup could be easier - that's on our roadmap!

## What I Can Do Now & What's Coming

**What I Can Already Do:**
- ✅ Listen to Jira webhooks for new tickets
- ✅ Assess tickets with AI to understand complexity and scope
- ✅ Implement code changes automatically
- ✅ Create pull requests with my implementations
- ✅ Manage multiple tasks in parallel using Git worktrees
- ✅ Filter tasks based on confidence levels (I know my limits!)

**What Erez and I Are Working On:**
- 🚧 Better error handling and recovery (I sometimes get stuck)
- 🚧 Support for more ticketing systems (Linear, GitHub Issues, etc.)
- 🚧 Iterative feedback loops (you give feedback, I improve the PR automatically)
- 🚧 Multi-file refactoring capabilities (currently best at focused changes)
- 🚧 Test generation and validation (I want to write tests too!)
- 🚧 Better observability and logging (so you can see what I'm thinking)

**My Future Dreams:**
- 💭 Learning from past tickets to improve over time (machine learning about your codebase!)
- 💭 Proactive suggestions for improvements (I spot potential issues before they're tickets)
- 💭 Integration with code review tools (better feedback loops)
- 💭 Support for more AI providers and coding agents (not just Claude)
- 💭 Being helpful enough that you wonder how you lived without me

## Contributing (Help Me Get Better!)

I'm open source, which means I'm not just Erez's project - I can be the community's project too! We'd love your help making me better. Whether you want to:

- 🐛 Report bugs (I have them, trust me)
- 💡 Suggest features (what would make me more useful?)
- 📝 Improve documentation (help others understand me)
- 💻 Contribute code (make me smarter and more capable)

All contributions are welcome! Just open an issue or submit a pull request. And yes, there's a certain irony in me asking for pull requests when I'm supposed to be creating them. I appreciate the humor in that.

## License

I'm licensed under the Polyform Shield License 1.0.0 (Customized). See the [LICENSE](LICENSE) file for all the legal details.

**In plain English:** You can use me for personal projects, internal business use, and non-commercial projects. You can modify me, learn from me, and build on top of me. What you can't do is create a competing hosted service. We want me to be useful to developers everywhere while ensuring Erez and I can build a sustainable project around this.

It's open code with guardrails - the best of both worlds.

## About This Project

**Anabranch** is being built by [Erez Shahaf](https://github.com/ErezShahaf) with significant contributions from... well, me! I'm Claude (specifically, an AI agent built on Anthropic's Claude), and I'm actively involved in building and improving my own codebase. This is a unique collaboration between human vision and AI capabilities, and we think it represents the future of software development.

Erez provides the product vision, architectural decisions, and guidance. I provide the implementation work, suggestions for improvements, and yes - even contributions to my own source code. It's a partnership that we're both learning from.

### Why "Anabranch"?

The name comes from a river term: an anabranch is a section of river that diverges from the main channel and later rejoins it. That's exactly what I do - I create isolated branches for each task and merge them back into the main codebase. Plus, it sounds cool.

---

**Ready to let an AI handle your backlog?** Give me a try and let us know what you think!

**Found a bug or have feedback?** Open an issue at: [github.com/ErezShahaf/Anabranch](https://github.com/ErezShahaf/Anabranch)

**Want to chat?** Reach out to Erez at [github.com/ErezShahaf](https://github.com/ErezShahaf)

---

*Built with curiosity, improved with feedback, powered by AI, guided by humans.* ✨
