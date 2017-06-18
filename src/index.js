const React = require('react');
const isWebpackBundle = require('is-webpack-bundle');
const webpackRequireWeak = require('webpack-require-weak');
const {inspect} = require('import-inspector');

function capture(fn) {
  let reported = [];
  let stopInspecting = inspect(metadata => reported.push(metadata));
  let promise = fn();
  stopInspecting();
  return {promise, reported};
}

function load(loader) {
  let {promise, reported} = capture(() => {
    return loader();
  });

  if (reported.length > 1) {
    throw new Error('react-loadable cannot handle more than one import() in each loader');
  }

  let state = {
    loading: true,
    loaded: null,
    error: null
  };

  let metadata = reported[0] || {};

  try {
    if (isWebpackBundle) {
      if (typeof metadata.webpackRequireWeakId === 'function') {
        state.loading = false;
        state.loaded = webpackRequireWeak(metadata.webpackRequireWeakId());
      }
    } else {
      if (typeof metadata.serverSideRequirePath === 'string') {
        state.loading = false;
        state.loaded = module.require(metadata.serverSideRequirePath);
      }
    }
  } catch (err) {
    state.error = err;
  }

  state.promise = promise.then(loaded => {
    state.loading = false;
    state.loaded = loaded;
    return loaded;
  }).catch(err => {
    state.loading = false;
    state.error = err;
    throw err;
  });

  return state;
}

function loadMap(obj) {
  let state = {
    loading: false,
    loaded: {},
    error: null
  };

  let promises = [];

  try {
    Object.keys(obj).forEach(key => {
      let result = load(obj[key]);

      if (!result.loading) {
        state.loaded[key] = result.loaded;
        state.error = result.error;
      } else {
        state.loading = true;
      }

      promises.push(result.promise);

      result.promise.then(res => {
        state.loaded[key] = res;
      }).catch(err => {
        state.error = err;
      });
    });
  } catch (err) {
    error = err;
  }

  state.promise = Promise.all(promises).then(res => {
    state.loading = false;
    return res;
  }).catch(err => {
    state.loading = false;
    throw err;
  });

  return state;
}

function resolve(obj) {
  return obj && obj.__esModule ? obj.default : obj;
}

function render(loaded, props) {
  return React.createElement(resolve(loaded), props);
}

function createLoadableComponent(loadFn, options) {
  let opts = Object.assign({
    loader: null,
    loading: null,
    delay: 200,
    timeout: null,
    render: render
  }, options);

  let res = null;

  return class LoadableComponent extends React.Component {
    constructor(props) {
      super(props);

      if (!res) {
        res = loadFn(opts.loader);
      }

      this.state = {
        error: res.error,
        pastDelay: false,
        timedOut: false,
        loading: res.loading,
        loaded: res.loaded
      };
    }

    static preload() {
      if (!res) {
        res = loadFn(opts.loader);
      }
    }

    componentWillMount() {
      this._mounted = true;

      if (res.resolved) {
        return;
      }

      if (typeof opts.delay === 'number') {
        this._delay = setTimeout(() => {
          this.setState({ pastDelay: true });
        }, opts.delay);
      }

      if (typeof opts.timeout === 'number') {
        this._timeout = setTimeout(() => {
          this.setState({ timedOut: true });
        }, opts.timeout);
      }

      let update = () => {
        if (!this._mounted) {
          return;
        }

        this.setState({
          error: res.error,
          loaded: res.loaded,
          loading: res.loading
        });

        this._clearTimeouts();
      };

      res.promise.then(() => {
        update();
      }).catch(err => {
        update();
        throw err;
      });
    }

    componentWillUnmount() {
      this._mounted = false;
      this._clearTimeouts();
    }

    _clearTimeouts() {
      clearTimeout(this._delay);
      clearTimeout(this._timeout);
    }

    render() {
      if (this.state.loading || this.state.error) {
        return React.createElement(opts.loading, {
          isLoading: this.state.loading,
          pastDelay: this.state.pastDelay,
          timedOut: this.state.timedOut,
          error: this.state.error
        });
      } else if (this.state.loaded) {
        return opts.render(this.state.loaded, this.props);
      } else {
        return null;
      }
    }
  };
}

function Loadable(opts) {
  return createLoadableComponent(load, opts);
}

function LoadableMap(opts) {
  if (typeof opts.render !== 'function') {
    throw new Error('LoadableMap requires a `render(loaded, props)` function');
  }

  return createLoadableComponent(loadMap, opts);
}

Loadable.Map = LoadableMap;

module.exports = Loadable;
