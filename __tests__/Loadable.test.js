// @noflow
declare var test: any;
import path from "path";
import React from "react";
import renderer from "react-test-renderer";
import Loadable from "../src";

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
  let LoadableMyComponent = Loadable(
    createLoader(400, MyComponent),
    MyLoadingComponent
  );

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
  let LoadableMyComponent = Loadable(
    createLoader(400, null, new Error("test error")),
    MyLoadingComponent
  );

  let component = renderer.create(<LoadableMyComponent prop="baz" />);

  expect(component.toJSON()).toMatchSnapshot(); // initial
  await waitFor(200);
  expect(component.toJSON()).toMatchSnapshot(); // loading
  await waitFor(200);
  expect(component.toJSON()).toMatchSnapshot(); // errored
});

test("server side rendering", async () => {
  let LoadableMyComponent = Loadable(
    createLoader(400, null, new Error("test error")),
    MyLoadingComponent,
    null,
    path.join(__dirname, "../__fixtures__/component.js")
  );

  let component = renderer.create(<LoadableMyComponent prop="baz" />);

  expect(component.toJSON()).toMatchSnapshot(); // serverside
});

test("server side rendering es6", async () => {
  let LoadableMyComponent = Loadable(
    createLoader(400, null, new Error("test error")),
    MyLoadingComponent,
    null,
    path.join(__dirname, "../__fixtures__/component.es6.js")
  );

  let component = renderer.create(<LoadableMyComponent prop="baz" />);

  expect(component.toJSON()).toMatchSnapshot(); // serverside
});

test("preload", async () => {
  let LoadableMyComponent = Loadable(
    createLoader(400, MyComponent),
    MyLoadingComponent,
    null
  );

  LoadableMyComponent.preload();
  await waitFor(200);

  let component1 = renderer.create(<LoadableMyComponent prop="baz" />);

  expect(component1.toJSON()).toMatchSnapshot(); // still loading...
  await waitFor(200);
  expect(component1.toJSON()).toMatchSnapshot(); // success

  let component2 = renderer.create(<LoadableMyComponent prop="baz" />);
  expect(component2.toJSON()).toMatchSnapshot(); // success
});
