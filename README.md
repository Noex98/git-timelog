# Git Timelog

A CLI tool to analyze git repositories and generate timelog reports from reflog data, especially for tracking Jira ticket work.

## Features

- 🔍 **Automatic Repository Discovery**: Finds git repositories in current directory and subdirectories
- 📊 **Reflog Analysis**: Extracts meaningful data from git reflog entries
- 🎫 **Jira Integration**: Parse Jira ticket IDs from branch names and commit messages
- ⏱️ **Time Tracking**: Calculate time spent on different tickets based on git activity
- 📈 **Flexible Reporting**: Generate reports in table, JSON, or summary formats
- ⚡ **One-Step Process**: Index, scan, and report in a single command

## Installation

```bash
npm install -g git-timelog
```

## Usage

Simply run `git-timelog` from any directory containing git repositories:

```bash
git-timelog
```

The tool will automatically:

1. Find all git repositories in the current directory and subdirectories
2. Scan reflog data from each repository
3. Extract Jira ticket information
4. Generate and display a timelog report

### Options

- `-f, --format <format>`: Output format (table, json, summary) (default: table)
- `--from <date>`: Start date filter (YYYY-MM-DD)
- `--to <date>`: End date filter (YYYY-MM-DD)
- `-d, --depth <depth>`: Maximum depth to search for repositories (default: 3)

### Examples

```bash
# Generate a basic table report
git-timelog

# Generate a summary report
git-timelog --format summary

# Generate JSON report with date filtering
git-timelog --format json --from 2024-01-01 --to 2024-01-31

# Search deeper for repositories
git-timelog --depth 5
```

## How It Works

1. **Repository Discovery**: Automatically finds git repositories in the current directory and subdirectories
2. **Reflog Parsing**: Extracts reflog entries from each repository
3. **Jira Ticket Extraction**: Branch names and commit messages are parsed for Jira ticket IDs (e.g., PROJ-123)
4. **Time Calculation**: Work sessions are calculated based on git activity patterns
5. **Report Generation**: Data is formatted and presented according to your preferences

## Branch Naming Convention

For best results, use branch names that include your Jira ticket IDs:

- `feature/PROJ-123-user-authentication`
- `bugfix/PROJ-456-fix-login-issue`
- `PROJ-789-improve-performance`

## Use Cases

### Inside a Project Repository

```bash
cd /path/to/your/project
git-timelog
```

This will analyze the current repository and any submodules or nested repositories.

### From a Workspace Directory

```bash
cd /path/to/your/workspace
git-timelog
```

This will analyze all git repositories in the workspace, perfect for tracking work across multiple projects.

## Output Examples

### Table Format

```
┌─────────────┬──────────────────────────────┬────────────┬──────────┬─────────────────────┐
│ Jira Ticket │ Branch                       │ Total Time │ Sessions │ Last Activity       │
├─────────────┼──────────────────────────────┼────────────┼──────────┼─────────────────────┤
│ PROJ-123    │ feature/PROJ-123-auth        │ 8.5h       │ 3        │ 2024-01-15 14:30    │
│ PROJ-456    │ bugfix/PROJ-456-login        │ 4.2h       │ 2        │ 2024-01-14 11:45    │
└─────────────┴──────────────────────────────┴────────────┴──────────┴─────────────────────┘
```

### Summary Format

```
📊 Git Timelog Summary Report
========================================

Total Time Tracked: 12.7 hours
Total Jira Tickets: 2
Total Work Sessions: 5

Top 5 Tickets by Time:
  1. PROJ-123 - 8.5h
  2. PROJ-456 - 4.2h
```

## Development

### Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn

### Setup

1. Clone the repository:

```bash
git clone https://github.com/your-username/git-timelog.git
cd git-timelog
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

### Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm run dev`: Watch mode for development
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

If you encounter any issues or have questions, please file an issue on the GitHub repository.
