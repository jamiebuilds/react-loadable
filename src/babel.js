// @flow
export default function(
  { types: t, template }: { types: Object, template: Function }
) {
  const WEBPACK_REQUIRE_PROP = "webpackRequireWeakId";
  const WEBPACK_CHUNK_NAME_PROP = "webpackChunkName";
  const WEBPACK_CHUNK_NAME_PATTERN = /webpackChunkName:\s*"([^"]+)"/;
  const SERVER_PROP = "serverSideRequirePath";

  const webpackRequireTemplate = template(`() => require.resolveWeak(MODULE)`);
  const serverTemplate = template(`PATH.join(__dirname, MODULE)`);

  const getWebpackChunkName = comments => {
    if (comments) {
      for (const comment of comments) {
        const matches = WEBPACK_CHUNK_NAME_PATTERN.exec(comment.value);

        if (matches) {
          return matches[1];
        }
      }
    }
  };

  return {
    visitor: {
      ImportDeclaration(path: Object) {
        const opts = {
          server: true,
          webpack: false,
          ...this.opts
        };

        if (!opts.server && !opts.webpack) return;

        let source = path.node.source.value;
        if (source !== "react-loadable") return;

        let defaultSpecifier = path.get("specifiers").find(specifier => {
          return specifier.isImportDefaultSpecifier();
        });

        if (!defaultSpecifier) return;

        let bindingName = defaultSpecifier.node.local.name;
        let binding = path.scope.getBinding(bindingName);

        binding.referencePaths.forEach(refPath => {
          let callExpression = refPath.parentPath;
          if (!callExpression.isCallExpression()) return;

          let args = callExpression.get("arguments");
          if (args.length !== 1) throw callExpression.error;

          let options = args[0];
          if (!options.isObjectExpression()) return;

          let properties = options.get("properties");
          let propertiesMap = {};

          properties.forEach(property => {
            let key = property.get("key");
            propertiesMap[key.node.name] = property;
          });

          if (
            (!opts.webpack || properties[WEBPACK_REQUIRE_PROP]) &&
            (!opts.server || properties[SERVER_PROP])
          ) {
            return;
          }

          let loaderMethod = propertiesMap.loader.get("value");
          let dynamicImport;

          loaderMethod.traverse({
            Import(path) {
              dynamicImport = path.parentPath;
              path.stop();
            }
          });

          if (!dynamicImport) return;

          let importedModule = dynamicImport.get("arguments")[0];

          if (opts.webpack) {
            if (!propertiesMap[WEBPACK_REQUIRE_PROP]) {
              let webpackRequire = webpackRequireTemplate({
                MODULE: importedModule.node
              }).expression;

              propertiesMap.loader.insertAfter(
                t.objectProperty(
                  t.identifier(WEBPACK_REQUIRE_PROP),
                  webpackRequire
                )
              );
            }

            if (!propertiesMap[WEBPACK_CHUNK_NAME_PROP]) {
              let webpackChunkName = getWebpackChunkName(
                importedModule.node.leadingComments
              ) || getWebpackChunkName(importedModule.node.trailingComments);

              if (webpackChunkName) {
                propertiesMap.loader.insertAfter(
                  t.objectProperty(
                    t.identifier(WEBPACK_CHUNK_NAME_PROP),
                    t.stringLiteral(webpackChunkName)
                  )
                );
              }
            }
          }

          if (opts.server && !propertiesMap[SERVER_PROP]) {
            let server = serverTemplate({
              PATH: this.addImport("path", "default", "path"),
              MODULE: importedModule.node
            }).expression;

            propertiesMap.loader.insertAfter(
              t.objectProperty(t.identifier(SERVER_PROP), server)
            );
          }
        });
      }
    }
  };
}
