const path = require("path");

module.exports = {
  mode: "development",
  resolve: {
    extensions: [".ts", ".js"],
    modules: [
      path.resolve(__dirname, ".."), // 상위 디렉토리도 모듈 검색 경로에 추가
      "node_modules",
    ],
    alias: {
      "@noctaCrdt": path.resolve(process.cwd(), "../@noctaCrdt/dist/src"),
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
