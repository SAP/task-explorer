import { Range, Selection, Uri, window } from "vscode";
import { getLogger } from "../logger/logger-wrapper";
import { TaskTreeItem } from "../view/task-tree-item";
import { messages } from "../i18n/messages";
import { disposeTaskEditorPanel, getTaskEditor } from "../panels/panels-handler";
import { size } from "lodash";

export async function revealTask(treeItem: TaskTreeItem): Promise<void> {
  try {
    if (treeItem.command?.arguments === undefined) {
      return;
    }
    const task = treeItem.command.arguments[0];

    const taskEditor = getTaskEditor();
    if (taskEditor !== undefined && taskEditor.getTask().label === treeItem.label) {
      disposeTaskEditorPanel();
    }

    const resource = Uri.joinPath(Uri.file(task.__wsFolder), ".vscode", "tasks.json");
    const docEditor = await window.showTextDocument(resource, { preview: false });
    if (docEditor) {
      const regEx = new RegExp(`"${task.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`, "g");
      const found = regEx.exec(docEditor.document.getText());
      if (found) {
        const startIndex = found.index + 1; /* skip \" character */
        const startPosition = docEditor.document.positionAt(startIndex);
        const endPosition = docEditor.document.positionAt(startIndex + size(task.label));
        docEditor.selection = new Selection(startPosition, endPosition);
        docEditor.revealRange(new Range(startPosition, endPosition));
      } else {
        throw new Error(messages.configuration_task_not_found(task.label));
      }
    } else {
      throw new Error(messages.resource_open_could_not_open_editor);
    }
  } catch (e) {
    const message = (e as any).toString();
    window.showErrorMessage(message);
    getLogger().error(`revealTask: processing failed`, { message });
  }
}
