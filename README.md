# `react-loadable`

> A higher order component for loading components with dynamic imports.

## Example

```js
import Loadable from 'react-loadable';
import Loading from './my-loading-component';

const LoadableComponent = Loadable({
  loader: () => import('./my-component'),
  loading: Loading,
});

export default class App extends React.Component {
  render() {
    return <LoadableComponent/>;
  }
}
```

## Happy Customers:

- ["I'm obsessed with this right now: CRA with React Router v4 and react-loadable. Free code splitting, this is so easy."](https://twitter.com/matzatorski/status/872059865350406144)
- ["Webpack 2 upgrade & react-loadable; initial load from 1.1mb to 529kb in under 2 hours. Immense."](https://twitter.com/jwbradley87/status/847191118269833216)
- ["Oh hey - using loadable component I knocked 13K off my initial load. Easy win!"](https://twitter.com/AdamRackis/status/846593080992153600)
- ["Had a look and its awesome. shaved like 50kb off our main bundle."](https://github.com/quran/quran.com-frontend/pull/701#issuecomment-287908551)

## Also See:

- [`react-loadable-visibility`](https://github.com/stratiformltd/react-loadable-visibility) - Building on top of and keeping the same API as `react-loadable`, this library enables you to load content that is visible on the screen.

## Guide

### `opts.loader`

```js
Loadable({
  loader: () => import('./my-component'),
});
```

If you want to customize what gets rendered from your loader you can also pass
`render`.

```js
Loadable({
  loader: () => import('./my-component'),
  render(loaded, props) {
    let Component = loaded.namedExport;
    return <Component {...props}/>;
  }
});
```

> **Note:**  If you want to load multiple resources at once, you can also use
> [`Loadable.Map`](#loadablemap).

Your loader will only ever be called once. The results are cached.

### `opts.loading`

This is a component that will render as your other component is loading.

```js
Loadable({
  loading: LoadingComponent,
});
```

You must always pass a `loading` component even if you only return `null`.

```js
Loadable({
  loading: () => null,
});
```

The loading component itself should look something like this:

```js
function MyLoadingComponent(props) {
  if (props.isLoading) {
    // While our other component is loading...
    if (props.timedOut) {
      // In case we've timed out loading our other component.
      return <div>Loader timed out!</div>;
    } else if (props.pastDelay) {
      // Display a loading screen after a set delay.
      return <div>Loading...</div>;
    } else {
      // Don't flash "Loading..." when we don't need to.
      return null;
    }
  } else if (props.error) {
    // If we aren't loading, maybe
    return <div>Error! Component failed to load</div>;
  } else {
    // This case shouldn't happen... but we'll return null anyways.
    return null;
  }
}
```

### `opts.delay`

```js
Loadable({
  delay: 200
});
```

Flashing a loading screen immediately can actually cause users to perceive
something taking longer than it did in reality. It's often better to not show
the user anything for a few hundred milliseconds in case something loads right
away.

To enable this, we have a `delay` option which will default to 200ms.

After the set `delay`, the `loading` component will receive a prop named
`pastDelay` which will be `true` which you can handle however you want.

### `opts.timeout`

```js
Loadable({
  timeout: 10000
});
```

Showing the user a loading screen for too long can cause frustration. It's
often better just to tell the user that something took longer than normal and
maybe that they should refresh.

To enable this, we have a `timeout` option which is disabled by default.

After the set `timeout`, the `loading` component will receive a prop named
`timedOut` which will be `true` which you can handle however you want.

### `opts.render`

```js
Loadable({
  render(loaded, props) {
    let Component = loaded.default;
    return <Component {...props}/>;
  }
});
```

See `opts.loader` above.

### `LoadableComponent.preload()`

```js
const LoadableComponent = Loadable({...});

LoadableComponent.preload();
```

The generated component from `Loadable` has a static method named `preload()`
for calling the loader ahead of time. This is useful for scenarios where you
think the user might do something next and want to load the next component
eagerly.

**Example:**

```js
const LoadableMyComponent = Loadable({
  loader: () => import('./MyComponent'),
  loading: MyLoadingComponent,
});

class App extends React.Component {
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

> **Note:** `preload()` intentionally does not return a promise. You should not
> be depending on the timing of `preload()`. It's meant as a performance
> optimization, not for creating UI logic.

### `Loadable.Map`

If you want to load multiple resources, you can use `Loadable.Map` and pass an
object as a `loader` and specify a `render` method that stitches them together.

```js
Loadable.Map({
  loader: {
    Component: () => import('./my-component'),
    translations: () => fetch('./foo-translations.json').then(res => res.json()),
  },
  render(loaded, props) {
    let Component = loaded.Component.default;
    let translations = loaded.translations;
    return <Component {...props} translations={translations}/>;
  }
});
```

When using `Loadable.Map` the `render()` method's `loaded` param will be an
object with the same shape as your `loader`.

### How do I avoid repetition?

Specifying the same `loading` component or `delay` every time you use
`Loadable()` gets repetitive fast. Instead you can wrap `Loadable` with your
own Higher-Order Component (HOC) to set default options.

```js
import Loadable from 'react-loadable';
import Loading from './my-loading-component';

export default function MyLoadable(opts) {
  return Loadable(Object.assign({
    loading: Loading,
    delay: 200,
    timeout: 10,
  }, opts));
};
```

Then you can just specify a `loader` when you go to use it.

```js
import MyLoadable from './MyLoadable';

const LoadableMyComponent = MyLoadable({
  loader: () => import('./MyComponent'),
});

export default class App extends React.Component {
  render() {
    return <LoadableMyComponent/>;
  }
}
```

### `babel-plugin-import-inspector`

To allow for some more complicated features like server-side rendering and
synchronous rendering in webpack, you'll need to use the
[`import-inspector`](https://github.com/thejameskyle/babel-plugin-import-inspector)
[Babel](https://babeljs.io) plugin.

```js
yarn add --dev babel-plugin-import-inspector
```

```js
{
  "plugins": [
    ["import-inspector", {
      "serverSideRequirePath": true,
      "webpackRequireWeakId": true,
    }]
  ]
}
```

### Server-side rendering

See [`babel-plugin-import-inspector`](#babel-plugin-import-inspector) and make
sure to set `serverSideRequirePath` to `true`.

```js
{
  "plugins": [
    ["import-inspector", {
      "serverSideRequirePath": true,
    }]
  ]
}
```

Rendering server-side should then just work.

### Sync rendering preloaded imports in Webpack

See [`babel-plugin-import-inspector`](#babel-plugin-import-inspector) and make
sure to set `webpackRequireWeakId` to `true`.

```js
{
  "plugins": [
    ["import-inspector", {
      "webpackRequireWeakId": true,
    }]
  ]
}
```

Synchronously rendering preloaded imports in Webpack should then just work.


### Server-side rendering

This requires using a special [Babel](https://babeljs.io) plugin,
[`babel-plugin-import-inspector`](https://github.com/thejameskyle/babel-plugin-import-inspector),
which will wrap every dynamic `import()` in your app with metadata which will
allow React Loadable to render your component server-side.

To install:

```js
yarn add --dev babel-plugin-import-inspector
```

Then add this to your `.babelrc`:

```js
{
  "plugins": [
    ["import-inspector", {
      "serverSideRequirePath": true,
    }]
  ]
}
```

Your imports will then look like this:

```js
report(import("./module"), {
  // ...
  serverSideRequirePath: path.join(__dirname, "./module"),
  webpackRequireWeakId: () => require.resolveWeak("./module"),
});
```

Rendering server-side should then just work.
