import { createApp } from "vue";
import App from "./App.vue";
import "material-design-icons-iconfont/dist/material-design-icons.css";
import "./assets/css/globalStyles.css";
import "@sap-devx/inquirer-gui/dist/form.css";
import { registerPlugins } from './plugins/index'

const app = createApp(App);
registerPlugins(app)
app.mount("#app");
