import { simpleGit } from "simple-git";
import { ReflogHandler } from "../utils/reflogHandler";

// https://git-scm.com/docs/pretty-formats

export async function defaultCommand(dir?: string) {
    const git = simpleGit(dir ?? process.cwd());
    const reflogHandler = new ReflogHandler();

    const reflog = await git.raw([
        "reflog",
        "--date=local",
        `--pretty=format:${reflogHandler.getPrettyFormat()}`,
    ]);

    const data = reflog
        .split("\n")
        .map((line) => reflogHandler.parseReflogLine(line));

    console.log(JSON.stringify(data, null, 2));
}
