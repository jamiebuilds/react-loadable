module.exports = function (api) {
  api.cache(true);

  const presets = [
    [
      "@babel/preset-env",
      {
        "loose": true
      }
    ],
    "@babel/preset-react"
  ];
  const plugins = [
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-transform-object-assign"
  ];

  return {
    presets,
    plugins
  };
}
