export interface DateFilter {
    from?: string;
    to?: string;
}

export function parseDateBound(value: string | undefined, endOfDay: boolean): Date | undefined {
    if (!value) return undefined;
    const d = new Date(value);
    if (isNaN(d.getTime())) {
        console.error(`Invalid date: "${value}". Use a format like YYYY-MM-DD.`);
        process.exit(1);
    }
    if (endOfDay) {
        d.setHours(23, 59, 59, 999);
    } else {
        d.setHours(0, 0, 0, 0);
    }
    return d;
}
