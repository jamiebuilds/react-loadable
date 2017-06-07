// @flow
import React from "react";

type GenericComponent<Props> = Class<React.Component<{}, Props, mixed>>;
type LoadedComponent<Props> = GenericComponent<Props>;
type LoadingComponent = GenericComponent<{}>;

let SERVER_SIDE_REQUIRE_PATHS = new Set();
let WEBPACK_REQUIRE_WEAK_IDS = new Set();

let isServer = typeof window === "undefined" || process.env.NODE_ENV === "test";

// making the following functions allows us to set webpack globals during tests
let isWebpack = () => typeof __webpack_require__ !== "undefined";
let requireFn = (pathOrId: string | number) => {
  if (!isWebpack() && typeof pathOrId === "string") {
    return module.require(pathOrId);
  }

  return __webpack_require__(pathOrId);
};

let babelInterop = obj => {
  // $FlowIgnore
  return obj && obj.__esModule ? obj.default : obj;
};

let tryRequire = (resolveModuleFn: Function, pathOrId: string | number) => {
  try {
    return resolveModuleFn(requireFn(pathOrId));
  } catch (err) {}
  return null;
};

type Options<Props> = {
  loader: () => Promise<LoadedComponent<Props>>,
  LoadingComponent: LoadingComponent,
  delay?: number,
  serverSideRequirePath?: string,
  webpackRequireWeakId?: () => number | string,
  resolveModule?: (obj: Object) => LoadedComponent<Props>
};

export default function Loadable<Props: {}, Err: Error>(opts: Options<Props>) {
  let loader = opts.loader;
  let LoadingComponent = opts.LoadingComponent;
  let delay = opts.delay || 200;
  let serverSideRequirePath = opts.serverSideRequirePath;
  let webpackRequireWeakId = opts.webpackRequireWeakId;
  let resolveModuleFn = opts.resolveModule ? opts.resolveModule : babelInterop;

  let isLoading = false;

  let outsideWeakId = null;
  let OutsideComponent = null;
  let outsidePromise = null;
  let outsideError = null;

  // requires have the possibility to work in HoC closure once again
  // in order to make HMR work. The reason is because  neither `constructor`
  // nor `componentWillMount` will be called again in the HMR lifecyle.
  // We still provide a second a chance to perform the require in the
  // constructor though, in case the user--instead of using react-flush-chunks--
  // has decided on the manual strategy of calling `window.render()` after all
  // scripts have loaded, as per:
  // https://github.com/thejameskyle/react-loadable/pull/26
  let synchronousLoad = () => {
    if (!isWebpack() && serverSideRequirePath) {
      OutsideComponent = tryRequire(resolveModuleFn, serverSideRequirePath);
    }

    if (!OutsideComponent && isWebpack() && webpackRequireWeakId) {
      outsideWeakId = webpackRequireWeakId();

      if (__webpack_modules__[outsideWeakId]) {
        // if it's not in webpack modules, we wont be able
        // to load it. If we attempt to, we mess up webpack's
        // internal state, so only tryRequire if it's already
        // in webpack modules.
        OutsideComponent = tryRequire(resolveModuleFn, outsideWeakId);
      }
    }
  };

  synchronousLoad();

  let load = () => {
    if (!outsidePromise) {
      isLoading = true;
      outsidePromise = loader()
        .then(Component => {
          isLoading = false;
          OutsideComponent = resolveModuleFn(Component);
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

    addModuleIds() {
      if (isServer) {
        if (isWebpack() && outsideWeakId) {
          WEBPACK_REQUIRE_WEAK_IDS.add(outsideWeakId);
        }

        if (!isWebpack() && serverSideRequirePath) {
          SERVER_SIDE_REQUIRE_PATHS.add(serverSideRequirePath);
        }
      }
    }

    constructor(props: Props) {
      super(props);
      // one more attempt to syncronously load module, as per:
      // https://github.com/thejameskyle/react-loadable/pull/26
      if (!OutsideComponent) {
        synchronousLoad();
      }

      this.state = {
        error: outsideError,
        pastDelay: false,
        // `hasComponent` is used instead in order to make HMR work. The reason is
        // because on file change, if the `Component` was locked in instance state
        // at `state.Component` then the old `Component` will still be rendered.
        // In short, `OutsideComponent` is correctly updated in the outer scope,
        // so during the natural re-render that occurs as part of HMR it will
        // be used :)
        hasComponent: !!OutsideComponent
      };
    }

    componentWillMount() {
      this.addModuleIds();

      this._mounted = true;

      if (this.state.hasComponent) {
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
          hasComponent: !!OutsideComponent
        });
      });
    }

    componentWillUnmount() {
      this._mounted = false;
      clearTimeout(this._timeout);
    }

    render() {
      let { pastDelay, error, hasComponent } = this.state;

      if (isLoading || error) {
        return (
          <LoadingComponent
            isLoading={isLoading}
            pastDelay={pastDelay}
            error={error}
          />
        );
      } else if (hasComponent && OutsideComponent) {
        return <OutsideComponent {...this.props} />;
      } else {
        return null;
      }
    }
  };
}

export function flushServerSideRequirePaths() {
  let arr = Array.from(SERVER_SIDE_REQUIRE_PATHS);
  SERVER_SIDE_REQUIRE_PATHS.clear();
  return arr;
}

export function flushWebpackRequireWeakIds() {
  let arr = Array.from(WEBPACK_REQUIRE_WEAK_IDS);
  WEBPACK_REQUIRE_WEAK_IDS.clear();
  return arr;
}

export function flushRequires() {
  return isWebpack()
    ? flushWebpackRequireWeakIds()
    : flushServerSideRequirePaths();
}
