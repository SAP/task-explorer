import { find, map } from "lodash";
import { workspace, WorkspaceFolder } from "vscode";

const datauri = require("datauri/sync");

export function getImage(imagePath: string): string {
  let image;
  try {
    image = datauri(imagePath);
  } catch (error) {
    // image = DEFAULT_IMAGE;
  }
  return image;
}
