
### 1. Link the Remote

This tells your main project where the standalone dashboard repo lives.

```bash
git remote add vercel-remote https://github.com/AdarshMukherjee21/Trust-Issues-web.git

```

### 2. The First Push

This will take the contents of `trust-issues-dash` and push them as the "root" of your web repo.

```bash
git subtree push --prefix=trust-issues-dash vercel-remote main

```

### 3. Set the Shortcut (Highly Recommended)

Since you'll be working on this for your semester project, run this once to create a shortcut. It saves you from typing that long prefix command every time.

```bash
git config alias.deploy-dash "!git subtree push --prefix=trust-issues-dash vercel-remote main"

```

---

### Your New Workflow

Whenever you make changes to the dashboard:

1. **For your Professor (Update main repo):**
```bash
git add .
git commit -m "Updated trust issues dashboard"
git push origin main

```


2. **For Vercel (Update live site):**
```bash
git deploy-dash

```



---

### Troubleshooting Note

If you get an error saying `Finished recusing...` but nothing happens on the first push, it might be because the histories are unrelated. In that rare case, you can "force" the first push like this:
`git push vercel-remote $(git subtree split --prefix=trust-issues-dash main):main --force` (Only use this for the **first** time if the standard push fails!)

**Now that the repo is ready, would you like me to help you configure the Vercel Build Settings to make sure it handles your folder structure correctly?**