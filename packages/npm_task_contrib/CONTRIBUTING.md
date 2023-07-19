# Contribution Guide

Please see the top-level [Contribution Guide](../../CONTRIBUTING.md) for the project setup and all development flows.

## Compiling

This sub-package includes a compilation script `yarn compile`, however, normally
the **root** level `compile:watch` script should be used during development
as it will compile **all** the projects in this monorepo at the same time (incrementally).

## Running & Debugging

A VSCode launch configuration [./.vscode/launch.json](./.vscode/launch.json)
is included in this sub-package.

Open this sub-package directly (**not** the monorepo root) in VSCode to use it.

### Workaround for no halting on break points issue

Under some scenarios a race condition may occur where the VSCode debugger will only
attach breakpoints **after** the relevant code has been executed. This is particularly true
for VSCode extensions with a "\*" `activationEvent`.

The workaround is to simply add a **debugger statement** as your initial breakpoint.
This is avoid the race condition on the initial breakpoint and provide a small delay
for the VSCode debugger to finish attaching the other breakpoints.

## Bundling

A bundling npm script is available via `yarn bundle`.

This extension is bundled to a single file **based on** the [official VSCode guide](https://code.visualstudio.com/api/working-with-extensions/bundling-extension),
But with a few important **differences**:

- `ts-loader` is not used to compile the sources during bundling,
  instead \*_pre-compiled_ sources generated by `tsc`are used as the entry point.
- The `minimize` optimization in webpack is **disabled** as:
  1. It can sometimes cause runtime errors.
  2. Makes any scenarios requiring to **read** the bundle much easier.
  3. The main objective to reduce the number of file system accesses, e.g to avoid bundling a `node_modules`
     directory with 100,000 files. Minimizing the size of the **single** bundled artifact file is far less important.

See the [webpack.config.js](./webpack.config.js) for more details.

## Packaging

A bundling npm script is available via `yarn package`.

The packaging (to `.vsix`) of this extension is fairly standard except:

- The `vsce` package command is used via the [./scripts/package-vsix.js](./scripts/package-vsix.js) script.
- The `main` key of the package.json is adjusted to point to the **bundled** artifact during packaging
  and reverted to point to the **compiled** sources after the packaging has finished.
  - This is done to enable **fast feedback loops** during running / debugging dev flows.