// @noflow
import {
  flush,
  flushBabel,
  flushWebpack,
  createFilesByPath,
  createFilesByModuleId,
  isUnique,
  normalizePath,
  concatFilesAtKeys
} from "../src/flushFiles";

import {
  stats,
  rootDir,
  babelFilePaths,
  webpackModuleIds
} from "../__fixtures__/stats";

/** FLUSH */

describe("flush() called as pure function", () => {
  it("babel: uses default entries when no named chunks provided via opts.before/after", () => {
    const files = flush(babelFilePaths, stats, false, rootDir); /*? */
    expect(files).toMatchSnapshot();
  });

  it("webpack: uses default entries when no named chunks provided via opts.before/after", () => {
    const files = flush(webpackModuleIds, stats, true, undefined); /*? */
    expect(files).toMatchSnapshot();
  });
});

/** BABEL VS. WEBPACK FLUSHING */

test("flushBabel()", () => {
  const files = flushBabel(babelFilePaths, stats, rootDir); /*? */
  const allFiles = stats.chunks[0].files.concat(stats.chunks[1].files);
  expect(files).toEqual(allFiles);
});

test("flushWebpack()", () => {
  const files = flushWebpack(webpackModuleIds, stats); /*? */
  const allFiles = stats.chunks[0].files.concat(stats.chunks[1].files);
  expect(files).toEqual(allFiles);
});

test("flushBabel() throws with no rootDir argument", () => {
  const flush = () => flushBabel(babelFilePaths, stats); /*? */
  expect(flush).toThrow();
});

/** CREATE FILES MAP */

test("createFilesByPath()", () => {
  const filesByPath = createFilesByPath(stats); /*? */

  expect(Object.keys(filesByPath)).toEqual(babelFilePaths);

  expect(filesByPath["./src/Components/Example.js"]).toEqual([
    "0.js",
    "0.no_css.js",
    "0.css"
  ]);
  expect(filesByPath["./src/Components/Bar.js"]).toEqual([]); // test against arrays of undefined

  expect(filesByPath).toMatchSnapshot();
});

test("createFilesByModuleId()", () => {
  const filesByPath = createFilesByModuleId(stats); /*? */

  expect(Object.keys(filesByPath)).toEqual(webpackModuleIds);

  expect(filesByPath.qwer).toEqual(["0.js", "0.no_css.js", "0.css"]);
  expect(filesByPath.zxcv).toEqual([]); // test against arrays of undefined

  expect(filesByPath).toMatchSnapshot();
});

/** HELPERS */

test("isUnique()", () => {
  let filtered = [1, 2, 2].filter(isUnique);
  expect(filtered).toEqual([1, 2]);

  filtered = [1, 2, 3].filter(isUnique);
  expect(filtered).toEqual([1, 2, 3]);
});

test("normalizePath()", () => {
  const path = "/Users/jamesgillmore/App/src/Components/Example.js";
  const normalizedPath = normalizePath(path, rootDir);

  expect(normalizedPath).toEqual("./src/Components/Example.js");
});

test("concatFilesAtKeys()", () => {
  const filesMap = {
    "./src/Components/Example.js": ["0.js", "0.css"],
    "./src/Components/Foo.js": ["1.js", "1.css"],
    "./src/Components/Bar.js": ["2.js", "2.css"]
  };
  const paths = ["./src/Components/Example.js", "./src/Components/Bar.js"];
  const files = concatFilesAtKeys(filesMap, paths);

  expect(files).toEqual(["0.js", "0.css", "2.js", "2.css"]);
});
