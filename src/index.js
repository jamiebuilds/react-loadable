'use strict';

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

  let state = {};
  let metadata = reported[0] || {};
  let loaded = null;
  let error = null;

  try {
    if (isWebpackBundle) {
      if (typeof metadata.webpackRequireWeakId === 'function') {
        loaded = webpackRequireWeak(metadata.webpackRequireWeakId());
      }
    } else {
      if (typeof metadata.serverSideRequirePath === 'string') {
        loaded = module.require(metadata.serverSideRequirePath);
      }
    }
  } catch (err) {
    error = err;
  }

  state.promise = promise;
  state.loaded = loaded;
  state.error = error;

  promise.then(loaded => {
    state.loaded = loaded;
  }).catch(err => {
    state.error = err;
  });

  return state;
}

function resolve(obj) {
  return obj && obj.__esModule ? obj.default : obj;
}

function render(loaded, props) {
  return React.createElement(resolve(loaded), props);
}

function Loadable(options) {
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
        res = load(opts.loader);
      }

      this.state = {
        error: res.error,
        pastDelay: false,
        timedOut: false,
        loaded: res.loaded
      };
    }

    static preload() {
      if (!res) {
        res = load(opts.loader);
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

      let cb = () => {
        if (!this._mounted) {
          return;
        }

        this.setState({
          error: res.error,
          loaded: res.loaded,
        });

        this._clearTimeouts();
      };

      res.promise.then(cb, cb);
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
      if (!this.state.loaded || this.state.error) {
        return React.createElement(opts.loading, {
          isLoading: this.state.isLoading,
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

module.exports = Loadable;
