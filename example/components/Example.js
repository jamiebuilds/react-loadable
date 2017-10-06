import React from 'react';
import Loadable from '../../src/index';
import Loading from './Loading';
import delay from '../utils/delay';

const LoadableNested = Loadable({
  loader: () => delay(1000).then(() => import('./ExampleNested')),
  loading: Loading,
});

export default function Example() {
  return (
    <div>
      <h1>Hello from a loadable component</h1>
      <LoadableNested/>
    </div>
  );
}
