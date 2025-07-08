export class ReflogHandler {
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
     * Extracts the Jira ID from the reflog subject.
     */
    getJiraId(reflogSubject?: string) {
        if (!reflogSubject) return undefined;

        const jiraIdRegex = /\b[A-Z][A-Z0-9]+-\d+\b/g;
        return reflogSubject.match(jiraIdRegex)?.[0];
    }
}
