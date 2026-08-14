import { program } from "commander";
import initComponent from "./init/index.js";
import newComponent from "./new/index.js";

const components = program.command("components");

components.addCommand(initComponent);
components.addCommand(newComponent);

export default components;
