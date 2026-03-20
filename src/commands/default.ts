import { simpleGit } from "simple-git";
import { ReflogHandler } from "../utils/reflogHandler";
import { DateFilter, parseDateBound } from "../utils/dateFilter";
import ejs from "ejs";
import path from "path";
import open from "open";
import fs from "fs/promises";

export async function defaultCommand(
    outputFormat: "web" | "json",
    dateFilter: DateFilter = {},
) {
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

    const from = parseDateBound(dateFilter.from, false);
    const to = parseDateBound(dateFilter.to, true);

    const data = reflog
        .split("\n")
        .map((line) => reflogHandler.parseReflogLine(line))
        .filter(({ timestamp }) => {
            if (!from && !to) return true;
            if (!timestamp) return false;
            if (from && timestamp < from) return false;
            if (to && timestamp > to) return false;
            return true;
        })
        .map(({ timestamp: _, ...rest }) => rest);

    if (outputFormat === "web") {
        const report = await ejs.renderFile(
            path.join(__dirname, "report.ejs"),
            {
                data,
            },
        );
        const reportPath = path.join(__dirname, "report.html");
        await fs.writeFile(reportPath, report);
        open(reportPath);
    }

    if (outputFormat === "json") {
        const x = JSON.stringify(data, null, 2);
        console.log(x);
    }
}
