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
// @flow
import path from 'path';
import React from 'react';
import Loadable from 'react-loadable';

type Props = {
  isLoading: boolean,
  error: Error | null,
  pastDelay: null,
};

let MyLoadingComponent = ({isLoading, error, pastDelay}: Props) => {
  if (isLoading) {
    return pastDelay ? <div>Loading...</div> : null; // Don't flash "Loading..." when we don't need to.
  } else if (error) {
    return <div>Error! Component failed to load</div>;
  } else {
    return null;
  }
};

let LoadableMyComponent = Loadable(
  () => import('./MyComponent'),
  MyLoadingComponent,
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
  delay?: number = 200,
  serverSideRequirePath?: string
)
```

#### `loader`

Function returning promise returning a React component displayed on success.

Resulting React component receives all the props passed to the generated
component.

#### `LoadingComponent`

React component displayed after `delay` until `loader()` succeeds. Also
responsible for displaying errors.

```js
type Props = {
  isLoading: boolean,
  error: Error | null,
  pastDelay: null,
};  

let MyLoadingComponent = ({isLoading, error, pastDelay}: Props) => {
  if (isLoading) {
    return pastDelay ? <div>Loading...</div> : null; // Don't flash "Loading..." when we don't need to.
  } else if (error) {
    return <div>Error! Component failed to load</div>;
  } else {
    return null;
  }
};
```

#### `delay` (optional, defaults to `200`, in milliseconds)

Only show the `LoadingComponent` if the `loader()` has taken this long to
succeed or error.

#### `serverSideRequirePath` (optional)

When rendering server-side, `require()` this path to load the component
instead, this way it happens synchronously.
