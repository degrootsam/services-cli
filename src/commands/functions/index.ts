import { Command } from "commander";
import buildFunctions from "./build";
import bumpFunction from "./bump";
import genFunctions from "./gen";
import initFunction from "./init";
import validateFunctions from "./validate";
import newFunction from "./new";
import publishFunction from "./publish";

const functions = new Command("functions");

functions.addCommand(buildFunctions);
functions.addCommand(bumpFunction);
functions.addCommand(genFunctions);
functions.addCommand(initFunction);
functions.addCommand(newFunction);
functions.addCommand(publishFunction);
functions.addCommand(validateFunctions);

export default functions;
