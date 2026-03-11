import { simpleGit } from "simple-git";
import { ReflogHandler } from "../utils/reflogHandler";
import ejs from "ejs";
import path from "path";
import open from "open";
import fs from "fs/promises";

async function findGitRepos(parentDir: string): Promise<string[]> {
    const entries = await fs.readdir(parentDir, { withFileTypes: true });
    const repos: string[] = [];

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const subdir = path.join(parentDir, entry.name);
        const isRepo = await simpleGit(subdir).checkIsRepo();
        if (isRepo) repos.push(subdir);
    }

    return repos;
}

export async function defaultCommand(outputFormat: "web" | "json") {
    const cwd = process.cwd();
    const git = simpleGit(cwd);
    const reflogHandler = new ReflogHandler();

    const isRepo = await git.checkIsRepo();
    let isMultiRepo = false;
    let repoPaths: string[];

    if (isRepo) {
        repoPaths = [cwd];
    } else {
        repoPaths = await findGitRepos(cwd);
        if (repoPaths.length === 0) {
            console.error(
                "Error: No git repositories found in this directory."
            );
            console.error(
                "Please run this command from within a git repository or a folder containing git repositories."
            );
            process.exit(1);
        }
        isMultiRepo = true;
    }

    // Collect reflog entries from all repos
    let allEntries: ReturnType<typeof reflogHandler.parseReflogLine>[] = [];

    for (const repoPath of repoPaths) {
        const repoGit = simpleGit(repoPath);
        const repoName = path.basename(repoPath);

        const reflog = await repoGit.raw([
            "reflog",
            "--date=local",
            `--pretty=format:${reflogHandler.getPrettyFormat()}`,
        ]);

        if (!reflog.trim()) continue;

        const entries = reflog
            .split("\n")
            .map((line) => reflogHandler.parseReflogLine(line, repoName));

        allEntries = allEntries.concat(entries);
    }

    // Sort by sortKey descending (most recent first) for multi-repo
    if (isMultiRepo) {
        allEntries.sort((a, b) => b.sortKey - a.sortKey);
    }

    // Strip sortKey from output
    const data = allEntries.map(({ sortKey, ...rest }) => rest);

    if (outputFormat === "web") {
        const report = await ejs.renderFile(
            path.join(__dirname, "report.ejs"),
            {
                data,
                isMultiRepo,
            }
        );
        const reportPath = path.join(__dirname, "report.html");
        await fs.writeFile(reportPath, report);
        open(reportPath);
    }

    if (outputFormat === "json") {
        console.log(JSON.stringify(data, null, 2));
    }
}
