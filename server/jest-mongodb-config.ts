const config = {
  mongodbMemoryServerOptions: {
    binary: {
      version: "8.0.3", // 사용할 MongoDB 버전
      skipMD5: true,
    },
    autoStart: false,
    instance: {},
  },
};

export default config;
