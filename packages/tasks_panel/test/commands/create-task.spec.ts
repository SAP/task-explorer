import { expect } from "chai";
import { mockVscode, MockVSCodeInfo, resetTestVSCode } from "../utils/mockVSCode";
import { MockTasksProvider } from "../utils/mockTasksProvider";
mockVscode("src/panels/panels-handler");
import { disposeTaskEditorPanel, getTaskEditor } from "../../src/panels/panels-handler";
mockVscode("src/commands/create-task");
import { createTask } from "../../src/commands/create-task";
mockVscode("src/commands/edit-task");
import { editTask } from "../../src/commands/edit-task";
import { TaskEditor } from "../../src/task-editor";
import { messages } from "../../src/i18n/messages";

describe("Command createTask", () => {
  const tasks = [
    {
      label: "task 1",
      type: "testType",
      taskType: "Deploy",
      prop1: "value 1.1",
    },
    {
      label: "task 2",
      type: "testType",
      taskType: "Deploy",
      prop1: "value 1.2",
    },
  ];

  let panelCreated = 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- leave unused args for reference
  const readFile = async function (path: string): Promise<string> {
    panelCreated++;
    return "aaa";
  };

  afterEach(() => {
    disposeTaskEditorPanel();
    resetTestVSCode();
    panelCreated = 0;
  });

  it("creates tasks selection panel", async () => {
    await createTask(new MockTasksProvider(tasks), readFile);
    expect(panelCreated).eq(1);
  });

  it(`creates panel for tasks selection when called with some task opened for editing but not changed`, async () => {
    await editTask(
      {
        label: "task 3",
        type: "testType",
        taskType: "Deploy",
        prop1: "value 1.3",
      },
      readFile
    );
    // editor panel created
    expect(panelCreated).eq(1);
    const tasks = [
      {
        label: "task 1",
        type: "testType",
        taskType: "Deploy",
        prop1: "value 1.1",
      },
    ];
    await createTask(new MockTasksProvider(tasks), readFile);
    // selection panel created
    expect(panelCreated).eq(2);
  });

  it(`does not create panel for tasks selection when called with some task being edited and user does not agree to discard the changes`, async () => {
    await editTask(
      {
        label: "task 3",
        type: "testType",
        taskType: "Deploy",
        prop1: "value 1.3",
      },
      readFile
    );
    // editor panel created
    expect(panelCreated).eq(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- suppress for test scope
    const taskEditor: TaskEditor = getTaskEditor()!;
    taskEditor["changed"] = true;
    MockVSCodeInfo.dialogAnswer = "other";
    await createTask(new MockTasksProvider([]), readFile);
    // selection panel not created
    expect(panelCreated).eq(1);
  });

  it(`creates panel for tasks selection when called with some task being edited and user agrees to discard the changes`, async () => {
    await editTask(
      {
        label: "task 3",
        type: "testType",
        taskType: "Deploy",
        prop1: "value 1.3",
      },
      readFile
    );
    // editor panel initiated
    expect(panelCreated).eq(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- suppress for test scope
    const taskEditor: TaskEditor = getTaskEditor()!;
    taskEditor["changed"] = true;
    MockVSCodeInfo.dialogAnswer = messages.DISCARD_CHANGES_BUTTON_TEXT();
    const tasks = [
      {
        label: "task 1",
        type: "testType",
        taskType: "Deploy",
        prop1: "value 1.1",
      },
      {
        label: "task 2",
        type: "testType",
        taskType: "Deploy",
        prop1: "value 1.2",
      },
    ];
    await createTask(new MockTasksProvider(tasks), readFile);
    // selection panel created
    expect(panelCreated).eq(2);
  });

  describe("Function disposeTaskEditorView", () => {
    it("creates new instance of panel on the second call after disposing a previous instance", async () => {
      const tasks = [
        {
          label: "task 2",
          type: "testType",
          taskType: "Deploy",
          prop1: "value 1.2",
        },
      ];
      await createTask(new MockTasksProvider(tasks), readFile);
      expect(panelCreated).eq(1);
      await createTask(new MockTasksProvider(tasks), readFile);
      expect(panelCreated).eq(2);
    });
  });
});
