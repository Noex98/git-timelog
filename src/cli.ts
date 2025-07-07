#!/usr/bin/env node

import { Command } from 'commander';
import { GitTimelogCommand } from './commands/git-timelog-command';

const program = new Command();

program
  .name('git-timelog')
  .description(
    'A CLI tool to analyze git repositories and generate timelog reports from reflog data'
  )
  .version('1.0.0');

// Main command that does everything in one step
program
  .description(
    'Analyze git repositories in current directory and generate timelog report'
  )
  .option(
    '-f, --format <format>',
    'Output format (table, json, summary)',
    'table'
  )
  .option('--from <date>', 'Start date filter (YYYY-MM-DD)')
  .option('--to <date>', 'End date filter (YYYY-MM-DD)')
  .option(
    '-d, --depth <depth>',
    'Maximum depth to search for repositories',
    '3'
  )
  .action(async (options) => {
    const gitTimelogCommand = new GitTimelogCommand();
    await gitTimelogCommand.execute(options);
  });

program.parse();
