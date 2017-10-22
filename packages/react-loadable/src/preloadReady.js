// @flow
import { flushInitializers, getReadyInitializers } from './utils';

export default function preloadReady(): Promise<void> {
  return new Promise((resolve, reject) => {
    // We always will resolve, errors should be handled within loading UIs.
    flushInitializers(getReadyInitializers()).then(resolve, resolve);
  });
}
