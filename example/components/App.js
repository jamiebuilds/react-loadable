import React from 'react';
import Loadable from 'react-loadable';
import Loading from './Loading';
import delay from '../utils/delay';
import path from 'path';

const LoadableExample = Loadable({
  loader: () => import('./Example'),
  loading: Loading,
});

export default function App() {
  return <LoadableExample/>;
}
