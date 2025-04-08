import { Command } from "commander";
import { withErrorHandling, FunctionsScaffolder } from "../../../utils";
import genTest from "./test";
import genTypes from "./types";

const genFunctions = new Command("gen");

genFunctions.addCommand(genTest);
genFunctions.addCommand(genTypes);

export default genFunctions;
