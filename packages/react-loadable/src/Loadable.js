// @flow
import createLoadableComponent from './createLoadableComponent';
import type { ComponentType, ElementType } from 'react';
import type { LoadableOptions, Loader, LoadingProps, LoadState } from './types';
import { render } from './utils';

export default function Loadable(opts: LoadableOptions) {
  return createLoadableComponent(load, opts);
}

export function load(loader: Loader): LoadState {
  let state: any = {
    loading: true,
    value: null,
    error: null,
  };

  state.promise = loader().then(loaded => {
    state.loading = false;
    state.value = loaded;
    return loaded;
  }).catch(err => {
    state.loading = false;
    state.error = err;
    throw err;
  });

  return state;
}
