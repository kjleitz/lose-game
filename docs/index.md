# L.O.S.E. Documentation

Welcome to the L.O.S.E. (Lots of Outer Space to Explore) documentation hub.

## 🚀 Quick Start

- **New to L.O.S.E.?** → [Newcomer's Guide](newcomer-guide.md) - Essential reading for new contributors
- 🔒 Fundamental Rules → [Team Rules and Coding Preferences](rules.md)
- [Code Map](code-map.md) - Overview of the codebase structure
- [Development Playbook](dev-playbook.md) - How to develop and contribute
- [Testing Guide](testing.md) - Testing strategies and tools

## 🎮 Dual-Game Architecture

L.O.S.E. features a unique dual-game system where players seamlessly switch between space exploration and planet surface exploration.

- [Dual-Game System Architecture](architecture/dual-game-system.md) - Complete architectural overview
- [Landable Planets](landable-planets.md) - Design and implementation guide

### Game Modes

- **Space Mode**: Ship-based exploration, combat, and planet discovery
- **Planet Mode**: Character-based surface exploration, creatures, and resources
- **Transitions**: Seamless switching via landing (L) and takeoff (T)

## 🏗️ Architecture & Systems

- [Architecture Decisions](decisions/) - ADRs documenting key decisions
- [Data Flow](data-flow.md) - How data moves through the application
- [HUD System](hud.md) - User interface and HUD components
- [Enemy AI](enemy-ai.md) - Behavior tree implementation for enemies

## 🛠️ Development

- [Performance](performance.md) - Performance optimization strategies
- [Troubleshooting](troubleshooting.md) - Common issues and solutions
- [CI/CD](ci.md) - Continuous integration setup
- [Glossary](glossary.md) - Terms and concepts
- [AI Collaboration](ai-collab.md) - Working with AI assistants

## 📋 Legacy Documentation

- Project Overview: docs/overview.md
- Architecture: docs/architecture.md
- Roadmap: docs/roadmap.md
- Domain Structure (proposed DDD): docs/proposed-ddd-structure.md
- Active Tasks: docs/tasks.md
- Repository Guidelines: AGENTS.md
- Core Repository Rules: docs/rules.md
- Contributing Guide: CONTRIBUTING.md

## 🎯 Current Focus

We're evolving toward a true dual-game architecture where SpaceMode and PlanetMode operate as independent games sharing a common engine. See [ADR-0008](decisions/adr-0008-engine-extraction-plan.md) for the complete roadmap.

Quick Commands

- Install: `npm install`
- Develop: `npm run dev`
- Unit tests: `npm run test` / Coverage: `npm run coverage`
- E2E tests: `npx playwright test`
- Typecheck: `npm run typecheck`
- Lint/Format: `npm run lint` / `npm run format`
