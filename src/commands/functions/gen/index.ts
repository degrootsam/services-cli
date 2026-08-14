import { Command } from "commander";
import genTest from "./test.js";
import genTypes from "./types.js";

const genFunctions = new Command("gen");

genFunctions.addCommand(genTest);
genFunctions.addCommand(genTypes);

export default genFunctions;
