# Task Explorer Panel

This VS Code extension provides a view for exploring tasks. This includes browsing, creation, editing and execution.

## Description

The Task panel presents the tree of tasks, grouped by intents.
The following intents are supported:

- Build
- Deploy
- Miscellenous

### Features

- The user can create a new task using the view's **Create** button.
- The context menu on the tree enables users to edit and remove tasks.
- The **Run** button on the task's item runs the task.

## Limitations

The Tasks panel is hidden if no extension exposes the task provider contributing to the Task Explorer.

## Enable usage analytics reporting from VS Code

The tool collects non-personally identifiable information about your usage of the tool to improve its services. If you do not want the tool to collect your usage data, you can set the "Enable Sap Web Analytics" setting to "false". Go to File > Preferences > Settings (macOS: Code > Preferences > Settings) > Extensions > Application Wizard, and deselect the "Enable Sap Web Analytics" checkbox.

### Support

Open an [issue](https://github.com/SAP/task-explorer/issues) on GitHub.

### Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
