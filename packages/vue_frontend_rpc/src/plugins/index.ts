/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import vuetify from './vuetify'

// Types
import type { App } from 'vue'
import Form from "@sap-devx/inquirer-gui";

export function registerPlugins (app: App) {
  app.use(vuetify)
  app.use(Form, { vuetify })
}
