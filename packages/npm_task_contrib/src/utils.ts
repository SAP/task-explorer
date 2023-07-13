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
