import { Command } from "commander";
import genTest from "./test";
import genTypes from "./types";

const genFunctions = new Command("gen");

genFunctions.addCommand(genTest);
genFunctions.addCommand(genTypes);

export default genFunctions;
