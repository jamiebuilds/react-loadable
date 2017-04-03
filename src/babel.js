// @flow
export default function(
  { types: t, template }: { types: Object, template: Function }
) {
  const WEBPACK_PROP = "webpackRequireWeakId";
  const SERVER_PROP = "serverSideRequirePath";

  const webpackTemplate = template(`() => require.resolveWeak(MODULE)`);
  const serverTemplate = template(`PATH.join(__dirname, MODULE)`);

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
            (!opts.webpack || properties[WEBPACK_PROP]) &&
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

          if (opts.webpack && !propertiesMap[WEBPACK_PROP]) {
            let webpack = webpackTemplate({
              MODULE: importedModule.node
            }).expression;

            propertiesMap.loader.insertAfter(
              t.objectProperty(t.identifier(WEBPACK_PROP), webpack)
            );
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
