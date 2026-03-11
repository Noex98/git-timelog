# Multi-Repository Support Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-detect multi-repo parent directories and aggregate reflogs from all child repos into a single report with a toggleable Repo column.

**Architecture:** When CWD is not a git repo, scan immediate subdirectories for repos, collect reflogs from each, merge entries by timestamp, and render the combined report. A `repo` field is added to every entry. The HTML report gets a toggle to show/hide the Repo column.

**Tech Stack:** TypeScript, simple-git, ejs, Commander.js, Node.js fs

**Spec:** `docs/superpowers/specs/2026-03-11-multi-repo-support-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/utils/reflogHandler.ts` | Modify | Add `repo` and `sortKey` fields to parsed entries |
| `src/commands/default.ts` | Modify | Multi-repo detection, collection, merge/sort, pass `isMultiRepo` to EJS |
| `public/styles.css` | Modify | Switch to class-based column widths, add `.col-repo` styles, repo toggle styles |
| `public/report.ejs` | Modify | Add repo toggle, conditional repo column, `isMultiRepo` JS variable |

---

## Chunk 1: Data Model and Backend Logic

### Task 1: Add `repo` and `sortKey` fields to ReflogHandler

**Files:**
- Modify: `src/utils/reflogHandler.ts`

- [ ] **Step 1: Update `parseReflogLine` to accept `repo` parameter and return `repo` + `sortKey`**

In `src/utils/reflogHandler.ts`, update `parseReflogLine`:

```typescript
parseReflogLine(reflog: string, repo: string = "") {
    const [gd, gs] = reflog.split(this.separator);
    const dateMatch = gd?.match(/HEAD@\{(.+?)\}/);
    const date = dateMatch?.[1] ? new Date(dateMatch[1]) : undefined;

    const parsedReflogSubject = gs?.split(": ", 2) ?? [];

    return {
        date: date?.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
        }),
        time: date?.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
        }),
        sortKey: date?.getTime() ?? 0,
        repo,
        taskId: this.getJiraId(gs) ?? "",
        action:
            parsedReflogSubject.length > 1 ? parsedReflogSubject[0] : null,
        description: parsedReflogSubject[1] ?? parsedReflogSubject[0],
    };
}
```

Changes:
- Add `repo: string = ""` parameter with default empty string
- Add `sortKey: date?.getTime() ?? 0` to the return object (Unix timestamp for sorting)
- Add `repo` to the return object

- [ ] **Step 2: Verify build passes**

Run: `cd /Users/ABM/SideProjects/git-timelog && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/utils/reflogHandler.ts
git commit -m "feat: add repo and sortKey fields to ReflogHandler"
```

---

### Task 2: Add multi-repo detection and collection to default command

**Files:**
- Modify: `src/commands/default.ts`

- [ ] **Step 1: Add fs.readdir import and helper to find git repos in subdirectories**

At the top of `src/commands/default.ts`, `fs` is already imported. Add a helper function after the existing imports:

```typescript
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
```

- [ ] **Step 2: Refactor `defaultCommand` to handle both single-repo and multi-repo**

Replace the entire `defaultCommand` function body:

```typescript
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
```

Key changes:
- Detect single-repo vs multi-repo
- Loop through all repo paths, collecting entries tagged with repo name
- Sort merged entries by `sortKey` descending when in multi-repo mode
- Strip `sortKey` before output
- Pass `isMultiRepo` to EJS template

- [ ] **Step 3: Verify build passes**

Run: `cd /Users/ABM/SideProjects/git-timelog && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Manual test — run in a single git repo**

Run: `cd /Users/ABM/SideProjects/git-timelog && node dist/index.js --json | head -20`
Expected: JSON output with `repo` field set to `"git-timelog"` on each entry

- [ ] **Step 5: Manual test — run in a parent directory with multiple repos**

Run: `cd /Users/ABM/SideProjects && node /Users/ABM/SideProjects/git-timelog/dist/index.js --json | head -40`
Expected: JSON output with entries from multiple repos, sorted by time, each with its repo name

- [ ] **Step 6: Commit**

```bash
git add src/commands/default.ts
git commit -m "feat: add multi-repo detection and aggregation"
```

---

## Chunk 2: HTML Report — CSS and Template Changes

### Task 3: Update CSS and EJS template with repo column and toggle

CSS and EJS changes must be applied atomically — committing CSS class-based selectors without updating the EJS template would break column widths. **Important:** preserve existing utility classes (`.time`, `.task-id`, `.description`) — only replace the `nth-child` width selectors.

**Files:**
- Modify: `public/styles.css`
- Modify: `public/report.ejs`

- [ ] **Step 1: Replace `nth-child` column selectors with class-based selectors in CSS**

In `public/styles.css`, replace the four `nth-child` rules (lines 76-90) with:

```css
.col-time {
    width: 80px;
}

.col-repo {
    width: 120px;
    font-family: monospace;
    font-weight: bold;
    color: var(--task-id-color);
}

.col-action {
    width: 100px;
}

.col-task-id {
    width: 120px;
}

.col-description {
    width: auto;
}
```

Keep the existing `.time`, `.task-id`, and `.description` utility class rules unchanged.

- [ ] **Step 2: Update toggle container CSS**

In `public/styles.css`, replace the `.theme-toggle-container` rule (lines 149-155) with:

```css
.toggles-container {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 20px;
}

