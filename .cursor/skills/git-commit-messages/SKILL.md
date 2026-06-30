---
name: git-commit-messages
description: >-
  Write git commit messages using Chris Beams' seven rules (50-char subject,
  72-char body, imperative mood, why not how). Use when creating commits,
  drafting or amending commit messages, or when the user asks how to phrase
  a commit.
---

# Git commit messages

Follow [How to Write a Git Commit Message](https://cbea.ms/git-commit/) (Chris
Beams). Kudoro does not use Conventional Commits prefixes (`feat:`, `fix:`)
unless the user explicitly asks for them.

When the user requests a commit, read `git diff` and recent `git log`, then
draft the message before running `git commit`. Use a HEREDOC for the message
(per project git safety rules).

## The seven rules

1. Separate subject from body with a blank line
2. Limit the subject line to 50 characters
3. Capitalize the subject line
4. Do not end the subject line with a period
5. Use the imperative mood in the subject line
6. Wrap the body at 72 characters
7. Use the body to explain what and why vs. how

**Imperative test:** the subject should complete: “If applied, this commit
will \_\_\_” (e.g. “Refactor subsystem X for readability”, not “Fixed bug” or
“Fixes bug”).

Simple one-line commits are fine when the change needs no extra context
(e.g. typo fixes). Use a body when the change needs context.

## Template

```
Summarize changes in around 50 characters or less

More detailed explanatory text, if necessary. Wrap it to about 72
characters or so. In some contexts, the first line is treated as the
subject of the commit and the rest of the text as the body. The
blank line separating the summary from the body is critical (unless
you omit the body entirely); various tools like `log`, `shortlog`
and `rebase` can get confused if you run the two together.

Explain the problem that this commit is solving. Focus on why you
are making this change as opposed to how (the code explains that).
Are there side effects or other unintuitive consequences of this
change? Here's the place to explain them.

Further paragraphs come after blank lines.

 - Bullet points are okay, too

 - Typically a hyphen or asterisk is used for the bullet, preceded
   by a single space, with blank lines in between, but conventions
   vary here

If you use an issue tracker, put references to them at the bottom,
like this:

Resolves: #123
See also: #456, #789
```

## Kudoro examples

**Good:**

```
Unify linear timeline for summary export

Animated map and elevation used different progress mappings than
capture steps, so motion bunched at the end of the clip. Export,
preview, and spatial stickers now share one linear progress helper.
Metric crawl easing is unchanged.
```

**Avoid:**

```
feat(skia): implement summaryExportProgress01 and update map sticker
```

```
Fixed animation stuff
```

```
- added helpers
- updated elevation
```

## Checklist before committing

- [ ] Subject ≤ 50 characters, capitalized, no trailing period, imperative
- [ ] Blank line before body (if any body)
- [ ] Body wrapped ~72 characters; explains why and side effects, not file list
- [ ] Issue refs at bottom only (if applicable)
