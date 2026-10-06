# CLAUDE.md

This file provides guidance to AI coding agents working with the task-explorer repository.

## Repository Overview

`task-explorer` is a Lerna/Yarn Workspaces monorepo that delivers the **Task Explorer** VS Code extension for SAP Business Application Studio (BAS) and VS Code. It provides a sidebar panel for browsing, creating, editing, and running tasks defined in the workspace's `tasks.json`.

## Package Layout

```
packages/
  task_contrib_types/   – Published TypeScript types/interfaces (@sap_oss/task_contrib_types)
  tasks_panel/          – Main VS Code extension (the host)
  vue_frontend_rpc/     – Vue 3 webview frontend (task editor UI)
  vscode_task_contrib/  – Sample VS Code contributor extension (npm-script tasks)
  npm_task_contrib/     – npm task contributor extension
```

### Dependency graph

```
task_contrib_types   (no deps — the shared contract)
       ↑
       ├── tasks_panel          (runtime dep; also devDep on vue_frontend_rpc for asset copy)
       ├── vscode_task_contrib  (runtime dep)
       └── npm_task_contrib     (runtime dep)

vue_frontend_rpc     (standalone Vue 3 SPA; assets copied into tasks_panel/dist/media/)
```

## Architecture

### Extension host (`tasks_panel`)

Entry point: `packages/tasks_panel/src/extension.ts` — `activate(context)`.

On activation (`onStartupFinished`) it:

1. Initialises structured logging (`@vscode-logging/logger` → Output Channel).
2. Creates `AnalyticsWrapper` (SAP telemetry; only active when `LANDSCAPE_ENVIRONMENT` is set).
3. Runs `Contributors.init()` — scans all installed extensions for `BASContributes.tasksExplorer` in their `package.json`, activates them, and populates a `type → contributor` map.
4. Creates `TasksProvider` — reads `tasks.json` from VS Code workspace config, filters to supported types, injects metadata fields (`__index`, `__wsFolder`, `__intent`, `__extensionName`).
5. Creates `TasksTree` and registers `window.createTreeView("tasksPanel")` — hierarchy: Workspace Root → (optional) Project → Intent → Task. The Project level is omitted when no projects are discovered (`tasks-tree.ts:120`).
6. Registers 11 commands (`tasks-explorer.*`): edit, create, delete, duplicate, reveal, execute, stop, refresh, select, build action, deploy action.

### Contributor protocol

Third-party extensions register task types via `package.json`:

```json
"BASContributes": {
  "tasksExplorer": [
    { "type": "npm-script", "intent": "Miscellaneous" }
  ]
}
```

Their `activate()` must return `{ getTaskEditorContributors() }` — the shape is defined in `task_contrib_types/api.d.ts` (`TaskEditorContributorExtensionAPI`). Each contributor implements `TaskEditorContributionAPI<T>`: `init`, `convertTaskToFormProperties`, `updateTask`, `getTaskImage`, and optional `onSave`.

### Webview RPC (extension ↔ Vue frontend)

