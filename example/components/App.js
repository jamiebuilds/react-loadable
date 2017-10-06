import React from 'react';
import Loadable from '../../src/index';
import Loading from './Loading';
import delay from '../utils/delay';

const LoadableExample = Loadable({
  loader: () => delay(1000).then(() => import('./Example')),
  loading: Loading,
});

export default function App() {
  return <LoadableExample/>;
}
