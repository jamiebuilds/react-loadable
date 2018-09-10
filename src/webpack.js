'use strict';
const fs = require('fs');
const path = require('path');
const url = require('url');
const { computeIntegrity } = require('./utils');

const PLUGIN_NAME = 'ReactLoadablePlugin';

const defaultOptions = {
  filename: 'react-loadable.json',
  integrity: false,
  integrityAlgorithms: [ 'sha256', 'sha384', 'sha512' ],
  integrityPropertyName: 'integrity',
};

class ReactLoadablePlugin {
  constructor(options = defaultOptions) {
    this.options = Object.assign({}, defaultOptions, options);
    this.compiler = null;
    this.stats = null;
    this.entrypoints = new Set();
    this.assetsByName = new Map();
    this.manifest = {};
  }

  getAssets(assetsChunk) {
    assetsChunk.forEach(chunk => {
      const { id, files, siblings = [], hash } = chunk;
      const key = this.getChunkKey(chunk)
        || (chunk.names.length > 0 && chunk.names[0])
        || id;

      this.assetsByName.set(key, { id, files, hash, siblings });
    });

    return this.assetsByName;
  }

  getEntrypoints(entrypoints) {
    Object.keys(entrypoints).forEach(entry => this.entrypoints.add(entry));
    return this.entrypoints;
  }

  isRequestFromDevServer() {
    if (process.argv.some( arg => arg.includes('webpack-dev-server') ) ) { return true; }
    return this.compiler.outputFileSystem && this.compiler.outputFileSystem.constructor.name === 'MemoryFileSystem';
  }

  getFileExtension(filename) {
    if (!filename || typeof filename !== 'string') { return ''; }

    const fileExtRegex = /\.\w{2,4}\.(?:map|gz)$|\.\w+$/i;

    filename = filename.split(/[?#]/)[0];
    const ext = filename.match(fileExtRegex);

    return ext && ext.length ? ext[0] : '';
  };

  getChunkKey(chunk) {
    let key = null;

    for (let i = 0; i < chunk.modules.length; i++) {
      const { reasons } = chunk.modules[i];
      for (let j = 0; j < reasons.length; j++) {
        const { type, userRequest } = reasons[j];
        if (type === 'import()') {
          key = userRequest;
          break;
        }
      }
      if (key) break;
    }

    return key;
  }

  getManifestOutputPath() {
    if (path.isAbsolute(this.options.filename)) {
      return this.options.filename;
    }

    if (this.isRequestFromDevServer()) {
      let outputPath = (this.compiler.options.devServer.outputPath || this.compiler.outputPath || '/');

      if (outputPath === '/' ) {
        console.warn('Please use an absolute path in options.output when using webpack-dev-server.');
        outputPath = this.compiler.context || process.cwd();
      }

      return path.resolve(outputPath, this.options.filename);
    }

    return path.resolve(this.compiler.outputPath, this.options.filename);

  };

  apply(compiler) {
    this.compiler = compiler;
    if (compiler.hooks) {
      compiler.hooks.emit.tapAsync(PLUGIN_NAME, this.handleEmit.bind(this));
    } else {
      compiler.plugin('emit', this.handleEmit.bind(this));
    }
  }

  handleEmit(compilation, callback) {
    this.stats = compilation.getStats().toJson();
    this.options.publicPath = (compilation.outputOptions ? compilation.outputOptions.publicPath : compilation.options.output.publicPath) || '';
    this.getEntrypoints(this.stats.entrypoints);
    this.getAssets(this.stats.chunks);
    this.processAssets(compilation.assets);
    this.writeAssetsFile();

    callback();
  }

  processAssets(originAssets) {
    const assets = {};
    const origins = {};
    const { entrypoints } = this;

    for (const [ key, { files, id, siblings, hash } ] of this.assetsByName) {
      files.forEach(file => {
        const currentAsset = originAssets[file];
        const ext = this.getFileExtension(file).replace(/^\.+/, '').toLowerCase();

        if (!assets[id]) { assets[id] = {}; }
        if (!assets[id][ext]) { assets[id][ext] = []; }
        if (!origins[key]) { origins[key] = []; }

        if (currentAsset && this.options.integrity && !currentAsset[this.options.integrityPropertyName]) {
          currentAsset[this.options.integrityPropertyName] = computeIntegrity(this.options.integrityAlgorithms, currentAsset.source())
        }

        siblings.push(id);
        siblings.forEach(sibling => {
          if (!origins[key].includes(sibling)) {
            origins[key].push(sibling);
          }
        });

        assets[id][ext].push({
          file,
          hash,
          publicPath: url.resolve(this.options.publicPath || '', file),
          integrity: currentAsset[this.options.integrityPropertyName],
        });
      });
    }

    this.manifest = {
      entrypoints: Array.from(entrypoints),
      origins,
      assets,
    }
  }

  writeAssetsFile() {
    const filePath = this.getManifestOutputPath();
    const fileDir = path.dirname(filePath);
    const json = JSON.stringify(this.manifest, null, 2);
    try {
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir);
      }
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }

    fs.writeFileSync(filePath, json);
  }
}

function getBundles(manifest, chunks) {
  const assetsKey = chunks.reduce((key, chunk) => {
    if (manifest.origins[chunk]) {
      key = [...key, ...manifest.origins[chunk]];
    }
    return key;
  }, []);

  return assetsKey.reduce((bundle, asset) => {
    Object.keys(manifest.assets[asset]).forEach(key => {
      const content = manifest.assets[asset][key];
      if (!bundle[key]) { bundle[key] = []; }
      bundle[key] = [...bundle[key], ...content];
    });
    return bundle;
  }, {});
}

exports.ReactLoadablePlugin = ReactLoadablePlugin;
exports.getBundles = getBundles;
