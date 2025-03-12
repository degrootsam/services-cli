import * as acorn from "acorn";
import * as acornWalk from "acorn-walk";
import { logger } from "..";
import { FunctionInfo } from "../types";
import {
  getDefaultExportDeclaration,
  getDefaultNamedExportDeclarations,
} from "./parsers";
import tsPlugin from "acorn-typescript";

export default class CodeParser {
  private type: string = "ts";
  // Using acorn with TypeScript plugin to support parsing .ts files.
  private acornParser: typeof acorn.Parser =
    this.type === "ts"
      ? acorn.Parser.extend(tsPlugin() as any)
      : (acorn.Parser as any);

  /** Make an ast to parse the code */
  private makeAst(code: string) {
    return this.acornParser.parse(code, {
      sourceType: "module",
      ecmaVersion: "latest",
      locations: true,
    });
  }

  constructor(type: string) {
    this.type = type;
  }

  /** Uses acorn-walk to get the exported items */
  private getDefaultExportNames(ast: acorn.Program): Set<string> {
    const exportedNames = new Set<string>();
    // First pass: collect exported names and identify default export function (if any)
    acornWalk.simple(ast, {
      ExportNamedDeclaration: (node) =>
        getDefaultNamedExportDeclarations(node)
          .keys()
          .forEach((value) => exportedNames.add(value)),
      ExportDefaultDeclaration: (node) => {
        const exportedName = getDefaultExportDeclaration(node);
        if (exportedName) exportedNames.add(exportedName);
      },
    });

    return exportedNames;
  }

  /** Extract function information from the AST */
  validateFunction(code: string, func: FunctionInfo): FunctionInfo {
    let currentFunction: FunctionInfo = { ...func };
    const ast = this.makeAst(code);
    logger.debug(`Validating functions for provided code`);

    const exportedNames = this.getDefaultExportNames(ast);

    logger.debug(exportedNames);

    acornWalk.ancestor(ast, {
      FunctionDeclaration: (node) => {
        logger.debug(`Checking function declaration`);
        if (node.id) {
          const { name } = node.id;
          const isDefaultExport = exportedNames.has(name);
          const isAsync = node.async;
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
      FunctionExpression: (node, _state, ancestors: any[]) => {
        logger.debug(`Checking function expression`);
        // Function expressions (including arrow functions) don't have their own name,
        // so we check if they are assigned to an identifier that is exported.
        const parent = ancestors[ancestors.length - 1];
        if (
          parent?.type === "VariableDeclarator" &&
          parent.id.type === "Identifier"
        ) {
          const name = parent.id.name;
          const isDefaultExport = exportedNames.has(name);
          const isAsync = node.async;
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
      ArrowFunctionExpression: (node: any, _state: any, ancestors: any[]) => {
        logger.debug(`Checking arrow function expression`);
        // Similar handling for arrow functions assigned to exported variables
        const parent = ancestors[ancestors.length - 1]; // Get the parent node
        logger.debug(JSON.stringify(node));
        if (
          parent?.type === "VariableDeclarator" &&
          parent.id.type === "Identifier"
        ) {
          const name = parent.id.name;
          const isDefaultExport = exportedNames.has(name);
          const isAsync = node.async;
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
