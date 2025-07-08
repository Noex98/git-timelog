# git-timelog

A CLI tool to help you figure out what you spend time on based on data from git.

## Description

git-timelog analyzes your git reflog to provide insights into your development activity over time. It extracts commit information, timestamps, and even Jira ticket IDs from your git history to help you understand your work patterns.

## Installation

```bash
npm install -g git-timelog
```

## Usage

Navigate to any git repository and run:

```bash
git-timelog
```

The tool will output JSON data containing:

-   **Date**: When the work was done
-   **Time**: Specific time of the activity
-   **Task ID**: Extracted Jira ticket ID (if present in commit messages)
-   **Action**: Type of git action (commit, checkout, etc.)
-   **Description**: Commit message or action description

## Example Output

```json
[
    {
        "date": "15 January",
        "time": "14:30",
        "taskId": "PROJ-123",
        "action": "commit",
        "description": "Add user authentication feature"
    },
    {
        "date": "15 January",
        "time": "13:45",
        "taskId": "PROJ-122",
        "action": "checkout",
        "description": "checkout: moving from main to feature/login"
    }
]
```

## Features

-   📊 Parses git reflog data for time tracking
-   🎫 Automatically extracts Jira ticket IDs from commit messages
-   📅 Formats dates and times in a readable format
-   🔍 Shows git actions (commits, checkouts, merges, etc.)
-   📝 Captures commit messages and descriptions

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run locally
npm run start
```

## Requirements

-   Node.js
-   A git repository with reflog data

## License

ISC

## Author

[Noex98](https://github.com/Noex98)

## Repository

[https://github.com/Noex98/git-timelog](https://github.com/Noex98/git-timelog)
