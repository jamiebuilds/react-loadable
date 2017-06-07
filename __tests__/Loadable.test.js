// @noflow
declare var test: any;
import path from "path";
import React from "react";
import renderer from "react-test-renderer";
import Loadable, {
  flushServerSideRequirePaths,
  flushWebpackRequireWeakIds,
  flushRequires
} from "../src";

// normalize the required path so tests pass in all environments
let normalizePath = path => path.split("__fixtures__")[1];

let waitFor = (delay: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, delay);
  });
};

let createLoader = (delay, Component, error?) => {
  return async () => {
    await waitFor(delay);
    if (Component) {
      return Component;
    } else {
      throw error;
    }
  };
};

let MyLoadingComponent = props => (
  <div>MyLoadingComponent {JSON.stringify(props)}</div>
);
let MyComponent = props => <div>MyComponent {JSON.stringify(props)}</div>;

test("loading success", async () => {
  let LoadableMyComponent = Loadable({
    loader: createLoader(400, MyComponent),
    LoadingComponent: MyLoadingComponent
  });

  let component1 = renderer.create(<LoadableMyComponent prop="foo" />);

  expect(component1.toJSON()).toMatchSnapshot(); // initial
  await waitFor(200);
  expect(component1.toJSON()).toMatchSnapshot(); // loading
  await waitFor(200);
  expect(component1.toJSON()).toMatchSnapshot(); // loaded

  let component2 = renderer.create(<LoadableMyComponent prop="bar" />);

  expect(component2.toJSON()).toMatchSnapshot(); // reload
});

test("loading error", async () => {
  let LoadableMyComponent = Loadable({
    loader: createLoader(400, null, new Error("test error")),
    LoadingComponent: MyLoadingComponent
  });

  let component = renderer.create(<LoadableMyComponent prop="baz" />);

  expect(component.toJSON()).toMatchSnapshot(); // initial
  await waitFor(200);
  expect(component.toJSON()).toMatchSnapshot(); // loading
  await waitFor(200);
  expect(component.toJSON()).toMatchSnapshot(); // errored
});

test("server side rendering", async () => {
  let LoadableMyComponent = Loadable({
    loader: createLoader(400, null, new Error("test error")),
    LoadingComponent: MyLoadingComponent,
    serverSideRequirePath: path.join(__dirname, "../__fixtures__/component.js")
  });

  let component = renderer.create(<LoadableMyComponent prop="baz" />);

  expect(component.toJSON()).toMatchSnapshot(); // serverside
});

test("server side rendering es6", async () => {
  let LoadableMyComponent = Loadable({
    loader: createLoader(400, null, new Error("test error")),
    LoadingComponent: MyLoadingComponent,
    serverSideRequirePath: path.join(
      __dirname,
      "../__fixtures__/component.es6.js"
    )
  });

  let component = renderer.create(<LoadableMyComponent prop="baz" />);

  expect(component.toJSON()).toMatchSnapshot(); // serverside
});

test("preload", async () => {
  let LoadableMyComponent = Loadable({
    loader: createLoader(400, MyComponent),
    LoadingComponent: MyLoadingComponent
  });

  LoadableMyComponent.preload();
  await waitFor(200);

  let component1 = renderer.create(<LoadableMyComponent prop="baz" />);

  expect(component1.toJSON()).toMatchSnapshot(); // still loading...
  await waitFor(200);
  expect(component1.toJSON()).toMatchSnapshot(); // success

  let component2 = renderer.create(<LoadableMyComponent prop="baz" />);
  expect(component2.toJSON()).toMatchSnapshot(); // success
});

test("resolveModule", async () => {
  let LoadableMyComponent = Loadable({
    loader: createLoader(200, { MyComponent }),
    LoadingComponent: MyLoadingComponent,
    resolveModule: module => module.MyComponent
  });
  let component = renderer.create(<LoadableMyComponent prop="baz" />);
  expect(component.toJSON()).toMatchSnapshot(); // initial
  await waitFor(200);
  expect(component.toJSON()).toMatchSnapshot(); // loading
  await waitFor(200);
  expect(component.toJSON()).toMatchSnapshot(); // errored
});

test("babel: server side rendering flushing", async () => {
  let createLoadable = name => {
    return Loadable({
      loader: createLoader(400, null, new Error("test error")),
      LoadingComponent: MyLoadingComponent,
      serverSideRequirePath: path.join(__dirname, "..", "__fixtures__", name)
    });
  };

  let Loadable1 = createLoadable("component.js");
  let Loadable2 = createLoadable("component2.js");
  let Loadable3 = createLoadable("component3.js");

  let App = props => (
    <div>
      {props.one ? <Loadable1 /> : null}
      {props.two ? <Loadable2 /> : null}
      {props.three ? <Loadable3 /> : null}
    </div>
  );

  flushServerSideRequirePaths(); // clear first

  renderer.create(<App one={true} two={true} three={false} />);
  let paths = flushServerSideRequirePaths().map(normalizePath);
  expect(paths).toMatchSnapshot(); // serverside

  renderer.create(<App one={true} two={false} three={true} />);
  paths = flushRequires().map(normalizePath);
  expect(paths).toMatchSnapshot(); // serverside
});

test("webpack: server side rendering flushing", async () => {
  const createPath = name => path.join(__dirname, "..", "__fixtures__", name);

  global.__webpack_require__ = path => __webpack_modules__[path];

  global.__webpack_modules__ = {
    [createPath("component.js")]: require(createPath("component.js")),
    [createPath("component2.js")]: require(createPath("component2.js")),
    [createPath("component3.js")]: require(createPath("component3.js"))
  };

  let createLoadable = name => {
    return Loadable({
      loader: createLoader(400, null, new Error("test error")),
      LoadingComponent: MyLoadingComponent,
      webpackRequireWeakId: () => createPath(name)
    });
  };

  let Loadable1 = createLoadable("component.js");
  let Loadable2 = createLoadable("component2.js");
  let Loadable3 = createLoadable("component3.js");

  let App = props => (
    <div>
      {props.one ? <Loadable1 /> : null}
      {props.two ? <Loadable2 /> : null}
      {props.three ? <Loadable3 /> : null}
    </div>
  );

  flushWebpackRequireWeakIds(); // clear first

  renderer.create(<App one={true} two={true} three={false} />);
  let paths = flushWebpackRequireWeakIds().map(normalizePath);
  expect(paths).toMatchSnapshot(); // serverside

  renderer.create(<App one={true} two={false} three={true} />);
  paths = flushRequires().map(normalizePath);
  expect(paths).toMatchSnapshot(); // serverside

  delete global.__webpack_require__;
  delete global.__webpack_modules__;
});
