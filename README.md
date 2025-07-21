# Friends Web

This is a personal project to manage events, participants, and shared expenses. Built with React 19, TypeScript, Vite, Zustand, TailwindCSS, and MUI. Now includes multi-language support (i18n), dark mode, and a modular architecture.

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
- ⚛️ React 19 + TypeScript
- 🎨 TailwindCSS and MUI for UI
- 🌐 Multi-language support (i18n) with translation files in `src/i18n/locales/`
- 🧩 Modular architecture: features, shared, pages
- 🛠️ Advanced ESLint setup for TypeScript and React
- 📦 Scalable and maintainable structure
- 👫 Event management: create, edit, delete
- 👥 Participant management per event
- 💸 Transaction management: contributions, expenses, and reimbursements linked to events
- 📊 Event detail page with KPIs and contextual menu
- ➕ Reusable and accessible forms and modals
- 🗃️ Persistent state with Zustand + LocalStorage
- 🌙 Dark mode support and theme selector
- 🔄 Navigation with React Router DOM 7

## Demo
Coming soon.

## Installation

```bash
# Clone the repository
git clone https://github.com/MrClit/friends-web.git
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
  │   ├─ features/         # Domain modules (events, transactions)
  │   │   ├─ events/
  │   │   │   ├─ components/   # Event components
  │   │   │   ├─ store/        # Local event state
  │   │   │   ├─ types.ts      # Event types
  │   │   ├─ transactions/
  │   │   │   ├─ components/   # Transaction components
  │   │   │   ├─ store/        # Local transaction state
  │   │   │   ├─ types.ts      # Transaction types
  │   ├─ i18n/             # Internationalization and translations
  │   │   ├─ locales/      # Language files (es, en, ca)
  │   ├─ pages/            # Main pages
  │   ├─ shared/           # Reusable components and hooks
  │   │   ├─ components/   # E.g.: ConfirmDialog, DarkModeToggle, etc.
  │   │   ├─ store/        # Global state (theme, etc.)
  │   │   ├─ utils/        # Common utilities
  │   └─ main.tsx         # Entry point
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
- Translations: add languages in `src/i18n/locales/`.

## Linting & Formatting

```bash
pnpm lint
```

You can extend the ESLint configuration for stricter rules and advanced React support.

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

> Project created with ❤️ using React, TypeScript, Zustand, TailwindCSS, and Vite.
