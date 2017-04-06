// @noflow
declare var test: any;
import path from "path";
import React from "react";
import renderer from "react-test-renderer";
import Loadable, { flushServerSideRequirePaths } from "../src";

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

test("server side rendering flushing", async () => {
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
  expect(flushServerSideRequirePaths()).toMatchSnapshot(); // serverside
  renderer.create(<App one={true} two={false} three={true} />);
  expect(flushServerSideRequirePaths()).toMatchSnapshot(); // serverside
});
