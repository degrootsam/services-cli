import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import { logger } from "..";
import { FunctionInfo } from "../functions/types";

export default class CodeParser {
  private type: string = "js";

  constructor(type: "js" | "ts") {
    this.type = type;
  }

  /** Make an AST to parse the code */
  private makeAst(code: string) {
    return parse(code, {
      sourceType: "module",
      plugins: this.type === "ts" ? ["typescript"] : [],
    });
  }

  /** Uses Babel traverse to get the exported items */
  private getDefaultExportName(ast: t.File): string {
    let exportedName = "";

    traverse(ast, {
      ExportNamedDeclaration(path) {
        if (!path.container) return;
        logger.debug(path.container);
        if (Array.isArray(path.container)) {
          const exportDeclarations = path.container.filter(
            (node) => node.type === "ExportNamedDeclaration",
          );
          for (const exportDeclaration of exportDeclarations) {
            logger.debug({ exportDeclarations });
            if (!exportDeclarations) return;
            const { specifiers } = exportDeclaration;
            if (specifiers.length > 0) {
              logger.debug(`NamedExportDeclaration`, specifiers);
              if (specifiers.length === 0) return;
              for (const specifier of specifiers) {
                const {
                  local: { name: localName },
                  exported,
                } = specifier as t.ExportSpecifier;
                if (exported) {
                  const { name } = exported as t.Identifier;
                  if (name === "default") {
                    // Treat as default export;
                    exportedName = localName;
                  }
                }
              }
            }
          }
        }
      },
      ExportDefaultDeclaration(path) {
        if (!path.container) return;
        if (Array.isArray(path.container)) {
          const exportDeclaration = path.container.find(
            (node) => node.type === "ExportDefaultDeclaration",
          );
          if (!exportDeclaration) return;
          const { declaration } = exportDeclaration;

          logger.debug(`DefaultExportDeclaration:`, declaration);

          const { type } = declaration;
          if (type === "Identifier") {
            const { name } = declaration as t.Identifier;
            exportedName = name;
          }
          if (type === "FunctionDeclaration") {
            const { id } = declaration as t.FunctionDeclaration;
            if (!id) return; // Anonymous functions
            const { name } = id;
            exportedName = name;
          }
        }
      },
    });

    return exportedName;
  }

  /** Extract function information from the AST */
  validateFunction(
    code: string,
    func: FunctionInfo,
    functionName: string,
  ): FunctionInfo {
    logger.debug(code);
    let currentFunction: FunctionInfo = { ...func };
    const ast = this.makeAst(code);
    const exportedName = this.getDefaultExportName(ast);
    logger.debug(`Function exports ${exportedName} as default`);

    traverse(ast, {
      FunctionDeclaration(path) {
        logger.debug(`Checking function declaration`);
        if (path.node.id) {
          const { name } = path.node.id;
          logger.debug(`FunctionDeclaration:`, path.node);
          const isDefaultExport = exportedName === name;
          const matchesName = name === functionName && isDefaultExport;
          const isAsync = path.node.async;

          const valid = isDefaultExport && isAsync;
          currentFunction = {
            ...currentFunction,
            validation: {
              valid,
              info: {
                isAsync,
                isDefaultExport,
                matchesName,
              },
            },
          };
          if (name === functionName) {
            // We have found the function,
            // Processing other functions is not necessary
            path.stop();
          }
        }
      },
      VariableDeclarator(path) {
        logger.debug(`Checking function expression and arrow functions`);
        if (
          t.isIdentifier(path.node.id) &&
          (t.isFunctionExpression(path.node.init) ||
            t.isArrowFunctionExpression(path.node.init))
        ) {
          const name = path.node.id.name;
          const isDefaultExport = exportedName === name;
          const isAsync = path.node.init.async;
          const valid = isDefaultExport && isAsync;
          currentFunction = {
            ...currentFunction,
            validation: {
              valid,
              info: {
                isAsync,
                isDefaultExport,
                matchesName: false,
              },
            },
          };
          if (valid) {
            path.stop();
          }
        }
      },
    });

    return currentFunction;
  }
}
