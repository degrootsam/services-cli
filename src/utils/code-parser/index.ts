import { logger } from "..";
import { FunctionInfo } from "../types";
import {
  getDefaultExportDeclaration,
  getDefaultNamedExportDeclarations,
} from "./parsers";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

export default class CodeParser {
  private type: string = "js";

  constructor(type: string) {
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
  private getDefaultExportNames(ast: t.File): Set<string> {
    const exportedNames = new Set<string>();

    traverse(ast, {
      ExportNamedDeclaration(path, node) {
        console.log(JSON.stringify(path.container));
        if (!path.container) {
          return;
        }

        if (Array.isArray(path.container)) {
          const exportDeclarations = path.container.filter(
            (node) => node.type === "ExportNamedDeclaration",
          );
        }
      },
      ExportDefaultDeclaration(path) {},
    });

    return exportedNames;
  }

  /** Extract function information from the AST */
  validateFunction(code: string, func: FunctionInfo): FunctionInfo {
    logger.debug(code);
    let currentFunction: FunctionInfo = { ...func };
    const ast = this.makeAst(code);
    logger.debug(`Validating functions for provided code`);

    const exportedNames = this.getDefaultExportNames(ast);
    logger.debug(exportedNames);

    traverse(ast, {
      FunctionDeclaration(path) {
        logger.debug(`Checking function declaration`);
        if (path.node.id) {
          const { name } = path.node.id;
          const isDefaultExport = exportedNames.has(name);
          const isAsync = path.node.async;
          const valid = isDefaultExport && isAsync;
          currentFunction = {
            ...currentFunction,
            validation: {
              valid,
              info: {
                exportedAs: name,
                isAsync,
                isDefaultExport,
              },
            },
          };
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
          const isDefaultExport = exportedNames.has(name);
          const isAsync = path.node.init.async;
          const valid = isDefaultExport && isAsync;
          currentFunction = {
            ...currentFunction,
            validation: {
              valid,
              info: {
                exportedAs: name,
                isAsync,
                isDefaultExport,
              },
            },
          };
        }
      },
    });

    return currentFunction;
  }
}
