import React from 'react';
import Loadable from 'react-loadable';
import Loading from "./Loading";

const LoadableContent = Loadable({
    loader: () => import(/* webpackChunkName: "PreLoadedContent" */ './PreLoadedContent'),
    loading: Loading,
});

// NOTE: This is for demo purposes only.
//       Pre-loading a single module is no different than using a standard loadable
export default class PreLoadButton extends React.Component {
  state = {
    isLoaded: false
  };

  preloadModules() {
    if (this.state.isLoaded) {
      return;
    }

    // Verify webpack only submits a single request
    Loadable.preload([
      LoadableContent.getLoader(),
      LoadableContent.getLoader(),
      LoadableContent.getLoader()
    ]).then(() => {
      console.log('pre-loading modules');
      this.setState({ isLoaded: true });
    });
  }

  render() {
    const { isLoaded } = this.state;
    console.log('is content pre-loaded? ' + isLoaded);
    return (
      <div>
        <button onClick={() => this.preloadModules()}>Preload Modules</button>
        {isLoaded && <LoadableContent />}
      </div>
    );
  }
}
