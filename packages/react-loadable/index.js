// @flow
import Loadable, {
  LoadableMap,
  LoadableCapture,
  preloadAll,
  preloadReady,
} from './lib/cjs/index';

Loadable.Map = LoadableMap;
Loadable.Capture = LoadableCapture;
Loadable.preloadAll = preloadAll;
Loadable.preloadReady = preloadReady;

export default Loadable;
