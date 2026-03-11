# Multi-Repository Support

**Date:** 2026-03-11

## Overview

Add automatic multi-repo detection to git-timelog. When run in a directory that is not itself a git repo, the tool scans immediate subdirectories for git repos and aggregates their reflogs into a single report.

## Detection Logic

In `src/commands/default.ts`:

1. Check if CWD is a git repo via `git.checkIsRepo()`
2. If yes: existing single-repo behavior, with `repo` field set to `path.basename(process.cwd())`
3. If no: use `fs.readdir` to list immediate subdirectories, then check each with `simple-git(subdir).checkIsRepo()`
4. If no repos found in subdirectories: exit with error "No git repositories found in this directory"
5. Collect reflogs from all found repos, tagging each entry with `path.basename(subdirPath)`

## Data Model Changes

In `src/utils/reflogHandler.ts`:

- Add `repo: string` field to the parsed entry type
- Add `sortKey: number` field (Unix timestamp from the parsed Date object, currently discarded after formatting) to enable chronological sorting — stripped before JSON output
- `ReflogHandler.parse()` accepts an optional `repo` parameter to tag entries
- After collecting entries from all repos, merge and sort by `sortKey` descending (most recent first), then remove `sortKey` from the final output

## JSON Output

Each entry always includes `"repo": "repo-name"`, whether single or multi-repo mode. Example:

```json
{
  "date": "Wednesday, 11 March",
  "time": "14:30",
  "action": "commit",
  "description": "fix login bug",
  "taskId": "AUTH-42",
  "repo": "backend-api"
}
```

## HTML Report

In `public/report.ejs` and `public/styles.css`:

- Add a "Repo" toggle button next to the existing theme toggle
- Toggle state persisted in `localStorage` under key `git-timelog-repo-column`
- When enabled: a "Repo" column appears in the table. Use class-based column styling (`.col-time`, `.col-repo`, `.col-action`, etc.) instead of `nth-child` selectors to avoid column-shift issues when Repo is toggled
- Repo column styled similarly to Task ID (monospace, colored)
- EJS template renders a JS variable `const isMultiRepo = <%= isMultiRepo %>;` so toggle initialization can set the correct default
- Default: visible in multi-repo mode, hidden in single-repo mode. `localStorage` overrides the default once the user has explicitly toggled

## Scope Constraints

- Only scans immediate subdirectories (no recursion)
- No new CLI flags required
- No config file
- Adding `repo` to JSON output is an additive change (new field only); acceptable as non-breaking for typical consumers

## Files to Modify

1. `src/commands/default.ts` — detection logic, multi-repo collection, merge/sort
2. `src/utils/reflogHandler.ts` — add `repo` field, accept repo parameter
3. `public/report.ejs` — repo toggle button, conditional repo column
4. `public/styles.css` — repo column and toggle styling
