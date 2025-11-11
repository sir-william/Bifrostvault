# Bifrostvault Developer Guide

Welcome to the Bifrostvault developer documentation. This guide will help you set up your development environment, understand the codebase architecture, and contribute effectively to the project.

---

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Development Workflow](#development-workflow)
5. [Code Style and Standards](#code-style-and-standards)
6. [Testing](#testing)
7. [Debugging](#debugging)
8. [Common Tasks](#common-tasks)

---

## Development Environment Setup

### Prerequisites

Ensure you have the following tools installed on your development machine:

**Node.js 22+**: The JavaScript runtime environment. Download from [nodejs.org](https://nodejs.org/) or use a version manager like `nvm`.

**pnpm**: Fast, disk space efficient package manager. Install globally with `npm install -g pnpm`.

**MySQL or TiDB**: Database server for storing encrypted vault data. You can use Docker for local development.

**Git**: Version control system. Download from [git-scm.com](https://git-scm.com/).

**YubiKey** (optional): For testing hardware authentication features. YubiKey Bio, YubiKey 5, or Security Key.

**Modern Browser**: Chrome, Firefox, Edge, or Safari with WebAuthn support and developer tools.

### Clone the Repository

```bash
git clone https://github.com/sir-william/Bifrostvault.git
cd Bifrostvault
```

### Install Dependencies

```bash
pnpm install
```

This command installs all project dependencies defined in `package.json`.

### Database Setup

#### Using Docker (Recommended)

Create a `docker-compose.yml` file in the project root:

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: bifrostvault
      MYSQL_USER: bifrost
      MYSQL_PASSWORD: vaultpass
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

Start the database:

```bash
docker-compose up -d
```

#### Using Local MySQL

If you have MySQL installed locally, create a database:

```sql
CREATE DATABASE bifrostvault CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bifrost'@'localhost' IDENTIFIED BY 'vaultpass';
GRANT ALL PRIVILEGES ON bifrostvault.* TO 'bifrost'@'localhost';
FLUSH PRIVILEGES;
```

### Environment Configuration

Create a `.env` file in the project root:

```bash
# Database Configuration
DATABASE_URL=mysql://bifrost:vaultpass@localhost:3306/bifrostvault

# WebAuthn Configuration
WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:3000

# OAuth Configuration (optional for development)
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

# Environment
NODE_ENV=development
PORT=3000
```

### Initialize Database Schema

```bash
pnpm db:push
```

This command creates all necessary tables in your database using Drizzle ORM.

### Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

---

## Project Structure

The Bifrostvault codebase follows a monorepo structure with clear separation between client and server code:

```
Bifrostvault/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── _core/         # Core utilities and hooks
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (routes)
│   │   ├── lib/           # Client libraries (tRPC, utils)
│   │   ├── App.tsx        # Main application component
│   │   └── main.tsx       # Application entry point
│   ├── public/            # Static assets
│   └── index.html         # HTML template
├── server/                # Backend Node.js application
│   ├── routers.ts         # tRPC router definitions
│   ├── webauthn.ts        # WebAuthn/FIDO2 implementation
│   ├── db.ts              # Database operations
│   ├── totp.ts            # TOTP 2FA implementation
│   └── index.ts           # Server entry point
├── drizzle/               # Database schema and migrations
│   ├── schema.ts          # Drizzle ORM schema definitions
│   └── *.sql              # Migration files
├── e2e/                   # End-to-end tests
│   ├── helpers/           # Test helper functions
│   ├── fixtures/          # Test fixtures and mocks
│   └── *.spec.ts          # Playwright test files
├── docs/                  # Documentation
│   ├── developer/         # Developer documentation
│   ├── user/              # User documentation
│   ├── api/               # API reference
│   ├── security/          # Security documentation
│   └── yubikey/           # YubiKey guides
├── .env                   # Environment variables (not in git)
├── package.json           # Project dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
├── drizzle.config.ts      # Drizzle ORM configuration
└── playwright.config.ts   # Playwright test configuration
```

### Key Directories

**client/**: Contains all frontend code built with React 19 and TypeScript. The structure follows a feature-based organization with shared components in the `components/` directory.

**server/**: Contains all backend code built with Express and tRPC. The server handles authentication, database operations, and WebAuthn verification.

**drizzle/**: Database schema definitions and migrations. Drizzle ORM provides type-safe database access with automatic TypeScript type generation.

**e2e/**: End-to-end tests using Playwright. Tests cover critical user flows including YubiKey registration, authentication, and vault operations.

**docs/**: Comprehensive documentation for users, developers, and security auditors.

---

## Technology Stack

### Frontend

**React 19**: Modern UI library with concurrent features, automatic batching, and improved server components support.

**TypeScript**: Provides static type checking, improved IDE support, and better code maintainability.

**Tailwind CSS 4**: Utility-first CSS framework with JIT compilation for fast development and small bundle sizes.

**tRPC 11**: End-to-end type-safe APIs without code generation. Changes to backend types automatically reflect in frontend.

**TanStack Query (React Query)**: Powerful data synchronization library with automatic caching, background updates, and optimistic updates.

**Wouter**: Lightweight routing library (1.6KB) that provides React Router-like API without the bloat.

**Radix UI**: Unstyled, accessible component primitives for building high-quality design systems.

**SimpleWebAuthn Browser**: WebAuthn/FIDO2 client library for hardware authentication.

### Backend

**Node.js 22**: JavaScript runtime with latest ECMAScript features and improved performance.

**Express**: Minimal and flexible web application framework for Node.js.

**tRPC 11**: Type-safe API layer that shares types between client and server.

**Drizzle ORM**: TypeScript ORM with excellent type inference and SQL-like query builder.

**SimpleWebAuthn Server**: WebAuthn/FIDO2 server library for verifying authentication assertions.

**Speakeasy**: TOTP implementation for two-factor authentication.

### Database

**MySQL 8.0+**: Reliable relational database with excellent performance and JSON support.

**TiDB** (optional): MySQL-compatible distributed database for horizontal scaling.

### Development Tools

**Vite**: Next-generation frontend build tool with instant HMR and optimized builds.

**TypeScript Compiler**: Type checking and transpilation.

**ESLint**: Code linting for JavaScript and TypeScript.

**Prettier**: Code formatting for consistent style.

**Playwright**: End-to-end testing framework with cross-browser support.

**Vitest**: Unit testing framework with Vite integration.

---

## Development Workflow

### Branch Strategy

We follow a simplified Git Flow workflow:

**main**: Production-ready code. All commits must pass CI/CD checks.

**develop**: Integration branch for features. Merge features here first.

**feature/**: Feature branches created from `develop`. Use descriptive names like `feature/yubikey-bio-support`.

**fix/**: Bug fix branches created from `develop` or `main`.

**docs/**: Documentation update branches.

### Creating a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-new-feature
```

### Making Changes

1. **Write code** following the project's code style
2. **Add tests** for new functionality
3. **Update documentation** if needed
4. **Run tests** to ensure nothing breaks
5. **Commit changes** with clear, descriptive messages

### Commit Message Format

Follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Example:

```
feat(yubikey): add YubiKey Bio biometric support

- Implement AAGUID detection for YubiKey Bio
- Add user verification tracking
- Update UI to show biometric badges
- Add credential limit warnings

Closes #123
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Run E2E tests in UI mode
pnpm test:e2e:ui

# Run specific test file
pnpm playwright test yubikey-registration

# Run tests in headed mode (see browser)
pnpm playwright test --headed
```

### Code Quality Checks

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Format code
pnpm format

# Run all checks
pnpm check-all
```

### Creating a Pull Request

1. **Push your branch** to GitHub
2. **Open a Pull Request** against `develop`
3. **Fill out the PR template** with description and testing notes
4. **Wait for CI/CD checks** to pass
5. **Request review** from maintainers
6. **Address feedback** if any
7. **Merge** once approved

---

## Code Style and Standards

### TypeScript

**Use strict mode**: Enable `strict: true` in `tsconfig.json`.

**Avoid `any`**: Use proper types or `unknown` instead of `any`.

**Use type inference**: Let TypeScript infer types when obvious.

**Export types**: Export types and interfaces for reuse.

```typescript
// Good
interface User {
  id: number;
  name: string;
  email: string;
}

function getUser(id: number): Promise<User> {
  // ...
}

// Bad
function getUser(id: any): Promise<any> {
  // ...
}
```

### React Components

**Use functional components**: Prefer function components over class components.

**Use hooks**: Leverage React hooks for state and side effects.

**Keep components small**: Each component should have a single responsibility.

**Extract logic**: Move complex logic to custom hooks.

```typescript
// Good
export function VaultEntry({ entry }: { entry: VaultEntry }) {
  const { decryptEntry } = useEncryption();
  const [decrypted, setDecrypted] = useState<DecryptedEntry | null>(null);

  useEffect(() => {
    decryptEntry(entry).then(setDecrypted);
  }, [entry]);

  if (!decrypted) return <Skeleton />;

  return <div>{decrypted.name}</div>;
}
```

### API Design

**Use tRPC procedures**: Define all API endpoints as tRPC procedures.

**Validate input**: Use Zod schemas for input validation.

**Handle errors**: Return meaningful error messages.

**Use transactions**: Wrap related database operations in transactions.

```typescript
// Good
export const vaultRouter = router({
  add: protectedProcedure
    .input(z.object({
      type: z.enum(['login', 'note', 'card', 'identity']),
      encryptedName: z.string().min(1),
      encryptedData: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const entry = await db.addVaultEntry({
        userId: ctx.user.id,
        ...input,
      });
      return entry;
    }),
});
```

### Database Operations

**Use Drizzle ORM**: All database operations should use Drizzle ORM.

**Use transactions**: For multi-step operations.

**Index frequently queried columns**: Add indexes for performance.

**Use prepared statements**: Drizzle handles this automatically.

```typescript
// Good
export async function addVaultEntry(entry: InsertVaultEntry) {
  const db = await getDb();
  const [result] = await db.insert(vaultEntries).values(entry);
  return result;
}
```

---

## Testing

### E2E Testing with Playwright

Bifrostvault uses Playwright for end-to-end testing. Tests are located in the `e2e/` directory.

#### Running E2E Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run in UI mode (interactive)
pnpm test:e2e:ui

# Run specific test file
pnpm playwright test yubikey-registration

# Run in headed mode (see browser)
pnpm playwright test --headed

# Debug mode
pnpm playwright test --debug
```

#### Writing E2E Tests

```typescript
import { test, expect } from '@playwright/test';
import { mockLogin, MOCK_USERS } from './fixtures/auth';
import { installWebAuthnMock } from './helpers/webauthn-mock';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page, MOCK_USERS.regularUser);
  });

  test('should do something', async ({ page }) => {
    await page.goto('/vault');
    await expect(page.locator('h1')).toContainText('Bifrostvault');
  });
});
```

### Unit Testing with Vitest

Unit tests are located next to the code they test with `.test.ts` or `.spec.ts` extensions.

```bash
# Run unit tests
pnpm test:unit

# Run in watch mode
pnpm test:unit:watch

# Run with coverage
pnpm test:unit:coverage
```

---

## Debugging

### Browser DevTools

Use browser developer tools for frontend debugging:

- **Console**: View logs and errors
- **Network**: Inspect API requests
- **Application**: View cookies, local storage, IndexedDB
- **Sources**: Set breakpoints and step through code

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Playwright Inspector

Debug E2E tests with Playwright Inspector:

```bash
pnpm playwright test --debug
```

---

## Common Tasks

### Adding a New API Endpoint

1. Define the procedure in `server/routers.ts`
2. Add input validation with Zod
3. Implement the logic
4. Add tests in `e2e/`

### Adding a New Page

1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Add navigation link if needed
4. Add E2E tests

### Adding a Database Table

1. Define schema in `drizzle/schema.ts`
2. Generate migration: `pnpm db:generate`
3. Apply migration: `pnpm db:push`
4. Add database functions in `server/db.ts`

### Updating Dependencies

```bash
# Check for updates
pnpm outdated

# Update all dependencies
pnpm update

# Update specific package
pnpm update package-name
```

---

## Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [tRPC Documentation](https://trpc.io/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Playwright Documentation](https://playwright.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

---

**Last Updated**: November 11, 2025  
**Version**: 1.0.0
