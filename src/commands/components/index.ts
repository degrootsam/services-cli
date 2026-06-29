import { program } from "commander";
import initComponent from "./init";
import newComponent from "./new";

const components = program.command("components");

components.addCommand(initComponent);
components.addCommand(newComponent);

export default components;
