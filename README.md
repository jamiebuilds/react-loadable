# `react-loadable`

A higher order component for loading components with promises.

- Returns `null` until after a `delay` (default: 200ms)
- Returns `<LoadingComponent/>` after `delay` and before `loader()` is successful
- Caches `Component` returned by `loader()` on success
- Shows optional `<ErrorComponent/>` any time the `loader()` fails until it succeeds.
- Avoids flashing states when it doesn't need to.
- Designed around module bundlers like Webpack (async imports work statically)
- Supports server-side rendering via a dynamic `require()`

### Example

```js
import path from 'path';
import React from 'react';
import Loadable from 'react-loadable';

import MyLoadingComponent from './MyLoadingComponent';
import MyErrorComponent from './MyErrorComponent';

const LoadableMyComponent = Loadable(
  () => import('./MyComponent'),
  MyLoadingComponent,
  MyErrorComponent,
  200,
  path.join(__dirname, './MyComponent')
);

export default class Application extends React.Component {
  render() {
    return <LoadableMyComponent/>;
  }
}
```

### API

```js
Loader(
  loader: () => Promise<React.Component>,
  LoadingComponent: React.Component,
  ErrorComponent?: React.Component | null,
  delay?: number = 200,
  serverSideRequirePath?: string
)
```

#### `loader`

Function returning promise returning a React component displayed on success.

Resulting React component receives all the props passed to the generated
component.

#### `LoadingComponent`

React component displayed after `delay` until `loader()` succeeds or errors.

#### `MyErrorComponent` (optional, defaults to `null`)

React component displayed after `delay` until `loader()` errors.

Receives `error` prop with the promise rejection error.

#### `delay` (optional, defaults to `200`, in milliseconds)

Only show the `LoadingComponent` if the `loader()` has taken this long to
succeed or error.

#### `serverSideRequirePath` (optional)

When rendering server-side, `require()` this path to load the component
instead, this way it happens synchronously.
