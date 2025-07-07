export interface GitRepo {
  name: string;
  path: string;
  isGitRepo: boolean;
  lastModified: Date;
}

export interface ReflogEntry {
  hash: string;
  previousHash: string;
  author: string;
  email: string;
  timestamp: Date;
  message: string;
  action: string;
  branch?: string | undefined;
  jiraTicket?: string | undefined;
}

export interface ParsedReflogData {
  repo: GitRepo;
  entries: ReflogEntry[];
  jiraTickets: string[];
  timeSpent: TimeSpentData[];
}

export interface TimeSpentData {
  jiraTicket: string;
  branch: string;
  totalTime: number; // in minutes
  sessions: WorkSession[];
}

export interface WorkSession {
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  branch: string;
  commits: number;
}

export interface IndexingOptions {
  basePath?: string;
  excludePaths?: string[];
  maxDepth?: number;
  includeSubmodules?: boolean;
}

export interface DisplayOptions {
  format: 'table' | 'json' | 'summary';
  dateRange?:
    | {
        start: Date;
        end: Date;
      }
    | undefined;
}
