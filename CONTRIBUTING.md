# Contributing to Metropolis EVoting 2026

Thank you for your interest in contributing to the Metropolis Sovereign Voting Protocol. By contributing, you help ensure a secure and transparent future for digital democracy in our Smart-City enclave.

## 🚦 Getting Started

1. **Fork the Repository**: Create your own copy of the repository on GitHub.
2. **Setup Local Environment**:
   - Clone your fork: `git clone https://github.com/your-username/metropolis-evoting-2026.git`
   - Install dependencies: `npm install`
   - Configure `.env`: Use `.env.example` as a template for your MongoDB URI.
3. **Run Locally**: 
   - Use `npm run dev` for active development with hot-reloading.
   - Use `npm run build` followed by `npm run start` to test the production build.

## 🛠️ Development Guidelines

### Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, SCSS, TypeScript.
- **Backend**: Node.js, Express, TypeScript.
- **Database**: MongoDB (Mongoose ODM).
- **Security**: SHA-256 Cryptographic Hashing and Express Rate Limiting.

### Coding Standards
- **TypeScript**: All new code should be written in TypeScript with proper type definitions.
- **Styling**: Use Tailwind CSS for layout and SCSS for complex component-specific styles following the project's design language.
- **Architecture**: Keep blockchain logic within `server.ts` modular. Ensure all significant actions trigger an `AuditEntry`.

## 📥 Pull Request Process

1. **Create a Feature Branch**: `git checkout -b feature/your-feature-name`.
2. **Commit Changes**: Use descriptive commit messages (e.g., `feat: add regional turnout aggregation`).
3. **Submit PR**: Open a Pull Request against the `main` branch.
4. **Code Review**: At least one maintainer must review and approve your changes before merging.

## 🛡️ Security Policy

This is a high-security voting application. If you discover a security vulnerability, **do not open a public issue**. Please report it privately to the maintainers to ensure the integrity of the voting protocol is not compromised during the remediation process.

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the **Apache License 2.0**.