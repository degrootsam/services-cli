import { logger } from "../..";
import * as acorn from "acorn";

/**
 * Checks all named declarations and returns the name if it is exported as default.
 */
export function getDefaultNamedExportDeclarations(
  node: acorn.ExportNamedDeclaration,
): Set<string> {
  logger.debug("Checking named export declarations");
  let result = new Set<string>();
  for (const specifier of node.specifiers) {
    const identifier = specifier.local as acorn.Identifier;
    const exported = specifier.exported as acorn.Identifier;
    if (!identifier) continue;
    const { name: localName } = identifier;
    logger.debug(`Found named export '${localName}'`);
    if (exported) {
      const { name: exportedName } = exported;
      logger.debug(`'${localName}' is exported as '${exportedName}'`);
      if (exportedName === "default") {
        // This is treated as
        // export { foo as default }
        logger.debug(`Found '${localName}' as default export`);
        result.add(localName);
      }
    } else {
      logger.debug(`Found '${localName}' as default export`);
      result.add(localName);
    }
  }
  return result;
}

/**
 * Checks a default export declaration and returns the name
 */
export function getDefaultExportDeclaration(
  node: acorn.ExportDefaultDeclaration,
): string | null {
  logger.debug("Checking default export declaration");

  let result = null;
  // Export default could be a function declaration or expression
  if (node.declaration) {
    const declaration = node.declaration as any; // Temporarily cast it to any to prevent type erorrs
    let name = "";
    if (declaration.name) {
      const { name: localName } = node.declaration as acorn.Identifier;
      name = localName;
    } else if (declaration.id) {
      const {
        id: { name: localName },
      } = node.declaration as acorn.FunctionDeclaration;
      name = localName;
    }
    if (name) {
      logger.debug(`Found '${name}' as default export`);
      result = name;
    }
  }
  return result;
}
