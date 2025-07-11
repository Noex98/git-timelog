# git-timelog

A simple tool to track your git activity over time by analyzing your git reflog.

## What it does

`git-timelog` analyzes your git reflog to show you a timeline of when you made changes, what actions you performed, and what you worked on. It generates an HTML report that opens in your browser showing:

-   When you made commits, switches, merges, etc.
-   What you were working on based on commit messages
-   Task IDs extracted from commit messages (if present)
-   A chronological timeline of your git activity

## Installation

```bash
npm install -g @noex98/git-timelog
```

## Usage

Navigate to any git repository and run:

```bash
git-timelog
```

This will:

1. Analyze your git reflog
2. Generate an HTML report
3. Automatically open the report in your browser

The report shows your git activity in a table format with timestamps, actions, and descriptions.

## Requirements

-   Node.js
-   A git repository with reflog history

## What's included in the report

-   **Time & Date**: When each git action occurred
-   **Action**: The type of git operation (commit, checkout, merge, etc.)
-   **Task ID**: Any task identifiers found in commit messages (e.g., PROJ-123)
-   **Description**: The commit message or action description
