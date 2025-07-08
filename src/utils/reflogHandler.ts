export class ReflogHandler {
    // https://git-scm.com/docs/pretty-formats
    private reflogValues = ["%gd", "%gs"] as const;
    private separator = "|" as const;

    getPrettyFormat() {
        return this.reflogValues.join(this.separator);
    }

    parseReflogLine(reflog: string) {
        const [gd, gs] = reflog.split(this.separator);
        const dateMatch = gd?.match(/HEAD@\{(.+?)\}/);
        const date = dateMatch?.[1] ? new Date(dateMatch[1]) : undefined;

        const parsedReflogSubject = gs?.split(": ", 2) ?? [];

        return {
            date: date?.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
            }),
            time: date?.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
            }),
            taskId: this.getJiraId(gs) ?? "",
            action:
                parsedReflogSubject.length > 1 ? parsedReflogSubject[0] : null,
            description: parsedReflogSubject[1] ?? parsedReflogSubject[0],
        };
    }

    /**
     * Return first found JIRA ID from a string
     */
    getJiraId(reflogSubject?: string) {
        if (!reflogSubject) return null;

        const jiraIdRegex = /\b[A-Z][A-Z0-9]+-\d+\b/g;
        return reflogSubject.match(jiraIdRegex)?.[0] ?? null;
    }
}
