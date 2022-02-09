import { readFileSync } from "fs";
export const parser = "babel";

const excludedKeys = [
  "column",
  "_scope",
  "end",
  "extra",
  "line",
  "loc",
  "local",
  "name",
  "optional",
  "original",
  "range",
  "raw",
  "regex",
  "start",
  "type",
];

const shadowingNodeTypes = {
  VariableDeclaration: ["id"],
};

const getShadowerProperties = (node) => shadowingNodeTypes[node.type] || [];

const willShadow = (shadowerProperties) => (node) => (identifier) => {
  const willShadowRecur = (node, identifier, parentCanShadow) => {
    if (!node || typeof node !== "object") return false;
    if (node.type === "Identifier")
      return parentCanShadow && node.name === identifier;

    return !!Object.keys(node)
      .filter((key) => !excludedKeys.includes(key))
      .find((key) => {
        const res = willShadowRecur(
          node[key],
          identifier,
          parentCanShadow || shadowerProperties.includes(key)
        );
        return res;
      });
  };
  return willShadowRecur(node, identifier, false);
};

const filterShadowedIdentifiers = (node, identifiers) => {
  const shadowerProperties = getShadowerProperties(node);
  if (shadowerProperties.length > 0) {
    return identifiers.filter(willShadow(shadowerProperties)(node));
  } else return [];
};

const addScopeRecur = (currentNode, identifiers, parentScope = null) => {
  if (!currentNode || typeof currentNode !== "object" || !currentNode.loc)
    return;

  const shadowedIdentifiers = filterShadowedIdentifiers(
    currentNode,
    identifiers
  );

  const name = (() => {
    if (currentNode.loc)
      return `${currentNode.loc.start.line}-${currentNode.loc.start.column}`;
    else return `undefined`;
  })();

  currentNode._scope = {
    name: `${currentNode.type}-${name}`,
    parentScope,
    shadowedIdentifiers,
  };
  const currentScope = currentNode._scope;

  const keys = Object.keys(currentNode);
  keys.forEach((aKey) => {
    if (!excludedKeys.includes(aKey)) {
      const child = currentNode[aKey];
      let currentGrandchild = null;
      if (Array.isArray(child)) {
        child.forEach((grandchild) => {
          addScopeRecur(
            grandchild,
            identifiers,
            currentGrandchild ? currentGrandchild._scope : currentScope
          );
          currentGrandchild = grandchild;
        });
      } else if (child && typeof child === "object") {
        addScopeRecur(child, identifiers, currentScope);
      }
    }
  });
};

const replaceImportDeclarations = (j, root, replaceImportsMappings) => {
  const replacedIdentifiers = {};
  root.find(j.ImportDeclaration).replaceWith((path) => {
    replaceImportsMappings.forEach(({ source, identifiers }) => {
      if (path.node.source.value && source[path.node.source.value]) {
        path.node.source = j.stringLiteral(source[path.node.source.value]);
        j(path)
          .find(j.ImportSpecifier)
          .filter(
            ({
              node: {
                imported: { name },
              },
            }) => {
              const list = Object.keys(identifiers);
              return list.includes(name);
            }
          )
          .forEach((specifier) => {
            replacedIdentifiers[specifier.node.imported.name] =
              identifiers[specifier.node.imported.name];
            specifier.node.imported = j.identifier(
              identifiers[specifier.node.imported.name]
            );
          });
      }
    });
    return path.node;
  });
  return replacedIdentifiers;
};

const replaceRequireDeclarations = (j, root) => {};

const isShadowedRecur = (scope, identifier) => {
  if (scope === null) return false;
  if (scope.shadowedIdentifiers.includes(identifier.node.name)) return true;
  return isShadowedRecur(scope.parentScope, identifier);
};

const findClosestScope = (path) => {
  return path.node._scope || findClosestScope(path.parent);
};

const isException = (j, path) => {
  const parent = path.parent.node;
  switch (parent.type) {
    case "ExportSpecifier": {
      return parent.exported === parent.local || parent.exported === path.node;
    }
    default:
      false;
  }
};

const replaceIdentifiers = (j, root, identifierNames, identifierMappings) => {
  root
    .find(j.Identifier)
    .filter((identifier) => identifierNames.includes(identifier.node.name))
    .forEach((identifier) => {
      const closestScope = findClosestScope(identifier);
      if (
        !isShadowedRecur(closestScope, identifier) &&
        !isException(j, identifier)
      ) {
        j(identifier).replaceWith(
          j.identifier(identifierMappings[identifier.node.name])
        );
      }
    });
};

// Press ctrl+space for code completion
export default function transformer(fileInfo, api, options) {
  if (!options.specs) {
    throw Error("missing parameter 'specs'");
  }
  const specsFile = readFileSync(options.specs, "utf8");

  const { replaceImportsMappings, deprecateImportsMappings } =
    JSON.parse(specsFile);

  const j = api.jscodeshift;

  const root = j(fileInfo.source);

  const replacedIdentifiers = replaceImportDeclarations(
    j,
    root,
    replaceImportsMappings
  );

  root.find(j.Program).forEach((elt) => {
    addScopeRecur(elt.value, Object.keys(replacedIdentifiers));
  });

  replaceIdentifiers(
    j,
    root,
    Object.keys(replacedIdentifiers),
    replacedIdentifiers
  );

  return root.toSource();
}
