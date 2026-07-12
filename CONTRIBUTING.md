# Contributing to GitSum

Thank you for your interest in contributing to GitSum! We welcome contributions to improve the project's quality, features, and documentation.

## How to Contribute

### 1. Reporting Bugs
- Search the issue tracker to ensure the bug hasn't already been reported.
- If you find a new bug, open a new issue with a clear title, description, steps to reproduce, and screenshots if applicable.

### 2. Suggesting Enhancements
- Open an issue describing the proposed feature, why it is useful, and how it fits into the current concept.

### 3. Submitting Pull Requests
- Fork the repository and create a new branch from `main` for your feature or bug fix: `git checkout -b feature/your-feature-name`.
- Write clean code following standard JavaScript and React patterns.
- Ensure all tests pass. Run `npm run test` in both `GitSum/` and `server/` to verify your changes.
- Submit a PR with a description of the changes.

## Development Setup

See the main [README.md](README.md) for full instructions on setting up both the React frontend and the Express backend locally.

## Project Structure

- `/GitSum`: React frontend styled with custom CSS variables and animated with Framer Motion.
- `/server`: Node.js + Express proxy server with rate-limiting and in-memory caching.
- `/docs`: Reference documentation and bug fixes.
