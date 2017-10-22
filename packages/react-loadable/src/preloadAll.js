// @flow
import { flushInitializers, getAllInitializers } from './utils';

export default function preloadAll(): Promise<void> {
  return new Promise((resolve, reject) => {
    flushInitializers(getAllInitializers()).then(resolve, reject);
  });
}
