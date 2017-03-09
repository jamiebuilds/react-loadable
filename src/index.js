import React from "react";

export default function Loadable(
  loader: () => Promise<React.Component>,
  LoadingComponent: React.Component,
  ErrorComponent?: React.Component | null,
  delay?: number = 200
) {
  let prevLoadedComponent = null;

  return class Loadable extends React.Component {
    state = {
      isLoading: false,
      error: null,
      Component: prevLoadedComponent
    };

    componentWillMount() {
      if (!this.state.Component) {
        this.loadComponent();
      }
    }

    loadComponent() {
      this._timeoutId = setTimeout(
        () => {
          this._timeoutId = null;
          this.setState({ isLoading: true });
        },
        this.props.delay
      );

      loader()
        .then(Component => {
          this.clearTimeout();
          prevLoadedComponent = Component;
          this.setState({
            isLoading: false,
            Component
          });
        })
        .catch(error => {
          this.clearTimeout();
          this.setState({
            isLoading: false,
            error
          });
        });
    }

    clearTimeout() {
      if (this._timeoutId) {
        clearTimeout(this._timeoutId);
      }
    }

    render() {
      let { error, isLoading, Component } = this.state;

      if (error && ErrorComponent) {
        return <ErrorComponent error={error} />;
      } else if (isLoading) {
        return <LoadingComponent />;
      } else if (Component) {
        return <Component {...this.props} />;
      } else {
        return null;
      }
    }
  };
}
