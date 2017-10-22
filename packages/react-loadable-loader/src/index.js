// @flow
import * as fs from 'fs';
import * as path from 'path';

type Manifest = {
  [rawRequest: string]: Array<{
    id: number,
    name: string,
    file: string,
  }>,
};

function buildManifest(compiler, compilation): Manifest {
  let context = compiler.options.context;
  let manifest: Manifest = {};

  compilation.chunks.forEach(chunk => {
    chunk.files.forEach(file => {
      chunk.forEachModule(module => {
        let id = module.id;
        let name = typeof module.libIdent === 'function' ? module.libIdent({ context }) : null;

        if (!manifest[module.rawRequest]) {
          manifest[module.rawRequest] = [];
        }

        manifest[module.rawRequest].push({ id, name, file });
      });
    });
  });

  return manifest;
}

type PluginOptions = {
  filename: string,
};

export class ReactLoadablePlugin {
  filename: string;

  constructor(opts: PluginOptions) {
    this.filename = opts.filename;
  }

  apply(compiler: Object) {
    compiler.plugin('emit', (compilation, callback) => {
      const manifest = buildManifest(compiler, compilation);
      const json = JSON.stringify(manifest, null, 2);
      const outputDirectory = path.dirname(this.filename);
      try {
        fs.mkdirSync(outputDirectory);
      } catch (err) {
        if (err.code !== 'EEXIST') {
          throw err;
        }
      }
      fs.writeFileSync(this.filename, json);
      callback();
    });
  }
}

export function getBundles(manifest: Manifest, moduleRequests: Array<string>) {
  return moduleRequests.reduce((bundles, moduleRequest) => {
    return bundles.concat(manifest[moduleRequest]);
  }, []);
}
