import { Command } from "commander";
import buildFunctions from "./build/index.js";
import bumpFunction from "./bump/index.js";
import genFunctions from "./gen/index.js";
import initFunction from "./init/index.js";
import listFunctions from "./list/index.js";
import validateFunctions from "./validate/index.js";
import newFunction from "./new/index.js";
import publishFunction from "./publish/index.js";

const functions = new Command("functions");

functions.addCommand(buildFunctions);
functions.addCommand(bumpFunction);
functions.addCommand(genFunctions);
functions.addCommand(initFunction);
functions.addCommand(listFunctions);
functions.addCommand(newFunction);
functions.addCommand(publishFunction);
functions.addCommand(validateFunctions);

export default functions;
