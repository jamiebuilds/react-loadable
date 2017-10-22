// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { render, pushInitializer } from './utils';
import type { LoadState, LoadCaller, GenericLoadableOptions } from './types';

type LoadableComponentState = {
  initState: LoadState,
  pastDelay: boolean,
  timedOut: boolean,
};

export default function createLoadableComponent<Loader>(loadCaller: LoadCaller<Loader>, options: GenericLoadableOptions<Loader>) {
  if (!options.loader) {
    throw new Error('react-loadable requires a `loader`');
  }

  if (!options.loading) {
    throw new Error('react-loadable requires a `loading` component')
  }

  let opts = Object.assign({}, {
    delay: 200,
    timeout: null,
    render: render,
    webpack: null,
    modules: null,
  }, options);

  let cachedInitState = null;

  function init() {
    if (!cachedInitState) {
      cachedInitState = loadCaller(opts.loader);
    }
    return cachedInitState;
  }

  pushInitializer(init, opts.webpack);

  return class LoadableComponent extends React.Component<{}, LoadableComponentState> {
    _mounted: boolean;
    _delay: number;
    _timeout: number;

    state = {
      initState: init(),
      pastDelay: false,
      timedOut: false,
    };

    static contextTypes = {
      loadable: PropTypes.shape({
        report: PropTypes.func.isRequired,
      }),
    };

    static preload() {
      return init();
    }

    componentWillMount() {
      this._mounted = true;

      if (this.context.loadable && Array.isArray(opts.modules)) {
        opts.modules.forEach(moduleName => {
          this.context.loadable.report(moduleName);
        });
      }

      if (!this.state.initState.loading) {
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
          initState: this.state.initState,
        });

        this._clearTimeouts();
      };

      this.state.initState.promise.then(() => {
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
          isLoading: this.state.initState.loading,
          pastDelay: this.state.pastDelay,
          timedOut: this.state.timedOut,
          error: this.state.initState.error
        });
      } else if (this.state.value) {
        return opts.render(this.state.value, this.props);
      } else {
        return null;
      }
    }
  };
}
