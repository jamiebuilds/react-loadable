# babel-plugin-react-loadable

>

## Install

```
yarn add --dev babel-plugin-react-loadable
```

## Usage

Providing [`opts.webpack`](#optswebpack) and [`opts.modules`](#optsmodules) for
every loadable component is a lot of manual work to remember to do.

Instead you can add the Babel plugin to your config and it will automate it for
you:

```json
{
  "plugins": ["react-loadable/babel"]
}
```

**Input**

```js
import Loadable from 'react-loadable';

const LoadableMyComponent = Loadable({
  loader: () => import('./MyComponent'),
});

const LoadableComponents = Loadable.Map({
  loader: {
    One: () => import('./One'),
    Two: () => import('./Two'),
  },
});
```

**Output**

```js
import Loadable from 'react-loadable';
import path from 'path';

const LoadableMyComponent = Loadable({
  loader: () => import('./MyComponent'),
  webpack: () => [require.resolveWeak('./MyComponent')],
  modules: [path.join(__dirname, './MyComponent')],
});

const LoadableComponents = Loadable.Map({
  loader: {
    One: () => import('./One'),
    Two: () => import('./Two'),
  },
  webpack: () => [require.resolveWeak('./One'), require.resolveWeak('./Two')],
  modules: [path.join(__dirname, './One'), path.join(__dirname, './Two')],
});
```

[Read more about declaring modules](#declaring-which-modules-are-being-loaded).
