# Friends Web

This is a personal project built for learning and practice purposes. It is a web application for managing events and participants, developed with React, TypeScript, and Vite.

## Table of Contents
- [Features](#features)
- [Demo](#demo)
- [Installation](#installation)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Linting & Formatting](#linting--formatting)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Features
- ⚡️ Fast development with Vite
- ⚛️ React + TypeScript
- 🎨 TailwindCSS for styling
- 🧩 Modular architecture (features, shared, pages)
- 🛠️ Advanced ESLint setup for TypeScript and React
- 📦 Scalable project structure

## Demo
Coming soon.

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd friends-web

# Install dependencies
pnpm install # or npm install or yarn install
```

## Available Scripts

```bash
pnpm dev        # Start the development server
pnpm build      # Build the app for production
pnpm preview    # Preview the production build
pnpm lint       # Lint the code
```

## Project Structure

```
/ ├─ public/                # Static files
  ├─ src/
  │   ├─ assets/           # Images and resources
  │   ├─ features/         # Domain modules (e.g. events)
  │   │   └─ events/
  │   │       ├─ components/   # Event components
  │   │       ├─ store/        # Local event state
  │   │       ├─ types.ts      # Event types
  │   │       └─ utils.ts      # Utilities
  │   ├─ pages/            # Main pages
  │   ├─ shared/           # Reusable components and hooks
  │   └─ main.tsx          # Entry point
  ├─ index.html
  ├─ package.json
  ├─ tailwind.config.js
  ├─ vite.config.ts
  └─ ...
```

## Configuration
- Environment variables: create a `.env` file if you need custom variables.
- TailwindCSS: configuration in `tailwind.config.js`.
- ESLint: rules in `eslint.config.js`.

## Linting & Formatting

```bash
pnpm lint
```

You can extend the ESLint configuration for stricter rules and advanced React support (see examples in this README).

## Testing
Currently, no tests are configured. It is recommended to add [Vitest](https://vitest.dev/) or [Jest](https://jestjs.io/) for unit testing.

## Contributing
1. Fork the project
2. Create a branch (`git checkout -b feature/new-feature`)
3. Make your changes and commit (`git commit -am 'feat: new feature'`)
4. Push to your branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License
[MIT](LICENSE)

---

> Project created with ❤️ using React, TypeScript, and Vite.
