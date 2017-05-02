export const stats = {
  assetsByChunkName: {
    bootstrap: ["bootstrap.js", "bootstrap.no_css.js"],
    vendor: ["vendor.js", "vendor.no_css.js"],
    main: ["main.js", "main.no_css.js", "main.css"]
  },
  chunks: [
    {
      id: 0,
      files: ["0.js", "0.no_css.js", "0.css"]
    },
    {
      id: 1,
      files: ["1.js", "1.no_css.js", "1.css"]
    }
    // chunk with id: 2 intentionally missing to test against invalid stats
  ],
  modules: [
    {
      id: "qwer",
      name: "./src/Components/Example.js",
      chunks: [0]
    },
    {
      id: "asdf",
      name: "./src/Components/Foo.js",
      chunks: [1]
    },
    {
      id: "zxcv",
      name: "./src/Components/Bar.js",
      chunks: [2]
    }
  ],
  publicPath: "/static/"
};

export const babelFilePaths = [
  "./src/Components/Example.js",
  "./src/Components/Foo.js",
  "./src/Components/Bar.js"
];

export const webpackModuleIds = ["qwer", "asdf", "zxcv"];

export const rootDir = "/Users/jamesgillmore/App";
