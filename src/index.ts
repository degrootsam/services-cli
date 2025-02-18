#!/usr/bin/env node

import { Command } from "commander";

const program = new Command();

program
  .name("my-cli")
  .description("A simple CLI built with Commander.js")
  .version("1.0.0");

program
  .command("greet <name>")
  .description("Greet someone")
  .option("-u, --uppercase", "Convert name to uppercase")
  .action((name, options) => {
    const greeting = `Hello, ${options.uppercase ? name.toUpperCase() : name}!`;
    console.log(greeting);
  });

program.parse(process.argv);
