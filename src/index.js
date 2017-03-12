// @flow
import React from "react";

type GenericComponent<Props> = Class<React.Component<{}, Props, mixed>>;
type LoadedComponent<Props> = GenericComponent<Props>;
type LoadingComponent = GenericComponent<{}>;

let babelInterop = obj => {
  // $FlowIgnore
  return obj && obj.__esModule ? obj.default : obj;
};

export default function Loadable<Props: {}, Err: Error>(
  loader: () => Promise<LoadedComponent<Props>>,
  LoadingComponent: LoadingComponent,
  delay?: number = 200,
  serverSideRequirePath?: string
) {
  let isLoading = false;

  let outsideComponent = null;
  let outsidePromise = null;
  let outsideError = null;

  if (serverSideRequirePath) {
    try {
      // $FlowIgnore
      outsideComponent = babelInterop(require(serverSideRequirePath));
    } catch (err) {}
  }

  let load = () => {
    if (!outsidePromise) {
      isLoading = true;
      outsidePromise = loader()
        .then(Component => {
          isLoading = false;
          outsideComponent = babelInterop(Component);
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

    state = {
      error: outsideError,
      pastDelay: false,
      Component: outsideComponent
    };

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
