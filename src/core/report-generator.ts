import { ParsedReflogData, DisplayOptions, ReflogEntry } from '../types';
import Table from 'cli-table3';
import chalk from 'chalk';
import { format } from 'date-fns';

export class ReportGenerator {
  generateReport(
    scanResults: ParsedReflogData[],
    options: DisplayOptions
  ): string {
    const filteredData = this.filterData(scanResults, options);
    return this.generateActivityReport(filteredData, options);
  }

  private generateActivityReport(
    scanResults: ParsedReflogData[],
    options: DisplayOptions
  ): string {
    switch (options.format) {
      case 'table':
        return this.generateActivityTableReport(scanResults);
      case 'json':
        return this.generateActivityJsonReport(scanResults);
      case 'summary':
        return this.generateActivitySummaryReport(scanResults);
      default:
        return this.generateActivityTableReport(scanResults);
    }
  }

  private generateActivityTableReport(scanResults: ParsedReflogData[]): string {
    const table = new Table({
      head: [
        chalk.cyan('Repository'),
        chalk.cyan('Date'),
        chalk.cyan('Time'),
        chalk.cyan('Action'),
        chalk.cyan('Author'),
        chalk.cyan('Jira Ticket'),
        chalk.cyan('Message'),
      ],
      style: {
        head: [],
        border: [],
      },
    });

    // Collect all entries from all repos and sort by date
    const allEntries: Array<{ repo: string; entry: ReflogEntry }> = [];
    scanResults.forEach((result) => {
      result.entries.forEach((entry) => {
        allEntries.push({ repo: result.repo.name, entry });
      });
    });

    // Sort by timestamp (newest first)
    allEntries.sort(
      (a, b) => b.entry.timestamp.getTime() - a.entry.timestamp.getTime()
    );

    // Show recent activities (limit to 20 for readability)
    allEntries.slice(0, 20).forEach(({ repo, entry }) => {
      const date = format(entry.timestamp, 'yyyy-MM-dd');
      const time = format(entry.timestamp, 'HH:mm:ss');
      const jiraTicket = entry.jiraTicket || '-';
      const message = this.truncateMessage(entry.message, 50);

      table.push([
        chalk.blue(repo),
        chalk.gray(date),
        chalk.gray(time),
        this.colorizeAction(entry.action),
        chalk.yellow(entry.author),
        entry.jiraTicket ? chalk.green(jiraTicket) : chalk.gray(jiraTicket),
        chalk.white(message),
      ]);
    });

    let output = chalk.bold.blue('📋 Git Activity Report\n');
    output += chalk.gray('='.repeat(60)) + '\n\n';
    output += table.toString();

    if (allEntries.length > 20) {
      output += `\n\n${chalk.gray(`... and ${allEntries.length - 20} more activities`)}`;
    }

    return output;
  }

  private generateActivityJsonReport(scanResults: ParsedReflogData[]): string {
    const activityData = scanResults.map((result) => ({
      repository: result.repo.name,
      jiraTickets: result.jiraTickets,
      activities: result.entries.map((entry) => ({
        timestamp: entry.timestamp.toISOString(),
        action: entry.action,
        author: entry.author,
        jiraTicket: entry.jiraTicket,
        branch: entry.branch,
        message: entry.message,
        hash: entry.hash.substring(0, 8), // Short hash
      })),
    }));

    return JSON.stringify(activityData, null, 2);
  }

  private generateActivitySummaryReport(
    scanResults: ParsedReflogData[]
  ): string {
    const totalRepos = scanResults.length;
    const totalActivities = scanResults.reduce(
      (sum, result) => sum + result.entries.length,
      0
    );
    const allJiraTickets = new Set<string>();
    const actionCounts = new Map<string, number>();

    scanResults.forEach((result) => {
      result.jiraTickets.forEach((ticket) => allJiraTickets.add(ticket));
      result.entries.forEach((entry) => {
        actionCounts.set(
          entry.action,
          (actionCounts.get(entry.action) || 0) + 1
        );
      });
    });

    let summary = chalk.bold.blue('📊 Git Activity Summary\n');
    summary += chalk.gray('='.repeat(40)) + '\n\n';
    summary += chalk.green(`Repositories Analyzed: ${totalRepos}\n`);
    summary += chalk.blue(`Total Activities: ${totalActivities}\n`);
    summary += chalk.yellow(`Jira Tickets Found: ${allJiraTickets.size}\n\n`);

    if (allJiraTickets.size > 0) {
      summary += chalk.bold('Jira Tickets:\n');
      Array.from(allJiraTickets)
        .sort()
        .forEach((ticket) => {
          summary += chalk.gray(`  • `) + chalk.green(ticket) + '\n';
        });
      summary += '\n';
    }

    summary += chalk.bold('Activity Breakdown:\n');
    Array.from(actionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([action, count]) => {
        summary +=
          chalk.gray(`  • `) +
          this.colorizeAction(action) +
          chalk.gray(`: ${count}\n`);
      });

    return summary;
  }

  private colorizeAction(action: string): string {
    switch (action) {
      case 'commit':
        return chalk.green(action);
      case 'checkout':
        return chalk.blue(action);
      case 'merge':
        return chalk.magenta(action);
      case 'rebase':
        return chalk.cyan(action);
      case 'pull':
        return chalk.yellow(action);
      case 'reset':
        return chalk.red(action);
      default:
        return chalk.gray(action);
    }
  }

  private truncateMessage(message: string, maxLength: number): string {
    if (message.length <= maxLength) {
      return message;
    }
    return message.substring(0, maxLength - 3) + '...';
  }

  private filterData(
    scanResults: ParsedReflogData[],
    options: DisplayOptions
  ): ParsedReflogData[] {
    return scanResults.map((result) => {
      const filteredEntries = this.filterEntries(result.entries, options);
      const jiraTickets = this.extractUniqueJiraTickets(filteredEntries);

      return {
        ...result,
        entries: filteredEntries,
        jiraTickets,
      };
    });
  }

  private filterEntries(
    entries: ParsedReflogData['entries'],
    options: DisplayOptions
  ): ParsedReflogData['entries'] {
    let filteredEntries = entries;

    if (options.dateRange) {
      filteredEntries = this.filterByDateRange(
        filteredEntries,
        options.dateRange
      );
    }

    return filteredEntries;
  }

  private filterByDateRange(
    entries: ParsedReflogData['entries'],
    dateRange: NonNullable<DisplayOptions['dateRange']>
  ): ParsedReflogData['entries'] {
    return entries.filter((entry) => {
      const entryDate = entry.timestamp;
      return entryDate >= dateRange.start && entryDate <= dateRange.end;
    });
  }

  private extractUniqueJiraTickets(
    entries: ParsedReflogData['entries']
  ): string[] {
    const jiraTickets = entries
      .map((entry) => entry.jiraTicket)
      .filter((ticket): ticket is string => Boolean(ticket));

    return [...new Set(jiraTickets)];
  }
}
