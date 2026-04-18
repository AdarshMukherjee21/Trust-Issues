

### Step 1: Create the Alias (Run this once)
Open your terminal at the absolute root of your monorepo and run these commands. (Make sure you have already created the empty `Trust-Issues-backend` repo on GitHub and copied its URL).

```bash
# 1. Add the remote for Railway
git remote add railway-remote https://github.com/yourusername/Trust-Issues-backend.git

# 2. Create the shortcut alias (Notice the forward slash!)
git config alias.deploy-api "!git subtree push --prefix=Transformer/api railway-remote main"
```

---

### Step 2: Your Custom `GIT_SETUP.md` Update
Here is the exact troubleshooting and command block tailored for your specific folder structure. Update your master `GIT_SETUP.md` with this so you never have to memorize it:

```markdown
## 🚀 Daily Workflow

### 1. Update Everything (Main Repo)
Use this whenever you make changes to *any* part of the project.
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

### 2. Update the Live Dashboard (Vercel)
```bash
git deploy-dash
```

### 3. Update the Live ML API (Railway)
Syncs just the `Transformer/api` folder to the Railway repo.
```bash
git deploy-api
```

---

## ⚠️ Troubleshooting: The "Nested Git" Issue

If the API folder stops syncing or appears as an empty "grey folder" on GitHub, a hidden `.git` folder was accidentally created inside it.

**The Fix for the API folder:**
1. **Delete the inner Git brain:** `rm -rf Transformer/api/.git`
2. **Clear the cache:** `git rm -r --cached Transformer/api`
3. **Re-add:** `git add Transformer/api`
4. **Commit & Push:** `git commit -m "Fix nested git in API" && git push origin main`

---

## 📜 Key Commands Used

| Goal | Command |
| --- | --- |
| **Add Railway Remote** | `git remote add railway-remote <url>` |
| **Push API to Railway**| `git subtree push --prefix=Transformer/api railway-remote main` |
