
### Part 1: Setting up the Alias

Since you'll be updating your dashboard frequently for **Trust Issues**, this shortcut allows you to push to Vercel with one short command.

Run this in your terminal:

```bash
git config alias.deploy-dash "!git subtree push --prefix=trust-issues-dash vercel-remote main"

```

**How to use it:**

* To update your professor: `git push origin main`
* To update Vercel: `git deploy-dash`

---

### Part 2: Your `GIT_SETUP.md` Reference

Copy the content below into a new file named `GIT_SETUP.md` in your project root. This explains exactly what we did and how to fix things if they break again.

---

# 🛠 Trust Issues - Git Architecture Reference

## The Setup

This project uses a **Subtree** architecture. This allows us to keep the entire project (Mobile, AI, and Dashboard) in one "Monorepo" for college submissions, while syncing only the `trust-issues-dash` folder to a separate GitHub repo for **Vercel** hosting.

### Remotes

* `origin`: Points to the main project repo (The one for the Professor).
* `vercel-remote`: Points to `Trust-Issues-web.git` (The one for Vercel).

---

## 🚀 Daily Workflow

### 1. Update Everything (Main Repo)

Use this whenever you make changes to any part of the project (AI, Mobile, or Web).

```bash
git add .
git commit -m "Your commit message"
git push origin main

```

### 2. Update the Live Site (Vercel)

Use the shortcut we created to sync just the dashboard folder.

```bash
git deploy-dash

```

---

## ⚠️ Troubleshooting: The "Nested Git" Issue

If the dashboard stops syncing or appears as an empty "grey folder" on GitHub, it means a hidden `.git` folder was accidentally created inside `trust-issues-dash`.

**The Fix:**

1. **Delete the inner Git brain:** `rm -rf trust-issues-dash/.git`
2. **Clear the cache:** `git rm -r --cached trust-issues-dash`
3. **Re-add:** `git add trust-issues-dash`
4. **Commit & Push:** `git commit -m "Fix nested git" && git push origin main`

---

## 📜 Key Commands Used

| Goal | Command |
| --- | --- |
| **Add Vercel Remote** | `git remote add vercel-remote <url>` |
| **Push Folder to Web** | `git subtree push --prefix=trust-issues-dash vercel-remote main` |
| **Check Remotes** | `git remote -v` |

---

### One final tip for Vercel:

When you link the `Trust-Issues-web` repo in the Vercel dashboard, make sure the **Framework Preset** is set correctly (e.g., Next.js or Vite). Since the subtree push puts your dashboard files at the *root* of the new repo, you won't need to change any "Root Directory" settings in Vercel!

