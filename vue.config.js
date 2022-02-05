const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
    publicPath: process.env.BASE_URL || "/vodplayer",
    transpileDependencies: true,
    lintOnSave: false,
});
