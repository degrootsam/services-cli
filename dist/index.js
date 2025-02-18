#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCLI = runCLI;
const commander_1 = require("commander");
const utils_1 = require("./utils");
const gql_api_1 = __importDefault(require("./utils/gql-api"));
const program = new commander_1.Command();
function runCLI(args) {
    program
        .command("greet <name>")
        .option("-u, --uppercase", "Convert name to uppercase")
        .action((name, options) => {
        const greeting = `Hello, ${options.uppercase ? name.toUpperCase() : name}!`;
        console.log(greeting);
    });
    program
        .command("functions")
        .command("types")
        .action(() => {
        const gqlAPI = new gql_api_1.default();
        gqlAPI.getApiURL();
    });
    return program.parseAsync(args);
}
utils_1.logger.debug("TEST DEBUG");
utils_1.logger.error("TEST ERROR");
if (require.main === module) {
    runCLI(process.argv);
}
//# sourceMappingURL=index.js.map