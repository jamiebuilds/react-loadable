# react-loadable-loader

> Webpack Loader for React Loadable server-side rendering

## Install

```
yarn add --dev react-loadable-loader
```

## Usage

In order to [send the right bundles down](https://github.com/thejameskyle/react-loadable#mapping-loaded-modules-to-bundles)
when rendering server-side, you'll need the React Loadable Webpack plugin 
to provide you with a mapping of modules to bundles.

```js
// webpack.config.js
import { ReactLoadablePlugin } from 'react-loadable/webpack';

export default {
  plugins: [
    new ReactLoadablePlugin({
      filename: './dist/react-loadable.json',
    }),
  ],
};
```

This will create a file (`opts.filename`) which you can import to map modules
to bundles.

[Read more about mapping modules to bundles](https://github.com/thejameskyle/react-loadable#mapping-loaded-modules-to-bundles).

### `getBundles`

A method exported by `react-loadable/webpack` for converting modules to
bundles.

```js
import { getBundles } from 'react-loadable/webpack';

let bundles = getBundles(stats, modules);
```

[Read more about mapping modules to bundles](https://github.com/thejameskyle/react-loadable#mapping-loaded-modules-to-bundles).
