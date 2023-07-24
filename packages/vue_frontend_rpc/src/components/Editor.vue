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
            </template>
            <v-list-item class="pl-10">
              <Form ref="form" :questions="task.content" @answered="onAnswered" />
            </v-list-item>
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
import Vue from "vue";
import { get } from "lodash";
import FileBrowserPlugin from "@sap-devx/inquirer-gui-file-browser-plugin";
import FolderBrowserPlugin from "@sap-devx/inquirer-gui-folder-browser-plugin";
import LabelPlugin from "@sap-devx/inquirer-gui-label-plugin";

const FUNCTION = "__Function";

export default {
  name: "Editor",
  props: ["editor", "rpc"],
  data() {
    return {
      task: Object,
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
      return this.state.inputValid && !this.state.saveEnabled;
    },
  },
  methods: {
    init() {
      // register custom inquirer-gui plugins
      this.registerPlugin(FileBrowserPlugin);
      this.registerPlugin(FolderBrowserPlugin);
      this.registerPlugin(LabelPlugin);
    },
    registerPlugin(plugin) {
      const options = {};
      Vue.use(plugin, options);
      if (options.plugin) {
        const registerPluginFunc = get(this.$refs, "form.registerPlugin");
        registerPluginFunc(options.plugin);
      }
    },
    setTask(task) {
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
      this.task = task;
      for (const question of task.content) {
        for (const prop in question) {
          if (question[prop] === FUNCTION) {
            const that = this;
            question[prop] = this.getEvaluationFunction(that.rpc, question.name, prop);
          }
        }
      }
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