Communication uses `@sap-devx/webview-rpc` (JSON-RPC over VS Code's `postMessage`/`onDidReceiveMessage`).

**Extension → frontend:** `setTask` (pushes full task object with serialized form properties).

**Frontend → extension:** `onFrontendReady`, `setAnswers`, `evaluateMethod`, `saveTask`, `executeTask`.

Function-valued form properties cannot be JSON-serialised. `TaskEditor.normalizeFunctions()` replaces them with the string `"__Function"`; the frontend replaces these back with closures that call `rpc.invoke("evaluateMethod", [...])` on the extension.

**Local development transport:** the extension also provides a WebSocket server (`packages/tasks_panel/src/webSocketServer/index.ts`, default port `8081`, overridable via `PORT` env var). Note: the Vue frontend (`vue_frontend_rpc`) always connects to port `8081` regardless of `PORT` — changing `PORT` breaks local frontend connectivity unless `App.vue:43` is also updated.

### Webview HTML loading

`AbstractWebviewPanel.initHtmlContent()` reads `dist/media/index.html`, then uses `cheerio` to rewrite all `src`/`href` attributes to VS Code webview URIs. The frontend SPA assets live in `dist/media/` (copied from `vue_frontend_rpc/dist/` during build).

## Commands

All commands run from the **repository root** unless noted.

```bash
# Install dependencies
yarn

# Full CI build (format check → lint → build all packages → merge coverage → legal)
yarn ci

# Compile all TypeScript sub-packages
yarn compile
yarn compile:watch      # watch mode

# Code style
yarn format:validate    # check only
yarn format:fix         # auto-fix
yarn lint:validate      # ESLint, zero warnings allowed
yarn lint:fix

# Release
yarn run release:version   # lerna version (conventional commits, prompts for next version)
yarn run release:publish   # publish changed packages to npm
```

### Per-package commands (run inside each `packages/<name>/`)

```bash
yarn ci          # full package build + test (all packages)
yarn compile     # TypeScript only (tasks_panel, npm_task_contrib, task_contrib_types, vscode_task_contrib)
yarn test        # mocha (tasks_panel, npm_task_contrib) or jest (vue_frontend_rpc)
yarn coverage    # mocha + nyc coverage (tasks_panel, npm_task_contrib only)
yarn build       # vite build (vue_frontend_rpc only)
```

## Testing

| Package               | Framework                                  | Coverage threshold                                |
| --------------------- | ------------------------------------------ | ------------------------------------------------- |
| `tasks_panel`         | Mocha 10 + Chai + Sinon + Proxyquire + nyc | 99% branches/lines/functions/statements           |
| `npm_task_contrib`    | Mocha + Chai + Proxyquire + nyc            | 100% all metrics                                  |
| `vue_frontend_rpc`    | Jest 29 + `@vue/test-utils` 2 + jsdom      | 76% branches, 77% lines/statements, 52% functions |
| `task_contrib_types`  | — (types only)                             | —                                                 |
| `vscode_task_contrib` | — (no tests)                               | —                                                 |

Tests for `tasks_panel` and `npm_task_contrib` run against compiled output — run `yarn compile` first, or use `yarn ci` which compiles before running coverage.

Coverage reports per package (nyc only — Jest coverage from `vue_frontend_rpc` is not included) are merged into a combined lcov at the root by `scripts/merge-coverage.js`. No Coveralls upload step exists in CI.

## Configuration

### VS Code settings (contributed by `tasks_panel`)

| Setting                                                    | Type                                                       | Default   | Description                              |
| ---------------------------------------------------------- | ---------------------------------------------------------- | --------- | ---------------------------------------- |
| `vscode-tasks-explorer-tasks-panel.loggingLevel`           | enum (`off`/`fatal`/`error`/`warn`/`info`/`debug`/`trace`) | `"error"` | Logging verbosity for the Output Channel |
| `vscode-tasks-explorer-tasks-panel.sourceLocationTracking` | boolean                                                    | `false`   | Include source file/line in log entries  |

### Environment variables

| Variable                | Used in                                                            | Effect                                                         |
| ----------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| `PORT`                  | `packages/tasks_panel/src/webSocketServer/index.ts`                | WebSocket server port for local frontend dev (default: `8081`) |
| `LANDSCAPE_ENVIRONMENT` | `packages/tasks_panel/src/usage-report/usage-analytics-wrapper.ts` | Enables SAP Web Analytics telemetry when set                   |

## CI / Release

- **CI:** GitHub Actions — `.github/workflows/ci.yml` (push/PR to `main`; runs `yarn ci` on Node 18).
- **Release:** GitHub Actions — `.github/workflows/release.yml` (triggered on `v*.*.*` tags; runs `yarn ci`, publishes to npm via `yarn release:publish`, creates a GitHub Release with `.vsix` artefacts).
- **Commit format:** conventional commits enforced by `commitlint` via the `.husky/commit-msg` hook and `.github/workflows/commitlint.yml`. `lint-staged` runs formatting/linting on staged files (pre-commit) but does **not** enforce commit message format.
- **Versioning:** Lerna Fixed/Locked mode configured (`lerna.json`). Use `yarn run release:version` to bump. Note: packages may carry different versions between releases.
