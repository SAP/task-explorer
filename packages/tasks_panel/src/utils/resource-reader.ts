import { readFile } from "fs-extra";

export async function readResource(resourcePath: string): Promise<string> {
  return readFile(resourcePath, "utf8");
}