.toggle-group {
    display: flex;
    align-items: center;
}
```

Replace `.theme-toggle-label` (lines 157-160) with:

```css
.toggle-label {
    margin-right: 10px;
    font-size: 14px;
}
```

- [ ] **Step 3: Add hidden-column utility class to CSS**

Add at the end of `public/styles.css`:

```css
.repo-hidden .col-repo {
    display: none;
}
```

- [ ] **Step 4: Update EJS script block with repo toggle logic**

In `public/report.ejs`, replace the entire `<script>` block in the `<head>` with:

```html
<script>
    document.addEventListener("DOMContentLoaded", () => {
        // Theme toggle
        const THEME_KEY = "git-timelog-theme";
        const themeToggle = document.getElementById("theme-toggle");

        const savedTheme = localStorage.getItem(THEME_KEY);
        const prefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;
        const isDarkTheme = savedTheme
            ? savedTheme === "dark"
            : prefersDark;

        if (isDarkTheme) {
            document.documentElement.setAttribute("data-theme", "dark");
            themeToggle.checked = true;
        }

        themeToggle.addEventListener("change", () => {
            if (themeToggle.checked) {
                document.documentElement.setAttribute(
                    "data-theme",
                    "dark"
                );
                localStorage.setItem(THEME_KEY, "dark");
            } else {
                document.documentElement.removeAttribute("data-theme");
                localStorage.setItem(THEME_KEY, "light");
            }
        });

        // Repo column toggle
        const REPO_KEY = "git-timelog-repo-column";
        const repoToggle = document.getElementById("repo-toggle");
        const isMultiRepo = <%= isMultiRepo %>;

        const savedRepo = localStorage.getItem(REPO_KEY);
        const showRepo = savedRepo !== null
            ? savedRepo === "visible"
            : isMultiRepo;

        if (!showRepo) {
            document.body.classList.add("repo-hidden");
        }
        repoToggle.checked = showRepo;

        repoToggle.addEventListener("change", () => {
            if (repoToggle.checked) {
                document.body.classList.remove("repo-hidden");
                localStorage.setItem(REPO_KEY, "visible");
            } else {
                document.body.classList.add("repo-hidden");
                localStorage.setItem(REPO_KEY, "hidden");
            }
        });
    });
</script>
```

- [ ] **Step 5: Replace toggle container HTML and add repo toggle**

In `public/report.ejs`, replace the existing `<div class="theme-toggle-container">...</div>` with:

```html
<div class="toggles-container">
    <div class="toggle-group">
        <span class="toggle-label">Show Repos</span>
        <label class="theme-toggle">
            <input type="checkbox" id="repo-toggle" />
            <span class="theme-toggle-slider"></span>
        </label>
    </div>
    <div class="toggle-group">
        <span class="toggle-label">Dark Mode</span>
        <label class="theme-toggle">
            <input type="checkbox" id="theme-toggle" />
            <span class="theme-toggle-slider"></span>
        </label>
    </div>
</div>
```

- [ ] **Step 6: Add Repo column to table header and rows**

Update the `<thead>` section (inside the `isNewDate` block):

```html
<thead>
    <tr>
        <th class="col-time">Time</th>
        <th class="col-repo">Repo</th>
        <th class="col-action">Action</th>
        <th class="col-task-id">Task ID</th>
        <th class="col-description">Description</th>
    </tr>
</thead>
```

Update the `<tr>` row in `<tbody>`:

```html
<tr>
    <td class="col-time time"><%= entry.time || 'N/A' %></td>
    <td class="col-repo"><%= entry.repo || '' %></td>
    <td class="col-action"><%= entry.action || 'N/A' %></td>
    <td class="col-task-id task-id"><%= entry.taskId || '' %></td>
    <td class="col-description description">
        <%= entry.description || 'N/A' %>
    </td>
</tr>
```

- [ ] **Step 7: Build and manually test**

Run: `cd /Users/ABM/SideProjects/git-timelog && npm run build`
Expected: Clean build

Run: `cd /Users/ABM/SideProjects/git-timelog && node dist/index.js`
Expected: Opens browser with report showing Repo toggle, column hidden by default (single repo)

Run: `cd /Users/ABM/SideProjects && node /Users/ABM/SideProjects/git-timelog/dist/index.js`
Expected: Opens browser with multi-repo report, Repo column visible by default

- [ ] **Step 8: Commit**

```bash
git add public/report.ejs public/styles.css
git commit -m "feat: repo column toggle in HTML report"
```

---

## Chunk 3: Final Polish and Verification

### Task 4: Final build, lint, and end-to-end verification

- [ ] **Step 1: Run TypeScript type check**

Run: `cd /Users/ABM/SideProjects/git-timelog && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run full build**

Run: `cd /Users/ABM/SideProjects/git-timelog && npm run build`
Expected: Clean build, no warnings

- [ ] **Step 3: Test single-repo JSON**

Run: `cd /Users/ABM/SideProjects/git-timelog && node dist/index.js --json | head -20`
Expected: JSON with `repo: "git-timelog"` on each entry

- [ ] **Step 4: Test multi-repo JSON**

Run: `cd /Users/ABM/SideProjects && node /Users/ABM/SideProjects/git-timelog/dist/index.js --json | head -40`
Expected: Entries from multiple repos, sorted chronologically, each with correct repo name

- [ ] **Step 5: Test single-repo web report**

Run: `cd /Users/ABM/SideProjects/git-timelog && node dist/index.js`
Expected: Report opens, repo toggle present, repo column hidden by default

- [ ] **Step 6: Test multi-repo web report**

Run: `cd /Users/ABM/SideProjects && node /Users/ABM/SideProjects/git-timelog/dist/index.js`
Expected: Report opens, repo toggle present, repo column visible by default

- [ ] **Step 7: Test error case — non-repo directory with no repo subdirs**

Run: `cd /tmp && node /Users/ABM/SideProjects/git-timelog/dist/index.js`
Expected: Error message "No git repositories found in this directory" and exit code 1
