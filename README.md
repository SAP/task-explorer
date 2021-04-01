[![CircleCI](https://circleci.com/gh/SAP/task-explorer.svg?style=svg)](https://circleci.com/gh/SAP/task-explorer)
[![Coverage Status](https://coveralls.io/repos/github/SAP/task-explore/badge.svg?branch=master)](https://coveralls.io/github/SAP/task-explorer?branch=master)
[![Language grade: TypeScript](https://img.shields.io/lgtm/grade/javascript/g/SAP/task-explorer.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/SAP/task-explorer/context:javascript)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![DependentBot](https://api.dependabot.com/badges/status?host=github&repo=SAP/task-explorer)](https://dependabot.com/)
[![REUSE status](https://api.reuse.software/badge/github.com/SAP/task-explorer)](https://api.reuse.software/info/github.com/SAP/task-explorer)

# Task Explorer

![](screenshot.png)

This npm [mono-repo][mono-repo] contains the tool for exploring tasks in [SAP Business Application Studio][SAP BAS] and [VS Code][VSCode] projects.

It currently contains:

- The [Task Explorer](./packages/tasks_panel) VS Code extension.

- The following packages:

   - [@task-explorer/task_contrib_types](./packages/task_contrib_types) Type signatures for task providers contributing to the Task Explorer.
   - [@task-explorer/tasks_panel](./packages/tasks_panel) The Task Explorer extension.
   - [@task-explorer/vue_frontend_rpc](./packages/vue_frontend_rpc) Task Explorer views.
   - [@task-explorer/vscode_task_contrib](./packages/vscode_task_contrib) A sample of the task provider that contributes to Task Explorer.

## Download and Installation

1. Clone this repository
2. Enter the `yarn install` command.
3. Enter the `yarn run ci` command.

### Run the VS Code extension with the provided sample
1. Start VS Code on your local machine, and click on **Open Workspace**.
2. Select this repo folder.
3. On the Debug panel, choose "Launch Tasks Panel with Sample Task Contributor", and click **Run**.

## Support

Open an [issue](https://github.com/SAP/task-explorer/issues) on GitHub.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

[mono-repo]: https://github.com/babel/babel/blob/master/doc/design/monorepo.md
[SAP BAS]: https://help.sap.com/viewer/product/SAP%20Business%20Application%20Studio/Cloud/en-USl
[VSCode]: https://code.visualstudio.com/


