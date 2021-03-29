const { resolve } = require("path");
const { writeFileSync } = require("fs");
const { expect } = require("chai");

const newVersion = require("../lerna.json").version;
const rootPkgJson = require("../package.json");
// This script should only never be executed if it has no side effect --> indicates a devops bug.
expect(newVersion).to.not.equal(rootPkgJson.version);

// xMake GAV related logic expects the **root** package.json to be changed
// when triggering a release.
rootPkgJson.version = newVersion;
const rootPkgJsonPath = resolve(__dirname, "..", "package.json");
const updatedRootPkgText = JSON.stringify(rootPkgJson, null, 2);
writeFileSync(rootPkgJsonPath, updatedRootPkgText);
