'use strict';
const React = require('react');
const PropTypes = require('prop-types');

const ALL_INITIALIZERS = [];
const READY_INITIALIZERS = [];

function isWebpackReady(getModuleIds) {
  if (typeof __webpack_modules__ !== 'object') {
    return false;
  }

  return getModuleIds().every(moduleId => {
    return (
      typeof moduleId !== 'undefined' &&
      typeof __webpack_modules__[moduleId] !== 'undefined'
    );
  });
}

function load(loader) {
  let promise = loader();

  let state = {
    loading: true,
    loaded: null,
    error: null
  };

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
    state.error = err;
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

function backwardsCompatibleRender(loaded, props) {
  if (loaded) {
    return React.createElement(resolve(loaded), props);
  }

  return null;
}

function stateRender(state, props) {
    const { loaded } = state;
    if (loaded) {
      return React.createElement(resolve(loaded), props);
    }

    return null;
}

function createLoadableComponent(loadFn, options) {
  let opts = Object.assign({
    loader: null,
    loading: null,
    delay: 200,
    timeout: null,
    render: options.loading ? backwardsCompatibleRender : stateRender,
    webpack: null,
    modules: [],
  }, options);

  let res = null;

  function init() {
    if (!res) {
      res = loadFn(opts.loader);
    }
    return res.promise;
  }

  ALL_INITIALIZERS.push(init);

  if (typeof opts.webpack === 'function') {
    READY_INITIALIZERS.push(() => {
      if (isWebpackReady(opts.webpack)) {
        return init();
      }
    });
  }

  return class LoadableComponent extends React.Component {
    constructor(props) {
      super(props);
      init();

      this.state = {
        error: res.error,
        pastDelay: false,
        timedOut: false,
        loading: res.loading,
        loaded: res.loaded
      };
    }

    static contextTypes = {
      loadable: PropTypes.shape({
        report: PropTypes.func.isRequired,
      }),
    };

    static preload() {
      return init();
    }

    static getModules() {
      return opts.modules;
    }

    static getLoader() {
      return opts.loader;
    }

    componentWillMount() {
      this._mounted = true;

      if (this.context.loadable && Array.isArray(opts.modules)) {
        opts.modules.forEach(moduleName => {
          this.context.loadable.report(moduleName);
        });
      }

      if (!res.loading) {
        return;
      }

      if (typeof opts.delay === 'number') {
        if (opts.delay === 0) {
          this.setState({ pastDelay: true });
        } else {
          this._delay = setTimeout(() => {
            this.setState({ pastDelay: true });
          }, opts.delay);
        }
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
      const renderState = {
        isLoading: this.state.loading,
        pastDelay: this.state.pastDelay,
        timedOut: this.state.timedOut,
        error: this.state.error,
      };

      if (opts.loading) {
        // maintain full backwards compatibility - support 'loading' option
        if (renderState.isLoading || renderState.error) {
          return React.createElement(opts.loading, renderState);
        }

        return React.isValidElement(opts.render) ?
          React.cloneElement(opts.render, Object.assign({}, this.props, { codeSplit: this.state.loaded })) :
          opts.render(this.state.loaded, this.props);
      }

      renderState.loaded = this.state.loaded;
      return React.isValidElement(opts.render) ?
        React.cloneElement(opts.render, Object.assign({}, this.props, { codeSplit: renderState })) :
        opts.render(renderState, this.props);
    }
  };
}

function Loadable(opts) {
  return createLoadableComponent(load, opts);
}

function LoadableMap(opts) {
  if (!(React.isValidElement(opts.render) || typeof opts.render === 'function')) {
    throw new Error('LoadableMap requires a `render` react element or function');
  }

  return createLoadableComponent(loadMap, opts);
}

Loadable.Map = LoadableMap;

class Capture extends React.Component {
  static propTypes = {
    report: PropTypes.func.isRequired,
  };

  static childContextTypes = {
    loadable: PropTypes.shape({
      report: PropTypes.func.isRequired,
    }).isRequired,
  };

  getChildContext() {
    return {
      loadable: {
        report: this.props.report,
      },
    };
  }

  render() {
    return React.Children.only(this.props.children);
  }
}

Loadable.Capture = Capture;

function flushInitializers(initializers) {
  let promises = [];

  while (initializers.length) {
    let init = initializers.pop();
    promises.push(init());
  }

  return Promise.all(promises).then(() => {
    if (initializers.length) {
      return flushInitializers(initializers);
    }
  });
}

Loadable.preloadAll = () => {
  return new Promise((resolve, reject) => {
    flushInitializers(ALL_INITIALIZERS).then(resolve, reject);
  });
};

Loadable.preloadReady = () => {
  return new Promise((resolve, reject) => {
    // We always will resolve, errors should be handled within loading UIs.
    flushInitializers(READY_INITIALIZERS).then(resolve, resolve);
  });
};

Loadable.preload = (loaders) => {
  return new Promise((resolve, reject) => {
    const allLoaders = loaders.reduce((acc, loader) => {
      if (typeof loader === 'function') {
        acc.push(loader);
      }
      else if (typeof loader === 'object' && !Array.isArray(loader) && loader !== null) {
        Object.keys(loader).forEach(mapKey => acc.push(loader[mapKey]));
      }

      return acc;
    }, []);

    // reject on error - manually handler error scenarios for manual preload
    return Promise.all(allLoaders).then(resolve, reject);
  });
};

module.exports = Loadable;
