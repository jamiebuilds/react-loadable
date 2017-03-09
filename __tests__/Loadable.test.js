import React from "react";
import renderer from "react-test-renderer";
import Loadable from "../src";

let createComponent = (name: string) => {
  return (props: mixed) => {
    return <div>{name} {JSON.stringify(props)}</div>;
  };
};

let waitFor = (delay: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, delay);
  });
};

let createLoader = (
  delay: number,
  Component: React.Component | false,
  error?: error
) => {
  return async () => {
    await waitFor(delay);
    if (Component) {
      return Component;
    } else {
      throw error;
    }
  };
};

let LoadingComponent = createComponent("LoadingComponent");
let ErrorComponent = createComponent("ErrorComponent");
let MyComponent = createComponent("MyComponent");

test("loading success", async () => {
  let LoadableMyComponent = Loadable(
    createLoader(400, LoadingComponent),
    LoadingComponent
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
    LoadingComponent,
    ErrorComponent
  );

  let component1 = renderer.create(<LoadableMyComponent prop="baz" />);

  expect(component1.toJSON()).toMatchSnapshot(); // initial
  await waitFor(200);
  expect(component1.toJSON()).toMatchSnapshot(); // loading
  await waitFor(200);
  expect(component1.toJSON()).toMatchSnapshot(); // errored
});
