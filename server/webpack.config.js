const path = require("path");

module.exports = {
  mode: "development",
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      "@noctaCrdt": path.resolve(__dirname, "../@noctaCrdt/dist"),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: "tsconfig.json",
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
};
