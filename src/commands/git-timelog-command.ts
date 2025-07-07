import { RepoIndexer } from '../core/repo-indexer';
import { ReflogParser } from '../core/reflog-parser';
import { ReportGenerator } from '../core/report-generator';
import {
  IndexingOptions,
  GitRepo,
  ParsedReflogData,
  DisplayOptions,
} from '../types';
import chalk from 'chalk';

interface GitTimelogCommandOptions {
  format: string;
  from?: string;
  to?: string;
  depth: string;
}

export class GitTimelogCommand {
  private reflogParser: ReflogParser;
  private reportGenerator: ReportGenerator;

  constructor() {
    this.reflogParser = new ReflogParser();
    this.reportGenerator = new ReportGenerator();
  }

  async execute(options: GitTimelogCommandOptions): Promise<void> {
    try {
      console.log(
        chalk.blue(
          '🔍 Analyzing git repositories and generating timelog report...'
        )
      );

      const indexingOptions = this.createIndexingOptions(options);
      const displayOptions = this.createDisplayOptions(options);

      const repos = await this.discoverRepositories(indexingOptions);
      const scanResults = await this.scanRepositories(repos);
      const report = this.generateReport(scanResults, displayOptions);

      console.log(chalk.green('✅ Analysis complete!'));
      console.log('\n' + report);
    } catch (error) {
      console.error(chalk.red('❌ Error analyzing repositories:'), error);
      process.exit(1);
    }
  }

  private async discoverRepositories(
    indexingOptions: IndexingOptions
  ): Promise<GitRepo[]> {
    console.log(chalk.gray('  📁 Finding git repositories...'));
    const repoIndexer = new RepoIndexer(process.cwd(), indexingOptions);
    const repos = await repoIndexer.findGitRepos();

    if (repos.length === 0) {
      console.log(
        chalk.yellow('⚠️  No git repositories found in current directory.')
      );
      process.exit(0);
    }

    console.log(chalk.green(`    ✅ Found ${repos.length} git repositories`));
    repos.forEach((repo: GitRepo, index: number) => {
      console.log(chalk.gray(`      ${index + 1}. ${repo.name}`));
    });

    return repos;
  }

  private async scanRepositories(
    repos: GitRepo[]
  ): Promise<ParsedReflogData[]> {
    console.log(chalk.gray('  🔍 Scanning reflog data...'));
    const scanResults: ParsedReflogData[] = [];

    for (const repo of repos) {
      console.log(chalk.gray(`    Scanning ${repo.name}...`));
      const result = await this.reflogParser.parseRepoReflog(repo);
      scanResults.push(result);

      const entryCount = result.entries.length;
      const ticketCount = result.jiraTickets.length;
      console.log(
        chalk.green(
          `      ✅ Found ${entryCount} reflog entries, ${ticketCount} Jira tickets`
        )
      );
    }

    return scanResults;
  }

  private generateReport(
    scanResults: ParsedReflogData[],
    displayOptions: DisplayOptions
  ): string {
    console.log(chalk.gray('  📊 Generating report...'));
    return this.reportGenerator.generateReport(scanResults, displayOptions);
  }

  private createIndexingOptions(
    options: GitTimelogCommandOptions
  ): IndexingOptions {
    return {
      maxDepth: parseInt(options.depth, 10),
      excludePaths: [
        'node_modules',
        '.git',
        'dist',
        'build',
        'coverage',
        '.vscode',
        '.idea',
      ],
    };
  }

  private createDisplayOptions(
    options: GitTimelogCommandOptions
  ): DisplayOptions {
    return {
      format: this.parseFormat(options.format),
      dateRange: this.parseDateRange(options.from, options.to),
    };
  }

  private parseFormat(format: string): 'table' | 'json' | 'summary' {
    if (format === 'table' || format === 'json' || format === 'summary') {
      return format;
    }
    return 'table';
  }

  private parseDateRange(
    from?: string,
    to?: string
  ): { start: Date; end: Date } | undefined {
    if (!from && !to) {
      return undefined;
    }

    const start = from ? new Date(from) : new Date(0);
    const end = to ? new Date(to) : new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn(chalk.yellow('⚠️  Invalid date format. Using all dates.'));
      return undefined;
    }

    return { start, end };
  }
}
