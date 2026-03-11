# Multi-Repository Support

**Date:** 2026-03-11

## Overview

Add automatic multi-repo detection to git-timelog. When run in a directory that is not itself a git repo, the tool scans immediate subdirectories for git repos and aggregates their reflogs into a single report.

## Detection Logic

In `src/commands/default.ts`:

1. Check if CWD is a git repo via `git.checkIsRepo()`
2. If yes: existing single-repo behavior, with `repo` field set to the folder name
3. If no: scan immediate subdirectories (one level only) for git repos using `simple-git`
4. If no repos found in subdirectories: exit with error message
5. Collect reflogs from all found repos, tagging each entry with the repo's folder name

## Data Model Changes

In `src/utils/reflogHandler.ts`:

- Add `repo: string` field to the parsed entry type
- `ReflogHandler.parse()` accepts an optional `repo` parameter to tag entries
- After collecting entries from all repos, merge and sort by datetime (most recent first)

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
- When enabled: a "Repo" column appears in the table between Time and Action
- Repo column styled similarly to Task ID (monospace, colored)
- Default state: hidden in single-repo mode, visible in multi-repo mode

## Scope Constraints

- Only scans immediate subdirectories (no recursion)
- No new CLI flags required
- No config file
- No breaking changes to existing single-repo usage

## Files to Modify

1. `src/commands/default.ts` — detection logic, multi-repo collection, merge/sort
2. `src/utils/reflogHandler.ts` — add `repo` field, accept repo parameter
3. `public/report.ejs` — repo toggle button, conditional repo column
4. `public/styles.css` — repo column and toggle styling
