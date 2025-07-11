import { simpleGit } from "simple-git";
import { ReflogHandler } from "../utils/reflogHandler";
import ejs from "ejs";
import path from "path";
import open from "open";
import fs from "fs/promises";

export async function defaultCommand() {
    const git = simpleGit(process.cwd());

    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
        console.error("Error: Current directory is not a git repository.");
        console.error("Please run this command from within a git repository.");
        process.exit(1);
    }

    const reflogHandler = new ReflogHandler();

    const reflog = await git.raw([
        "reflog",
        "--date=local",
        `--pretty=format:${reflogHandler.getPrettyFormat()}`,
    ]);

    const data = reflog
        .split("\n")
        .map((line) => reflogHandler.parseReflogLine(line));

    const report = await ejs.renderFile(path.join(__dirname, "report.ejs"), {
        data,
    });

    const reportPath = path.join(__dirname, "report.html");

    await fs.writeFile(reportPath, report);
    open(reportPath);
}
