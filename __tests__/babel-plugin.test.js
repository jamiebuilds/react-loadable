// @flow
declare var test: any;
declare var expect: any;
import { transform } from "babel-core";
import plugin from "../src/babel";

let trim = str => {
  return str.replace(/\r\n?/g, "\n").trim();
};

let fn = (code, opts = {}) => {
  let input = trim(code);
  let options = { plugins: [[plugin, opts], "syntax-dynamic-import"] };
  return transform(input, options).code;
};

test("accept-default-options", () => {
  expect(
    fn(
      `
    import Loadable from "react-loadable";
    let LoadableMyComponent = Loadable({
      loader: () => import("./MyComponent"),
      LoadingComponent: MyLoadingComponent,
    });
  `
    )
  ).toMatchSnapshot();
});

test("accept-server-false-webpack-false", () => {
  expect(
    fn(
      `
    import Loadable from "react-loadable";
    let LoadableMyComponent = Loadable({
      loader: () => import("./MyComponent"),
      LoadingComponent: MyLoadingComponent,
    });
  `,
      {
        server: false,
        webpack: false
      }
    )
  ).toMatchSnapshot();
});

test("accept-server-false-webpack-true", () => {
  expect(
    fn(
      `
    import Loadable from "react-loadable";
    let LoadableMyComponent = Loadable({
      loader: () => import("./MyComponent"),
      LoadingComponent: MyLoadingComponent,
    });
  `,
      {
        server: false,
        webpack: true
      }
    )
  ).toMatchSnapshot();
});

test("accept-server-true-webpack-false", () => {
  expect(
    fn(
      `
    import Loadable from "react-loadable";
    let LoadableMyComponent = Loadable({
      loader: () => import("./MyComponent"),
      LoadingComponent: MyLoadingComponent,
    });
  `,
      {
        server: true,
        webpack: false
      }
    )
  ).toMatchSnapshot();
});

test("not-overwrite-existing-properties", () => {
  expect(
    fn(
      `
    import Loadable from "react-loadable";
    let LoadableMyComponent = Loadable({
      loader: () => import("./MyComponent"),
      LoadingComponent: MyLoadingComponent,
      serverSideRequirePath: null,
      webpackRequireWeakId: null
    });
  `,
      {
        server: true,
        webpack: true
      }
    )
  ).toMatchSnapshot();
});

test("track-imports-correctly", () => {
  expect(
    fn(
      `
    import L from 'react-loadable';
    import Loadable from 'not-react-loadable';
    let C1 = L({
      loader: () => import('./MyComponent')
    });
    let C2 = Loadable({
      loader: () => import('./MyComponent')
    });
  `,
      {
        server: true,
        webpack: true
      }
    )
  ).toMatchSnapshot();
});
