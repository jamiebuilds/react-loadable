'use strict';

const path = require('path');
const React = require('react');
const renderer = require('react-test-renderer');
const Loadable = require('../src');

function waitFor(delay) {
  return new Promise(resolve => {
    setTimeout(resolve, delay);
  });
}

function createLoader(delay, loader, error) {
  return () => {
    return waitFor(delay).then(() => {
      if (loader) {
        return loader();
      } else {
        throw error;
      }
    });
  };
}

function MyLoadingComponent(props) {
  return <div>MyLoadingComponent {JSON.stringify(props)}</div>;
}

function MyComponent(props) {
  return <div>MyComponent {JSON.stringify(props)}</div>;
}

afterEach(async () => {
  try {
    await Loadable.preloadAll();
  } catch (err) {}
});

test('loading success', async () => {
  let LoadableMyComponent = Loadable({
    loader: createLoader(400, () => MyComponent),
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
    loader: createLoader(300, () => MyComponent),
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
    loader: createLoader(400, () => require('../__fixtures__/component')),
    loading: MyLoadingComponent,
  });

  await Loadable.preloadAll();

  let component = renderer.create(<LoadableMyComponent prop="baz" />);

  expect(component.toJSON()).toMatchSnapshot(); // serverside
});

test('server side rendering es6', async () => {
  let LoadableMyComponent = Loadable({
    loader: createLoader(400, () => require('../__fixtures__/component.es6')),
    loading: MyLoadingComponent,
  });

  await Loadable.preloadAll();

  let component = renderer.create(<LoadableMyComponent prop="baz" />);

  expect(component.toJSON()).toMatchSnapshot(); // serverside
});

test('preload', async () => {
  let LoadableMyComponent = Loadable({
    loader: createLoader(400, () => MyComponent),
    loading: MyLoadingComponent
  });

  let promise = LoadableMyComponent.preload();
  await waitFor(200);

  let component1 = renderer.create(<LoadableMyComponent prop="baz" />);

  expect(component1.toJSON()).toMatchSnapshot(); // still loading...
  await promise;
  expect(component1.toJSON()).toMatchSnapshot(); // success

  let component2 = renderer.create(<LoadableMyComponent prop="baz" />);
  expect(component2.toJSON()).toMatchSnapshot(); // success
});

test('render', async () => {
  let LoadableMyComponent = Loadable({
    loader: createLoader(400, () => ({ MyComponent })),
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

test('loadable map success', async () => {
  let LoadableMyComponent = Loadable.Map({
    loader: {
      a: createLoader(200, () => ({ MyComponent })),
      b: createLoader(400, () => ({ MyComponent })),
    },
    loading: MyLoadingComponent,
    render(loaded, props) {
      return (
        <div>
          <loaded.a.MyComponent {...props}/>
          <loaded.b.MyComponent {...props}/>
        </div>
      );
    }
  });

  let component = renderer.create(<LoadableMyComponent prop="baz" />);
  expect(component.toJSON()).toMatchSnapshot(); // initial
  await waitFor(200);
  expect(component.toJSON()).toMatchSnapshot(); // loading
  await waitFor(200);
  expect(component.toJSON()).toMatchSnapshot(); // success
});

test('loadable map error', async () => {
  let LoadableMyComponent = Loadable.Map({
    loader: {
      a: createLoader(200, () => ({ MyComponent })),
      b: createLoader(400, null, new Error('test error')),
    },
    loading: MyLoadingComponent,
    render(loaded, props) {
      return (
        <div>
          <loaded.a.MyComponent {...props}/>
          <loaded.b.MyComponent {...props}/>
        </div>
      );
    }
  });

  let component = renderer.create(<LoadableMyComponent prop="baz" />);
  expect(component.toJSON()).toMatchSnapshot(); // initial
  await waitFor(200);
  expect(component.toJSON()).toMatchSnapshot(); // loading
  await waitFor(200);
  expect(component.toJSON()).toMatchSnapshot(); // success
});

describe('preloadReady', () => {
  beforeEach(() => {
    global.__webpack_modules__ = { 1: true, 2: true };
  });

  afterEach(() => {
    delete global.__webpack_modules__;
  });

  test('undefined', async () => {
    let LoadableMyComponent = Loadable({
      loader: createLoader(200, () => MyComponent),
      loading: MyLoadingComponent,
    });

    await Loadable.preloadReady();

    let component = renderer.create(<LoadableMyComponent prop="baz" />);

    expect(component.toJSON()).toMatchSnapshot();
  });

  test('one', async () => {
    let LoadableMyComponent = Loadable({
      loader: createLoader(200, () => MyComponent),
      loading: MyLoadingComponent,
      webpack: () => [1],
    });

    await Loadable.preloadReady();

    let component = renderer.create(<LoadableMyComponent prop="baz" />);

    expect(component.toJSON()).toMatchSnapshot();
  });

  test('many', async () => {
    let LoadableMyComponent = Loadable({
      loader: createLoader(200, () => MyComponent),
      loading: MyLoadingComponent,
      webpack: () => [1, 2],
    });

    await Loadable.preloadReady();

    let component = renderer.create(<LoadableMyComponent prop="baz" />);

    expect(component.toJSON()).toMatchSnapshot();
  });

  test('missing', async () => {
    let LoadableMyComponent = Loadable({
      loader: createLoader(200, () => MyComponent),
      loading: MyLoadingComponent,
      webpack: () => [1, 42],
    });

    await Loadable.preloadReady();

    let component = renderer.create(<LoadableMyComponent prop="baz" />);

    expect(component.toJSON()).toMatchSnapshot();
  });

  test('delay with 0', () => {
    let LoadableMyComponent = Loadable({
      loader: createLoader(300, () => MyComponent),
      loading: MyLoadingComponent,
      delay: 0,
      timeout: 200,
    });
  
    let loadingComponent = renderer.create(<LoadableMyComponent prop="foo" />);
  
    expect(loadingComponent.toJSON()).toMatchSnapshot(); // loading
  });
});
