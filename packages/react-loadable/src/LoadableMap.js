// @flow
import createLoadableComponent from './createLoadableComponent';
import { load } from './Loadable';
import type { LoaderMap, LoadState, LoadableOptions } from './types';

type LoadableMapOptions = LoadableOptions & {
  loader: LoaderMap,
};

export default function LoadableMap(opts: LoadableMapOptions) {
  if (typeof opts.render !== 'function') {
    throw new Error('LoadableMap requires a `render(loaded, props)` function');
  }

  return createLoadableComponent(loadMap, opts);
}

function loadMap<T>(loaderMap: LoaderMap): LoadState {
  let state: any = {
    loading: false,
    value: {},
    error: null,
  };

  let promises = [];

  try {
    Object.keys(loaderMap).forEach(key => {
      let result = load(loaderMap[key]);

      if (!result.loading) {
        state.value[key] = result.loaded;
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
