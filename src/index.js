// @flow
import React from "react";

type GenericComponent<Props> = Class<React.Component<{}, Props, mixed>>;
type LoadedComponent<Props> = GenericComponent<Props>;
type LoadingComponent = GenericComponent<{}>;

let isWebpack = typeof __webpack_require__ !== "undefined";
let requireFn = isWebpack ? __webpack_require__ : module.require.bind(module);

let babelInterop = obj => {
  // $FlowIgnore
  return obj && obj.__esModule ? obj.default : obj;
};

type Options = {
  loader: () => Promise<LoadedComponent<Props>>,
  LoadingComponent: LoadingComponent,
  delay?: number,
  serverSideRequirePath?: string,
  webpackRequireWeakId?: () => number,
  resolveModule?: (obj: Object) => LoadedComponent<Props>
};

export default function Loadable<Props: {}, Err: Error>(opts: Options) {
  let loader = opts.loader;
  let LoadingComponent = opts.LoadingComponent;
  let delay = opts.delay || 200;
  let serverSideRequirePath = opts.serverSideRequirePath;
  let webpackRequireWeakId = opts.webpackRequireWeakId;
  let resolveModuleFn = opts.resolveModule ? opts.resolveModule : babelInterop;

  let isLoading = false;

  let outsideComponent = null;
  let outsidePromise = null;
  let outsideError = null;

  let tryRequire = (pathOrId: string | number) => {
    try {
      // $FlowIgnore
      return resolveModuleFn(requireFn(pathOrId));
    } catch (err) {}
    return null;
  };

  if (!isWebpack && serverSideRequirePath) {
    outsideComponent = tryRequire(serverSideRequirePath);
  }

  let load = () => {
    if (!outsidePromise) {
      isLoading = true;
      outsidePromise = loader()
        .then(Component => {
          isLoading = false;
          outsideComponent = resolveModuleFn(Component);
        })
        .catch(error => {
          isLoading = false;
          outsideError = error;
        });
    }
    return outsidePromise;
  };

  return class Loadable extends React.Component<void, Props, *> {
    _timeout: number;
    _mounted: boolean;

    static preload() {
      load();
    }

    constructor(props) {
      super(props);

      if (isWebpack && webpackRequireWeakId) {
        let weakId = webpackRequireWeakId();
        if (__webpack_modules__[weakId]) {
          // if it's not in webpack modules, we wont be able
          // to load it. If we attempt to, we mess up webpack's
          // internal state, so only tryRequire if it's already
          // in webpack modules.
          outsideComponent = tryRequire(weakId);
        }
      }

      this.state = {
        error: outsideError,
        pastDelay: false,
        Component: outsideComponent
      };
    }

    componentWillMount() {
      this._mounted = true;

      if (this.state.Component) {
        return;
      }

      this._timeout = setTimeout(
        () => {
          this.setState({ pastDelay: true });
        },
        delay
      );

      load().then(() => {
        if (!this._mounted) return;
        clearTimeout(this._timeout);
        this.setState({
          error: outsideError,
          pastDelay: false,
          Component: outsideComponent
        });
      });
    }

    componentWillUnmount() {
      this._mounted = false;
      clearTimeout(this._timeout);
    }

    render() {
      let { pastDelay, error, Component } = this.state;

      if (isLoading || error) {
        return (
          <LoadingComponent
            isLoading={isLoading}
            pastDelay={pastDelay}
            error={error}
          />
        );
      } else if (Component) {
        return <Component {...this.props} />;
      } else {
        return null;
      }
    }
  };
}
