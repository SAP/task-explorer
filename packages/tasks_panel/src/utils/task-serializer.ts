import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { randomBytes } from "crypto";
import { ConfigurationTarget, TaskDefinition, Uri, commands, languages, window, workspace } from "vscode";

export function serializeTask(task: ConfiguredTask): string {
  return JSON.stringify(task);
}

export function generateUniqueCode(): string {
  function generateGroup(): string {
    return randomBytes(2).toString("hex").toUpperCase();
  }
  return `${generateGroup()}-${generateGroup()}`;
}

const BTN_PROBLEMS = "Show problems";
export async function updateTasksConfiguration(
  folder: string,
  tasks: (ConfiguredTask | TaskDefinition)[]
): Promise<void> {
  const url = Uri.file(folder);
  // register on diagnostic notifications for this flow only
  const handler = languages.onDidChangeDiagnostics((e) => {
    const tasksPath = Uri.joinPath(url, ".vscode", "tasks.json");
    if (e.uris.map((v) => v.path).includes(tasksPath.path)) {
      void window
        .showWarningMessage(`There are tasks definitions errors. See the problems for details.`, BTN_PROBLEMS)
        .then(async (answer: string | undefined) => {
          if (answer === BTN_PROBLEMS) {
            await window.showTextDocument(tasksPath);
            await commands.executeCommand("workbench.actions.view.problems");
          }
        });
    }
  });

  const tasksConfig = workspace.getConfiguration("tasks", url);
  await tasksConfig.update("tasks", tasks, ConfigurationTarget.WorkspaceFolder);

  setTimeout(() => {
    handler.dispose(); // unregister for diagnostic notifications after flow finished
  }, 1000);
}
