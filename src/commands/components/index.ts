import { Command } from "commander";
import initComponent from "./init/index.js";
import newComponent from "./new/index.js";

const components = new Command("components");

components.addCommand(initComponent);
components.addCommand(newComponent);

export default components;
