// @flow
import React, { type Element } from 'react';

declare var __webpack_modules__: void | { [key: number]: mixed };

export function resolve(obj: Object) {
  return obj && obj.__esModule ? obj.default : obj;
}

export function render(loaded: Object, props: Object) {
  return React.createElement(resolve(loaded), props);
}

opaque type Initializer = () => mixed;

const ALL_INITIALIZERS: Array<Initializer> = [];
const READY_INITIALIZERS: Array<Initializer> = [];

function isWebpackReady(getModuleIds: () => Array<number>) {
  if (typeof __webpack_modules__ !== 'object') {
    return false;
  }

  const safeWebpackModules = __webpack_modules__;

  return getModuleIds().every(moduleId => {
    return (
      typeof moduleId !== 'undefined' &&
      typeof safeWebpackModules[moduleId] !== 'undefined'
    );
  });
}

export function pushInitializer(initializer: () => Promise<mixed>, getModuleIds?: () => Array<number>) {
  ALL_INITIALIZERS.push(initializer);

  if (typeof getModuleIds === 'function') {
    const safeGetModuleIds = getModuleIds;
    READY_INITIALIZERS.push(() => {
      if (isWebpackReady(safeGetModuleIds)) {
        return initializer();
      }
    });
  }
}

export function getAllInitializers(): Array<Initializer> {
  return ALL_INITIALIZERS.slice();
}

export function getReadyInitializers(): Array<Initializer> {
  return READY_INITIALIZERS.slice();
}

export function flushInitializers(initializers: Array<Initializer>): Promise<void> {
  let promises = [];

  while (initializers.length) {
    let init = initializers.pop();
    promises.push(init());
  }

  return Promise.all(promises).then(() => {
    if (initializers.length) {
      return flushInitializers(initializers);
    }
  });
}
