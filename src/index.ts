#!/usr/bin/env node

import { Command } from "commander";
import pkg from "../package.json";
import { defaultCommand } from "./commands/default";

const program = new Command();

program.name(pkg.name).description(pkg.description).version(pkg.version);

program.action(async () => {
    await defaultCommand();
});

program.parse();
