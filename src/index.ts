#!/usr/bin/env node

import { Command } from "commander";
import pkg from "../package.json";
import { defaultCommand } from "./commands/default";

const program = new Command();

program.name(pkg.name).description(pkg.description).version(pkg.version);

program
    .option("--json", "output in JSON format instead of opening web report")
    .action(async (options) => {
        const outputFormat = options.json ? "json" : "web";
        await defaultCommand(outputFormat);
    });

program.parse();
