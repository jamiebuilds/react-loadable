// @flow
import type { ComponentType, ElementType } from 'react';

export type Loader = () => Promise<mixed>;
export type LoaderMap = { [key: string]: Loader };

export type LoadingProps = {
  isLoading: boolean,
  timedOut: boolean,
  pastDelay: boolean,
  error: Error | null,
};

export type LoadingOption = ComponentType<LoadingProps>;
export type DelayOption = number | null;
export type TimeoutOption = number | null;
export type RenderOption = (loaded: any, props: Object) => ElementType;
export type WebpackOption = () => Array<number>;
export type ModulesOption = Array<string>;

export type LoadableOptions = {
  loader: Loader,
  loading: LoadingOption,
  delay: DelayOption,
  timeout: TimeoutOption,
  render?: RenderOption,
  webpack?: WebpackOption,
  modules?: ModulesOption,
};

export type LoadableMapOptions = {
  loader: LoaderMap,
  loading: LoadingOption,
  delay: DelayOption,
  timeout: TimeoutOption,
  render: RenderOption,
  webpack?: WebpackOption,
  modules?: ModulesOption,
};

export type GenericLoadableOptions<Loader> = {
  loader: Loader,
  loading: LoadingOption,
  delay: DelayOption,
  timeout: TimeoutOption,
  render?: RenderOption,
  webpack?: WebpackOption,
  modules?: ModulesOption,
};

export type LoadState = {
  loading: boolean,
  value: mixed | null,
  error: Error | null,
  promise: Promise<mixed>,
};

export type LoadCaller<Loader> = (loader: Loader) => LoadState;
