# Repository Guidelines

## Tooling

- Use Bun for dependency management and package scripts.
- Run project commands with `bun run <script>`.
- Use `bun install` when dependencies need to be installed or updated.
- Do not use npm, pnpm, or yarn for this repository.

## Development Server

- Do not run `bun run dev`.
- The user is responsible for starting and managing the development server.
- Do not stop, restart, or otherwise modify a running development server unless the user explicitly asks.

## Verification

- Run `bun run build` after code changes when practical.
- Run `bun run lint` when changes can affect linting.
