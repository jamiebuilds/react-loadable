import React from "react";
import curryRight from "lodash.curryright";
import curry from "lodash.curry";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import "rxjs/add/observable/bindCallback";
import "rxjs/add/observable/fromPromise";
import "rxjs/add/operator/take";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/timeout";
import "rxjs/add/operator/takeUntil";
import "rxjs/add/operator/catch";

export default function Loadable(
  loader: () => Promise<React.Component>,
  LoadingComponent: React.Component,
  ErrorComponent?: React.Component | null,
  delay?: number = 200,
  serverSideRequirePath?: string
) {
  let prevLoadedComponent = null;

  if (serverSideRequirePath) {
    try {
      let obj = require(serverSideRequirePath);
      if (obj && obj.__esModule) obj = obj.default;
      prevLoadedComponent = obj;
    } catch (err) {}
  }

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
      this._componentWillUnmount$ = new Subject().take(1);
      const setState$ = Observable.bindCallback((err, Component, callback) => {
        this.setState(
          {
            isLoading: false,
            [err ? "err" : "Component"]: err || Component
          },
          callback
        );
      });

      Observable.fromPromise(loader())
        .map(module => prevLoadedComponent = module.default || module)
        .mergeMap(curry(setState$)(null))
        .timeout(delay)
        .takeUntil(this._componentWillUnmount$)
        .catch(curryRight(setState$)(null))
        .subscribe(
          () => this._componentWillUnmount$.next(),
          () => this._componentWillUnmount$.next()
        );
    }

    componentWillUnmount() {
      if (this._componentWillUnmount$ && !this._componentWillUnmount$.closed) {
        this._componentWillUnmount$.next();
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
