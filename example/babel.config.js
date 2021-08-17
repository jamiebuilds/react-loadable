module.exports = function (api) {
  api.cache(true);

  const presets = [
    "@babel/preset-env",
    "@babel/preset-react"
  ];
  const plugins = [
    "dynamic-import-node",
    "@babel/plugin-proposal-class-properties",
    "../babel",
    [
      "module-resolver",
      {
        "alias": {
          "react-loadable": "./src/index.js",
          "react-loadable-webpack": "./src/webpack.js"
        }
      }
    ]
  ];

  return {
    presets,
    plugins
  };
}