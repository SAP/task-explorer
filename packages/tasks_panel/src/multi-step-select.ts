import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { each, extend, filter, find, groupBy, isEqual, keys, map, size, sortBy, uniq } from "lodash";
import {
  QuickPickItem,
  window,
  Disposable,
  QuickInputButton,
  QuickInput,
  QuickInputButtons,
  QuickPickItemKind,
  QuickPick,
} from "vscode";
import { MISC, isMatchBuild, isMatchDeploy } from "./utils/ws-folder";
import { messages } from "./i18n/messages";

const miscItem = { label: "$(list-unordered)", description: MISC, type: "intent" };

function grabProjectItems(tasks: ConfiguredTask[], project?: string): QuickPickItem[] {
  const projects = keys(groupBy(tasks, "__wsFolder"));
  const items = project && projects.includes(project) ? [project] : projects;
  return map(items, (_) => {
    return { label: "$(folder)", description: _ };
  });
}

function grabTasksByGroup(tasks: ConfiguredTask[], project: string): QuickPickItem[] {
  const pickItems: any[] = [];
  const tasksByProject = filter(tasks, ["__wsFolder", project]);
  each(sortBy(uniq(map(tasksByProject, "__intent"))), (intent) => {
    // add a group separator
    if (isMatchDeploy(intent) || isMatchBuild(intent)) {
      pickItems.push({ label: intent, kind: QuickPickItemKind.Separator });
      pickItems.push(...filter(tasksByProject, ["__intent", intent]));
    } else {
      if (!find(pickItems, miscItem)) {
        // add a special item (once) --> 'Miscellaneous' group
        pickItems.push({ label: MISC, kind: QuickPickItemKind.Separator });
        pickItems.push(miscItem);
      }
    }
  });
  return pickItems;
}

function grabMiscTasksByProject(tasks: ConfiguredTask[], project: string): QuickPickItem[] {
  const tasksByProject = filter(tasks, ["__wsFolder", project]);
  return filter(tasksByProject, (_) => {
    return !isMatchDeploy(_.__intent) && !isMatchBuild(_.__intent);
  });
}

/* istanbul ignore next */
export async function multiStepTaskSelect(tasks: ConfiguredTask[], project?: string): Promise<any> {
  interface State {
    title: string;
    step: number;
    totalSteps: number;
    project: QuickPickItem;
    taskByGroup: QuickPickItem;
    task: QuickPickItem;
  }

  async function collectInputs(): Promise<State> {
    const state = {} as Partial<State>;
    const projects = grabProjectItems(tasks, project);
    let step: InputStep;
    if (size(projects) > 1) {
      step = (input) => pickProjects(input, state);
    } else {
      state.project = projects[0];
      step = (input) => pickTaskByGroup(input, state);
    }
    await MultiStepSelection.run(step);
    return state as State;
  }

  async function pickProjects(input: MultiStepSelection, state: Partial<State>) {
    const pickItems = grabProjectItems(tasks, project);
    state.project = await input.showQuickPick({
      placeholder: messages.create_task_pick_project_placeholder,
      items: pickItems,
      activeItem: find(pickItems, state.project),
      shouldResume: shouldResume,
    });
    return (input: MultiStepSelection) => pickTaskByGroup(input, state);
  }

  async function pickTaskByGroup(input: MultiStepSelection, state: Partial<State>) {
    const pickItems = grabTasksByGroup(tasks, state.project?.description as string);
    state.taskByGroup = await input.showQuickPick({
      placeholder: messages.create_task_pick_task_placeholder,
      items: pickItems,
      activeItem: find(pickItems, state.taskByGroup),
      shouldResume: shouldResume,
    });
    if (isEqual(state.taskByGroup, miscItem)) {
      return (input: MultiStepSelection) => pickMiscTask(input, state);
    } else {
      state.task = state.taskByGroup;
    }
  }

  async function pickMiscTask(input: MultiStepSelection, state: Partial<State>) {
    const pickItems = grabMiscTasksByProject(tasks, state.project?.description as string);
    state.task = await input.showQuickPick({
      placeholder: messages.create_task_pick_task_placeholder,
      items: pickItems,
      activeItem: find(pickItems, state.task) as QuickPickItem | undefined,
      shouldResume: shouldResume,
    });
  }

  function shouldResume() {
    // Could show a notification with the option to resume.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- for future use
    return new Promise<boolean>((resolve, reject) => {
      // noop
    });
  }

  return collectInputs();
}

class InputFlowAction {
  static back = new InputFlowAction();
  static cancel = new InputFlowAction();
  static resume = new InputFlowAction();
}

type InputStep = (input: MultiStepSelection) => Thenable<InputStep | void>;

interface QuickPickParameters<T extends QuickPickItem> {
  title?: string;
  step?: number;
  totalSteps?: number;
  items: T[];
  activeItem?: T;
  ignoreFocusOut?: boolean;
  placeholder: string;
  buttons?: QuickInputButton[];
  shouldResume: () => Thenable<boolean>;
}

/* istanbul ignore next */
class MultiStepSelection {
  static async run(start: InputStep) {
    const input = new MultiStepSelection();
    return input.stepThrough(start);
  }

  private current?: QuickInput;
  private steps: InputStep[] = [];

  private async stepThrough(start: InputStep) {
    let step: InputStep | void = start;
    while (step) {
      this.steps.push(step);
      try {
        step = await step(this);
      } catch (err) {
        if (err === InputFlowAction.back) {
          this.steps.pop();
          step = this.steps.pop();
        } else if (err === InputFlowAction.resume) {
          step = this.steps.pop();
        } else if (err === InputFlowAction.cancel) {
          step = undefined;
        } else {
          throw err;
        }
      }
    }
    if (this.current) {
      this.current.dispose();
    }
  }

  async showQuickPick<T extends QuickPickItem, P extends QuickPickParameters<T>>({
    title,
    step,
    totalSteps,
    items,
    activeItem,
    ignoreFocusOut,
    placeholder,
    buttons,
    shouldResume,
  }: P) {
    const disposables: Disposable[] = [];
    try {
      return await new Promise<T | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
        const input: QuickPick<T> = extend(
          window.createQuickPick<T>(),
          title ? { title } : {},
          step ? { step } : {},
          totalSteps ? { totalSteps } : {},
          ignoreFocusOut ? { ignoreFocusOut } : { ignoreFocusOut: true },
          { matchOnDescription: true },
          { placeholder, items },
          activeItem ? { activeItems: [activeItem] } : {}
        );
        input.buttons = [...(this.steps.length > 1 ? [QuickInputButtons.Back] : []), ...(buttons || [])];
        disposables.push(
          input.onDidTriggerButton((item) => {
            if (item === QuickInputButtons.Back) {
              reject(InputFlowAction.back);
            } else {
              resolve(<any>item);
            }
          }),
          input.onDidChangeSelection((items) => resolve(items[0])),
          input.onDidHide(() => {
            (async () => {
              reject(shouldResume && (await shouldResume()) ? InputFlowAction.resume : InputFlowAction.cancel);
            })().catch(reject);
          })
        );
        if (this.current) {
          this.current.dispose();
        }
        this.current = input;
        this.current.show();
      });
    } finally {
      disposables.forEach((d) => d.dispose());
    }
  }
}

// for unit testing purpose only
export const __internal = {
  grabMiscTasksByProject,
  grabProjectItems,
  grabTasksByGroup,
  miscItem,
};
