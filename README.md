# `react-loadable`

A higher order component for loading components with promises.

- Returns `null` until after a `delay` (default: 200ms)
- Returns `<LoadingComponent/>` after `delay` and before `loader()` is successful
- Caches `Component` returned by `loader()` on success
- Shows optional `<ErrorComponent/>` any time the `loader()` fails until it succeeds.
- Avoids flashing states when it doesn't need to.
- Designed around module bundlers like Webpack (async imports work statically)
- Supports server-side rendering via a dynamic `require()`
- Eagerly preload components when needed
- Support for requiring synchronously from webpack when available

Example Project: https://github.com/thejameskyle/react-loadable-example

Introductory blog post: https://medium.com/@thejameskyle/react-loadable-2674c59de178#.6h46yjgwr

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

let LoadableMyComponent = Loadable({
  loader: () => import('./MyComponent'),
  LoadingComponent: MyLoadingComponent,
  // optional options...
  delay: 200,
  serverSideRequirePath: path.join(__dirname, './MyComponent'),
  webpackRequireWeakId: () => require.resolveWeak('./MyComponent'),
});

export default class Application extends React.Component {
  render() {
    return <LoadableMyComponent/>;
  }
}
```

### API

```js
Loadable({
  loader: () => Promise<React.Component>,
  LoadingComponent: React.Component,
  // optional options...
  delay?: number = 200,
  serverSideRequirePath?: string,
  webpackRequireWeakId?: () => number,
})
```

#### `opts.loader`

Function returning promise returning a React component displayed on success.

Resulting React component receives all the props passed to the generated
component.

#### `opts.LoadingComponent`

React component displayed after `delay` until `loader()` succeeds. Also
responsible for displaying errors.

```js
type Props = {
  isLoading: boolean,
  error: Error | null,
  pastDelay: boolean,
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

#### `opts.delay` (optional, defaults to `200`, in milliseconds)

Only show the `LoadingComponent` if the `loader()` has taken this long to
succeed or error.

#### `opts.serverSideRequirePath` (optional)

When rendering server-side, `require()` this path to load the component
instead, this way it happens synchronously. If you are rendering server-side
you should use this option.

#### `opts.webpackRequireWeakId` (optional)

In order for Loadable to `require()` a component synchronously (when possible)
instead of waiting for the promise returned by `import()` to resolve. If you
are using Webpack you should use this option.

```js
Loadable({
  // ...
  webpackRequireWeakId: () => require.resolveWeak('./MyComponent')
});
```

#### `Loadable.preload()`

The generated component has a static method `preload()` for calling the loader
function ahead of time. This is useful for scenarios where you think the user
might do something next and want to load the next component eagerly.

**Example:**

```js
let LoadableMyComponent = Loadable({
  loader: () => import('./MyComponent'),
  LoadingComponent: MyLoadingComponent,
});

class Application extends React.Component {
  state = { showComponent: false };

  onClick = () => {
    this.setState({ showComponent: true });
  };

  onMouseOver = () => {
    LoadableMyComponent.preload();
  };

  render() {
    return (
      <div>
        <button onClick={this.onClick} onMouseOver={this.onMouseOver}>
          Show loadable component
        </button>
        {this.state.showComponent && <LoadableMyComponent/>}
      </div>
    )
  }
}
```
