// @flow

declare function __webpack_require__(pathOrId: string): any;

type FilesMap = {
  [key: string]: Array<string>
};
type Chunk = {
  id: number,
  files: Array<string>
};
type Module = {
  id: string,
  name: string,
  chunks: Array<number>
};
type Stats = {
  assetsByChunkName: FilesMap,
  chunks: Array<Chunk>,
  modules: Array<Module>,
  publicPath: string
};
type Options = {
  before?: Array<string>,
  after?: Array<string>,
  rootDir?: string,
  outputPath?: string
};

// `flushChunks` depends on React Loadable producing module IDs as strings
// via: NamedModulesPlugin or HashedModuleIdsPlugin:
type Files = Array<string>;

let filesByPath = null;
let filesByModuleId = null;

const IS_WEBPACK = typeof __webpack_require__ !== "undefined";
const IS_TEST = process.env.NODE_ENV === "test"; // used to disable caching for tests

/** PUBLIC API */

export default (pathsOrIds: Files, stats: Stats, opts?: Options = {}): Files =>
  flush(pathsOrIds, stats, IS_WEBPACK, opts.rootDir);

/** BABEL VS. WEBPACK FLUSHING */

const flush = (
  pathsOrIds: Files,
  stats: Stats,
  isWebpack: boolean,
  rootDir: ?string
) =>
  !isWebpack
    ? flushBabel(pathsOrIds, stats, rootDir).filter(isUnique)
    : flushWebpack(pathsOrIds, stats).filter(isUnique);

const flushBabel = (paths: Files, stats: Stats, rootDir: ?string): Files => {
  if (!rootDir) {
    throw new Error(
      `No \`rootDir\` was provided as an option to \`flushChunks\`.
      Please provide one so modules rendered server-side can be
      paired to their webpack equivalents client-side, and their
      corresponding chunks.`
    );
  }

  const dir = rootDir; // satisfy flow

  filesByPath = filesByPath && !IS_TEST
    ? filesByPath // cached
    : createFilesByPath(stats);

  return concatFilesAtKeys(filesByPath, paths.map(p => normalizePath(p, dir)));
};

const flushWebpack = (ids: Files, stats: Stats): Files => {
  filesByModuleId = filesByModuleId && !IS_TEST
    ? filesByModuleId // cached
    : createFilesByModuleId(stats);

  return concatFilesAtKeys(filesByModuleId, ids);
};

/** CREATE FILES MAP */

const createFilesByPath = ({ chunks, modules }: Stats): FilesMap => {
  const filesByChunk = chunks.reduce(
    (chunks, chunk) => {
      chunks[chunk.id] = chunk.files;
      return chunks;
    },
    {}
  );

  return modules.reduce(
    (filesByPath, module) => {
      const filePath = module.name;
      const files = concatFilesAtKeys(filesByChunk, module.chunks);

      filesByPath[filePath] = files.filter(isUnique);
      return filesByPath;
    },
    {}
  );
};

const createFilesByModuleId = (stats: Stats): FilesMap => {
  const filesByPath = createFilesByPath(stats);

  return stats.modules.reduce(
    (filesByModuleId, module) => {
      const filePath = module.name;
      const id = module.id;

      filesByModuleId[id] = filesByPath[filePath];
      return filesByModuleId;
    },
    {}
  );
};

/** HELPERS */

const isUnique = (v: string, i: number, self: Files): boolean =>
  self.indexOf(v) === i;

const normalizePath = (path: string, rootDir: string): string =>
  `${path.replace(rootDir, ".").replace(/\.js$/, "")}.js`;

const concatFilesAtKeys = (
  inputFilesMap: FilesMap,
  pathsOrIdsOrChunks: Array<any>
): Files =>
  pathsOrIdsOrChunks.reduce(
    (files, key) => files.concat(inputFilesMap[key] || []),
    []
  );

/** EXPORTS FOR TESTS */

export {
  flush,
  flushBabel,
  flushWebpack,
  createFilesByPath,
  createFilesByModuleId,
  isUnique,
  normalizePath,
  concatFilesAtKeys
};
