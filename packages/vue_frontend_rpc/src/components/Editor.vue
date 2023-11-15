<template>
  <v-main id="editor-component" v-if="editor">
    <v-row class="main-row ma-0 pa-0">
      <v-col class="main-col ma-0 pa-0">
        <v-card class="main-card mr-16 pb-2">
          <v-card-title class="task-intro">
            <v-img v-show="false" class="task-icon" :src="task.taskImage"></v-img>
            <div class="task-label">{{ task.label }}</div>
            <v-spacer></v-spacer>
            <div>
              <v-divider vertical inset></v-divider>
              <v-btn id="exec" text tile @click="onExec" :disabled="!isExecuteEnabled">
                <div class="exec-title">{{ task.taskIntent }}</div>
                <div
                  :style="{
                    maskImage: `url(${task.taskExecutionImage})`,
                    webkitMaskImage: `url(${task.taskExecutionImage})`,
                  }"
                  class="exec-icon"
                ></div>
              </v-btn>
            </div>
          </v-card-title>
          <v-divider></v-divider>
          <v-list-group class="my-list-group" :value="true" sub-group prepend-icon="$expand">
            <template v-slot:activator>
              <v-list-item-content>
                <v-list-item-title>General Properties</v-list-item-title>
              </v-list-item-content>
              <v-list-item-content>
                <Form ref="form" :questions="questions" @answered="onAnswered" />
              </v-list-item-content>
            </template>
          </v-list-group>
        </v-card>
      </v-col>
    </v-row>

    <v-divider class="mr-16"></v-divider>
    <v-row style="height: 4rem" class="mr-16" v-if="editor" sm="auto">
      <v-col class="bottom-buttons-col" style="display: flex; align-items: center">
        <v-btn id="save" :disabled="!state.saveEnabled" @click="onSave"> Save </v-btn>
      </v-col>
    </v-row>
  </v-main>
</template>

<script>
const FUNCTION = "__Function";

export default {
  name: "Editor",
  props: ["editor", "rpc"],
  data() {
    return {
      task: Object,
      questions: [],
      state: {
        saveEnabled: false,
        firstRender: true,
        inputValid: false,
      },
    };
  },
  mounted() {
    this.init();
  },
  computed: {
    isExecuteEnabled: function () {
      const t = this.state.inputValid && !this.state.saveEnabled;
      console.log(t);
      return t;
    },
  },
  methods: {
    init() {},
    setTask(task) {
      this.task = task;
      this.prepareTask(task);
    },
    async onExec() {
      await this.rpc.invoke("executeTask");
    },
    async onSave() {
      // disable save button once saved
      this.state.saveEnabled = false;
      await this.rpc.invoke("saveTask");
    },
    prepareTask(task) {
      const questions = [...task.content];
      for (const question of questions) {
        for (const prop in question) {
          if (question[prop] === FUNCTION) {
            var that = this;
            question[prop] = async (...args) => {
              const response = await that.rpc.invoke("evaluateMethod", [question.name, prop, args]);
              return response;
            };
          }
        }
      }
      this.questions = questions;
    },
    getEvaluationFunction(rpc, questionName, questionProperty) {
      return async (...args) => {
        return rpc.invoke("evaluateMethod", [args, questionName, questionProperty]);
      };
    },
    async onAnswered(answers, issues) {
      this.state.inputValid = issues === undefined;
      this.state.saveEnabled = !this.state.firstRender && this.state.inputValid;
      if (!this.state.firstRender) {
        await this.rpc.invoke("setAnswers", [{ answers: answers }]);
        this.task.label = answers.label;
      }

      this.state.firstRender = false;
    },
  },
};
</script>

<style>
html,
body {
  height: 100%;
  padding: 0px;
}

.inquirer-gui {
  margin: 8px;
}

.inquirer-gui div.v-field {
  border-radius: 0;
}

.inquirer-gui .v-card.v-card--outlined.v-sheet.theme--light {
  border-radius: 0;
  border-width: medium;
  border-color: black;
}

.inquirer-gui .v-card .v-image__image--cover {
  background-size: contain;
}

div.v-application.v-theme--light {
  background-color: var(--vscode-editor-background, white);
  color: var(--vscode-editor-foreground, black);
}

/* --vscode-focusBorder */

form.inquirer-gui p.question-label {
  color: var(--vscode-panelTitle-activeForeground, black);
}

form.inquirer-gui .v-input .v-input__control .v-field.v-theme--light.v-field--focused {
  border-color: var(--vscode-inputOption-activeBorder, white);
}

form.inquirer-gui .v-input .v-input__control .v-field.v-theme--light {
  background-color: var(--vscode-input-background, darkgray);
}

form.inquirer-gui div.theme--light.v-select {
  color: pink;
}
form.inquirer-gui div.theme--light.v-input input,
form.inquirer-gui div.theme--light.v-input textarea {
  color: var(--vscode-input-foreground, white);
}

form.inquirer-gui .error-validation-text {
  color: brown;
}

form.inquirer-gui .mandatory-asterisk {
  color: red;
}
.inquirer-gui .v-field__input {
  opacity: 1;
}
</style>
