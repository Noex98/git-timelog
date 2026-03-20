#!/usr/bin/env node

import { Command } from "commander";
import pkg from "../package.json";
import { defaultCommand } from "./commands/default";

const program = new Command();

program.name(pkg.name).description(pkg.description).version(pkg.version);

program
    .option("--json", "output in JSON format instead of opening web report")
    .option("--date <date>", "show entries for a single day")
    .option("--from <date>", "show entries on or after this date")
    .option("--to <date>", "show entries on or before this date")
    .addHelpText(
        "after",
        `
Date format:
  Any unambiguous date string works, but YYYY-MM-DD is recommended.

Examples:
  $ git-timelog                                  open web report for all entries
  $ git-timelog --json                           print all entries as JSON
  $ git-timelog --date 2026-03-20                entries for a single day
  $ git-timelog --from 2026-03-01 --to 2026-03-20  entries within a date range
  $ git-timelog --from 2026-03-01                entries from a date onward
  $ git-timelog --to 2026-03-20                  entries up to a date`,
    )
    .action(async (options) => {
        const outputFormat = options.json ? "json" : "web";
        const from = options.date ?? options.from;
        const to = options.date ?? options.to;
        await defaultCommand(outputFormat, { from, to });
    });

program.parse();
