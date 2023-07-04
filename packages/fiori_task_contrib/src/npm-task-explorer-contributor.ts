import { readFile } from "fs-extra";
import { join } from "path";
import {
  ComboboxFormProperty,
  FormProperty,
  SimpleFormProperty,
  TaskEditorContributionAPI,
  TaskUserInput,
} from "@sap_oss/task_contrib_types";
import { NpmDefinitionType } from "./definitions";
import { getImage } from "./utils";
import { isEmpty } from "lodash";
// import { executeCommand } from "../utils/exec";

export class TaskExplorerContributor implements TaskEditorContributionAPI<NpmDefinitionType> {
  // private readonly flagRegex = /[-]{1,2}[a-z]+/g;
  // private readonly invalidArgumentsMsg = "invalid arguments";

  private scripts: Record<string, string> = {};
  // private argumentsValid = true;
  // private possibleArguments: string[] = [];
  private readonly image: string;

  private readonly labelProperty: SimpleFormProperty = {
    type: "label",
  };
  private readonly pathProperty: SimpleFormProperty = {
    type: "input",
    taskProperty: "path",
    readonly: true,
  };
  // names of the scripts in package.json
  private readonly scriptProperty: ComboboxFormProperty = {
    type: "combobox",
    taskProperty: "script",
    list: [],
  };
  // command relating to the selected script
  private readonly scriptContentProperty: SimpleFormProperty = {
    type: "input",
    name: "scriptContent",
    message: "Command",
    readonly: true,
  };
  // // additional arguments
  // private readonly argumentsProperty: SimpleFormProperty = {
  //   type: "input",
  //   taskProperty: "arguments",
  //   optional: true,
  //   isValid: (): string => {
  //     return this.argumentsValid ? "" : this.invalidArgumentsMsg;
  //   },
  // };
  // help related to the selected script's command
  // private readonly helpProperty: SimpleFormProperty = {
  //   type: "editor",
  //   name: "help",
  //   message: "Command help",
  //   optional: true,
  // };

  constructor(private readonly extensionPath: string) {
    this.image = getImage(join(this.extensionPath, "resources", "npm_48px.svg"));
  }

  // in the `init` method we make initializations
  // related to the edited task
  async init(wsFolder: string, task: NpmDefinitionType): Promise<void> {
    const fileContent = await readFile(task.path, "utf8");
    const contentJSON = JSON.parse(fileContent);
    this.scripts = contentJSON["scripts"];
    this.scriptProperty.list = Object.keys(this.scripts);
    // this.setScriptInfo(task.script, task.arguments);
  }

  convertTaskToFormProperties(task: NpmDefinitionType): FormProperty[] {
    const properties: FormProperty[] = [this.scriptProperty, this.pathProperty, this.labelProperty];
    // properties visible only when script is selected
    if (task.script !== "") {
      properties.push(this.scriptContentProperty);
      // properties.push(this.argumentsProperty);
    }
    // // help property is visible when arguments are invalid
    // if (!this.argumentsValid) {
    //   properties.push(this.helpProperty);
    // }
    return properties;
  }

  getTaskImage(): string {
    return this.image;
  }

  // syncs task with user's input
  async updateTask(task: NpmDefinitionType, inputs: TaskUserInput): Promise<NpmDefinitionType> {
    // set updated task properties
    task.label = inputs.label;
    task.arguments = inputs.arguments ?? "";
    task.script = inputs.script;
    // set other properties that relate to presentation only
    await this.setScriptInfo(task.script, task.arguments);
    return task;
  }

  private async setScriptInfo(script: string, args: string): Promise<void> {
    if (!isEmpty(script)) {
      this.scriptContentProperty.value = this.scripts[script];
      //   this.helpProperty.value = (await this.getCommandHelp(script)) ?? "";
      //   this.possibleArguments = this.helpProperty.value.match(this.flagRegex) ?? [];
      //   this.argumentsValid = this.areArgumentsValid(args);
    } else {
      if (args) {
        console.debug("");
      }
      this.scriptContentProperty.value = "";
      //   this.helpProperty.value = "";
      //   this.possibleArguments = [];
      //   this.argumentsValid = true;
    }
  }

  // private areArgumentsValid(value: string): boolean {
  //   // arguments validation is very basic, for demonstration purposes only
  //   // we check only tokens looking like flags
  //   // searching for tokens looking like flags in the help of the selected command
  //   if (value !== "") {
  //     const usedArguments = value.match(this.flagRegex);
  //     if (usedArguments === null) {
  //       return false;
  //     }
  //     for (const usedArgument of usedArguments) {
  //       if (!this.possibleArguments.includes(usedArgument)) {
  //         return false;
  //       }
  //     }
  //   }
  //   return true;
  // }

  // private async getCommandHelp(script: string): Promise<string | undefined> {
  //   if (script !== "") {
  //     const command = this.getCommandByScript(script);
  //     if (command !== undefined) {
  //       return await executeCommand(`${command} --help`);
  //     }
  //   }
  //   return undefined;
  // }

  // private getCommandByScript(script: string | undefined): string | undefined {
  //   if (script !== undefined) {
  //     const fullOriginalCommand = this.scripts[script];
  //     const fullOriginalCommandWords = fullOriginalCommand.split(" ");
  //     if (
  //       // if command looks like 'npm run <script>' we look for
  //       // the script <script> in the same package.json
  //       fullOriginalCommandWords.length > 2 &&
  //       fullOriginalCommandWords[0] === "npm" &&
  //       fullOriginalCommandWords[1] === "run"
  //     ) {
  //       return this.getCommandByScript(fullOriginalCommandWords[2]);
  //     } else {
  //       return fullOriginalCommandWords[0];
  //     }
  //   }
  //   return undefined;
  // }
}
