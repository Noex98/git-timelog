import { promises as fs } from "fs";
import path from "path";
import { glob } from "glob";
import { GitRepo, IndexingOptions } from "../types";

export class RepoIndexer {
    private basePath: string;
    private options: IndexingOptions;

    constructor(
        basePath: string = process.cwd(),
        options: IndexingOptions = {}
    ) {
        this.basePath = basePath;
        this.options = {
            maxDepth: 3,
            includeSubmodules: false,
            excludePaths: ["node_modules", ".git", "dist", "build"],
            ...options,
        };
    }

    async findGitRepos(): Promise<GitRepo[]> {
        const repos: GitRepo[] = [];
        const gitDirs = await this.findGitDirectories();

        for (const gitDir of gitDirs) {
            const repoPath = path.dirname(gitDir);
            const repo = await this.createRepoInfo(repoPath);

            if (repo.isGitRepo) {
                repos.push(repo);
            }
        }

        return repos;
    }

    private async findGitDirectories(): Promise<string[]> {
        const pattern = path.join(this.basePath, "**/.git").replace(/\\/g, "/");
        const excludePatterns =
            this.options.excludePaths?.map((p) => `!**/${p}/**`) || [];

        try {
            const gitDirs = await glob(pattern, {
                ignore: excludePatterns,
                maxDepth: this.options.maxDepth || 3,
                absolute: true,
            });

            return gitDirs;
        } catch (error) {
            console.error("Error finding git directories:", error);
            return [];
        }
    }

    private async createRepoInfo(repoPath: string): Promise<GitRepo> {
        const name = path.basename(repoPath);
        let isGitRepo = false;
        let lastModified = new Date();

        try {
            const gitPath = path.join(repoPath, ".git");
            const stats = await fs.stat(gitPath);
            isGitRepo = stats.isDirectory();
            lastModified = stats.mtime;
        } catch (error) {
            // If .git doesn't exist or is not accessible, it's not a valid git repo
            isGitRepo = false;
        }

        return {
            name,
            path: repoPath,
            isGitRepo,
            lastModified,
        };
    }

    async validateRepo(repoPath: string): Promise<boolean> {
        try {
            const gitPath = path.join(repoPath, ".git");
            const stats = await fs.stat(gitPath);
            return stats.isDirectory();
        } catch {
            return false;
        }
    }
}
