module.exports = {
  // https://github.com/vuejs/vue-cli/issues/1363#issuecomment-609913867
  chainWebpack: (config) => {
    if (process.env.NODE_ENV === "test") {
      config.module
        .rule("js")
        .test(/\.js$/)
        .use("istanbul-instrumenter-loader")
        .loader("istanbul-instrumenter-loader")
        .options({
          esModules: true,
        });
    }
  },
};
