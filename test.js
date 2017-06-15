'use strict';

const path = require('path');
const React = require('react');
const renderer = require('react-test-renderer');
const Loadable = require('./src');
const {report} = require('import-inspector');

function waitFor(delay) {
  return new Promise(resolve => {
    setTimeout(resolve, delay);
  });
}

function createLoader(delay, Component, error, metadata) {
  return () => {
    return report(waitFor(delay).then(() => {
      if (Component) {
        return Component;
      } else {
        throw error;
      }
    }), metadata);
  };
}

function MyLoadingComponent(props) {
  return <div>MyLoadingComponent {JSON.stringify(props)}</div>;
}

function MyComponent(props) {
  return <div>MyComponent {JSON.stringify(props)}</div>;
}

test('loading success', async () => {
  let LoadableMyComponent = Loadable({
    loader: createLoader(400, MyComponent),
    loading: MyLoadingComponent
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

test('delay and timeout', async () => {
  let LoadableMyComponent = Loadable({
    loader: createLoader(300, MyComponent),
    loading: MyLoadingComponent,
    delay: 100,
    timeout: 200,
  });

  let component1 = renderer.create(<LoadableMyComponent prop="foo" />);

  expect(component1.toJSON()).toMatchSnapshot(); // initial
  await waitFor(100);
  expect(component1.toJSON()).toMatchSnapshot(); // loading
  await waitFor(100);
  expect(component1.toJSON()).toMatchSnapshot(); // timed out
  await waitFor(100);
  expect(component1.toJSON()).toMatchSnapshot(); // loaded
});

test('loading error', async () => {
  let LoadableMyComponent = Loadable({
    loader: createLoader(400, null, new Error('test error')),
    loading: MyLoadingComponent
  });

  let component = renderer.create(<LoadableMyComponent prop="baz" />);

  expect(component.toJSON()).toMatchSnapshot(); // initial
  await waitFor(200);
  expect(component.toJSON()).toMatchSnapshot(); // loading
  await waitFor(200);
  expect(component.toJSON()).toMatchSnapshot(); // errored
});

test('server side rendering', async () => {
  let LoadableMyComponent = Loadable({
    loader: createLoader(400, null, new Error('test error'), {
      serverSideRequirePath: path.join(__dirname, './__fixtures__/component.js')
    }),
    loading: MyLoadingComponent,
  });

  let component = renderer.create(<LoadableMyComponent prop="baz" />);

  expect(component.toJSON()).toMatchSnapshot(); // serverside
});

test('server side rendering es6', async () => {
  let LoadableMyComponent = Loadable({
    loader: createLoader(400, null, new Error('test error'), {
      serverSideRequirePath: path.join(__dirname, './__fixtures__/component.es6.js')
    }),
    loading: MyLoadingComponent,
  });

  let component = renderer.create(<LoadableMyComponent prop="baz" />);

  expect(component.toJSON()).toMatchSnapshot(); // serverside
});

test('preload', async () => {
  let LoadableMyComponent = Loadable({
    loader: createLoader(400, MyComponent),
    loading: MyLoadingComponent
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

test('render', async () => {
  let LoadableMyComponent = Loadable({
    loader: createLoader(400, { MyComponent }),
    loading: MyLoadingComponent,
    render(loaded, props) {
      return <loaded.MyComponent {...props}/>;
    }
  });
  let component = renderer.create(<LoadableMyComponent prop="baz" />);
  expect(component.toJSON()).toMatchSnapshot(); // initial
  await waitFor(200);
  expect(component.toJSON()).toMatchSnapshot(); // loading
  await waitFor(200);
  expect(component.toJSON()).toMatchSnapshot(); // success
});
