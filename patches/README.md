# Patches

We are using [patch-package](github.com/ds300/patch-package) to fix / workaround / hack-around
issues in **dev** dependencies.

Patches will be applied by the root monorepo `pacakge.json` on `post-install` script/hook.

## Current patches/issues

### Coverage report paths on `.vue` files with mocha + nyc are incorrect

This causes the istanbul HTML report to be unusable for those files.

- https://github.com/vuejs/vue-cli/issues/1363#issuecomment-609913867
- https://github.com/istanbuljs/istanbuljs/issues/464#issuecomment-610258911
- [patch code](./istanbul-lib-source-maps+4.0.0.patch)
