<template>
  <v-main id="selector-component" v-if="selector">
    <v-row class="main-row ma-0 pa-0">
      <v-col class="main-col ma-0 pa-0">
        <v-card class="main-card mr-16 pb-2">
          <v-card-title class="selection-intro">
            <div class="selection-title">Create Task</div>
          </v-card-title>
          <v-divider></v-divider>
          <div v-if="message" class="selector-message">
            <v-text>{{ message }}</v-text>
          </div>
          <v-list-group
            class="tasksByIntent"
            v-for="(tasksGroup, tasksGroupIndex) in tasks"
            :key="tasksGroup.intent"
            :value="false"
            sub-group
            prepend-icon="$expand"
          >
            <template v-slot:activator>
              <v-list-item-title class="intent">{{ tasksGroup.intent }} </v-list-item-title>
            </template>
            <v-list-item-group>
              <v-list-item
                v-for="(task, taskIndex) in tasksGroup.tasksByIntent"
                @mouseover="mouseOnTask(tasksGroupIndex, taskIndex)"
                @mouseout="mouseOutTask()"
                :key="task.label"
                class="pl-10"
              >
                <v-img v-show="false" class="selection-task-icon" :src="task.__image"></v-img>
                <v-list-item-title
                  class="selection-task-label"
                  :class="{
                    active_task_label: isActive(tasksGroupIndex, taskIndex),
                  }"
                  >{{ task.label }}
                </v-list-item-title>
                <v-btn
                  id="configure"
                  v-show="isActive(tasksGroupIndex, taskIndex)"
                  x-small
                  @click="setSelectedTask(task)"
                >
                  Configure
                </v-btn>
              </v-list-item>
            </v-list-item-group>
          </v-list-group>
        </v-card>
      </v-col>
    </v-row>
  </v-main>
</template>

<script>
export default {
  name: "Selector",
  props: ["selector", "rpc"],
  data() {
    return {
      tasks: Object,
      message: null,
      hoverTasksGroupIndex: null,
      hoverTaskIndex: null,
    };
  },
  methods: {
    async setSelectedTask(task) {
      await this.rpc.invoke("setSelectedTask", [task]);
    },
    setTasks(tasks, message) {
      this.tasks = tasks;
      this.message = message;
    },
    mouseOnTask(tasksGroupIndex, taskIndex) {
      this.hoverTasksGroupIndex = tasksGroupIndex;
      this.hoverTaskIndex = taskIndex;
    },
    mouseOutTask() {
      this.hoverTasksGroupIndex = null;
      this.hoverTaskIndex = null;
    },
    isActive(tasksGroupIndex, taskIndex) {
      return this.hoverTaskIndex === taskIndex && this.hoverTasksGroupIndex === tasksGroupIndex;
    },
  },
};
</script>

<style>
.v-image.v-responsive.selection-task-icon {
  max-width: 1.5rem;
}
.v-list-item__title.selection-task-label {
  margin-left: 1rem;
  white-space: normal;
  padding-top: 1rem;
  padding-bottom: 1rem;
}
#configure {
  background-color: var(--vscode-button-background, #0e639c);
  border-radius: 0;
}
.show-btns {
  color: rgba(255, 255, 255, 1) !important;
}
.box-shadow {
  box-shadow: midnightblue;
}
.tasksByIntent.v-list-group--active {
  background-color: var(--vscode-editorWidget-background, #252526);
}
.selection-title,
.intent {
  font-weight: bold;
}
.selector-message {
  color: var(--vscode-input-foreground, #cccccc) !important;
  white-space: pre;
  line-height: 2.25rem;
  padding-top: 1rem;
}
.v-card__title.task-intro {
  padding-left: 0px;
}
.tasksByIntent > .v-list-item {
  border-bottom: 2px solid var(--vscode-editorWidget-background, #252526);
}
.tasksByIntent > .v-list-group__header.v-list-item--active:not(:hover):not(:focus):before {
  opacity: 0.12 !important;
}
.active_task_label {
  font-weight: bold;
}
</style>
