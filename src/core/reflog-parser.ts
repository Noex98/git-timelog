import { simpleGit } from 'simple-git';
import { GitRepo, ReflogEntry, ParsedReflogData } from '../types';

/**
 * Simple ReflogParser - Shows what actually happened without assumptions
 *
 * Philosophy: Better to show accurate information than to guess wrong
 * - Parse reflog entries accurately
 * - Extract Jira tickets from branch names reliably
 * - Show activities chronologically
 * - No time duration calculations (too error-prone)
 */
export class ReflogParser {
  private readonly jiraPattern = /[A-Z]{2,}-\d+/g;

  async parseRepoReflog(repo: GitRepo): Promise<ParsedReflogData> {
    try {
      const git = simpleGit(repo.path);
      // Use reflog format that includes action information
      const reflogOutput = await git.raw([
        'reflog',
        '--pretty=format:%H %p %an %ae %at %gs',
      ]);

      const entries = this.parseReflogEntries(reflogOutput);
      const jiraTickets = this.extractJiraTickets(entries);

      return {
        repo,
        entries,
        jiraTickets,
        timeSpent: [], // No time calculations - just show what happened
      };
    } catch (error) {
      console.error(`Error parsing reflog for ${repo.name}:`, error);
      return {
        repo,
        entries: [],
        jiraTickets: [],
        timeSpent: [],
      };
    }
  }

  private parseReflogEntries(reflogOutput: string): ReflogEntry[] {
    const lines = reflogOutput.split('\n').filter((line) => line.trim());
    const entries: ReflogEntry[] = [];

    for (const line of lines) {
      const entry = this.parseReflogLine(line);
      if (entry) {
        entries.push(entry);
      }
    }

    // Sort by timestamp (newest first) to show chronological activity
    return entries.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  private parseReflogLine(line: string): ReflogEntry | null {
    // Format: %H %p %an %ae %at %gs
    // Example: 542325fa62b247b84a9d3a2fca510a644511c456 63f4eb1 Johannes Knickering jkn@impact.dk 1751911384 Add more content for PROJ-123

    // Use regex to parse the line properly, accounting for spaces in author names
    const match = line.match(
      /^(\S+)\s+(\S*)\s+(.+?)\s+(\S+@\S+)\s+(\d+)\s+(.*)$/
    );

    if (!match) {
      console.warn(`Could not parse reflog line: ${line}`);
      return null;
    }

    const hash = match[1]!;
    const previousHash = match[2]!;
    const author = match[3]!;
    const email = match[4]!;
    const timestampStr = match[5]!;
    const message = match[6]!;

    if (!hash || !author || !email || !timestampStr) {
      return null;
    }

    // Parse and validate timestamp
    const timestampNum = parseInt(timestampStr, 10);
    if (isNaN(timestampNum)) {
      console.warn(`Invalid timestamp in reflog line: ${timestampStr}`);
      return null;
    }

    const timestamp = new Date(timestampNum * 1000);
    if (isNaN(timestamp.getTime())) {
      console.warn(
        `Invalid date from timestamp: ${timestampStr} -> ${timestampNum}`
      );
      return null;
    }

    // Extract branch from checkout messages
    const branch = this.extractBranchFromMessage(message);

    // Extract Jira ticket from branch name if available
    const jiraTicket = this.extractJiraTicketFromText(
      message + ' ' + (branch || '')
    );

    return {
      hash,
      previousHash: previousHash || '',
      author,
      email,
      timestamp,
      message,
      action: this.determineAction(message),
      branch,
      jiraTicket,
    };
  }

  /**
   * Extract branch name from checkout messages
   * Example: "checkout: moving from main to feature/PROJ-123-test" -> "feature/PROJ-123-test"
   */
  private extractBranchFromMessage(message: string): string | undefined {
    const checkoutMatch = message.match(/checkout: moving from .* to (.+)$/);
    return checkoutMatch?.[1];
  }

  /**
   * Determine what type of action happened based on the message
   */
  private determineAction(message: string): string {
    if (message.startsWith('commit:') || message.startsWith('commit (')) {
      return 'commit';
    }
    if (message.startsWith('checkout: moving from')) {
      return 'checkout';
    }
    if (message.includes('merge')) {
      return 'merge';
    }
    if (message.includes('rebase')) {
      return 'rebase';
    }
    if (message.includes('pull')) {
      return 'pull';
    }
    if (message.includes('reset')) {
      return 'reset';
    }
    return 'other';
  }

  /**
   * Extract Jira ticket from any text (branch names, commit messages)
   */
  private extractJiraTicketFromText(text: string): string | undefined {
    const matches = text.match(this.jiraPattern);
    return matches?.[0]; // Return first match
  }

  /**
   * Extract all unique Jira tickets found in the reflog entries
   */
  private extractJiraTickets(entries: ReflogEntry[]): string[] {
    const tickets = new Set<string>();

    entries.forEach((entry) => {
      if (entry.jiraTicket) {
        tickets.add(entry.jiraTicket);
      }
    });

    return Array.from(tickets).sort();
  }
}
