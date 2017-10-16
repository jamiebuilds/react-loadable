'use strict';
const fs = require('fs');
const path = require('path');

function buildManifest(compiler, compilation) {
  let context = compiler.options.context;
  let manifest = {};

  compilation.chunks.forEach(chunk => {
    chunk.files.forEach(file => {
      chunk.forEachModule(module => {
        let id = module.id;
        let name = typeof module.libIdent === 'function' ? module.libIdent({ context }) : null;
        manifest[module.rawRequest] = { id, name, file };
      });
    });
  });

  return manifest;
}

class ReactLoadablePlugin {
  constructor(opts = {}) {
    this.filename = opts.filename;
  }

  apply(compiler) {
    compiler.plugin('emit', (compilation, callback) => {
      const manifest = buildManifest(compiler, compilation);
      var json = JSON.stringify(manifest, null, 2);
      const outputDirectory = path.dirname(this.filename);
      if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory);
      }
      fs.writeFileSync(this.filename, json);
      callback();
    });
  }
}

function getBundles(manifest, moduleIds) {
  return moduleIds.map(moduleId => {
    return manifest[moduleId];
  });
}

exports.ReactLoadablePlugin = ReactLoadablePlugin;
exports.getBundles = getBundles;
