# Thrive Head Start Knowledge Portal

Public website for the [headstart-synthesis](https://github.com/thrive-incubator/headstart-synthesis)
knowledge vault, rendered with [Quartz 5](https://quartz.jzhao.xyz) and hosted on Firebase
Hosting.

The vault repo stays untouched: on every build, CI checks out `thrive-incubator/headstart-synthesis`
and builds the site directly from its `vault/` directory (`npx quartz build -d headstart-synthesis/vault`).
The `content/` folder in this repo is intentionally empty and gitignored — nothing content-related
lives here, only site machinery.

## How it deploys

[.github/workflows/deploy.yaml](.github/workflows/deploy.yaml) runs on:

- push to `main` (site machinery changes)
- a daily schedule at 06:00 UTC (picks up vault changes; digests land weekly)
- manual `workflow_dispatch`
- `repository_dispatch` with type `vault-updated` (optional instant-rebuild hook, see below)

It installs dependencies, runs `npx quartz plugin install --from-config`, builds from the vault
checkout, and deploys `public/` to Firebase Hosting (`cleanUrls: true` in
[firebase.json](firebase.json) so Quartz's extensionless links resolve).

### Required repo settings

- **Variable** `FIREBASE_PROJECT_ID` — the Firebase project ID
- **Secret** `FIREBASE_SERVICE_ACCOUNT` — a Firebase Hosting service-account JSON key
  (`firebase init hosting:github` can generate one, or create it in the Firebase console)

Also set `baseUrl` in [quartz.config.yaml](quartz.config.yaml) to the deployed domain
(`<project-id>.web.app` or the custom domain) so RSS/sitemap URLs are correct.

### Optional: instant rebuilds from the vault repo

Add this workflow to `thrive-incubator/headstart-synthesis` (needs a `SITE_DISPATCH_TOKEN` secret —
a fine-grained PAT with Contents read/write on this repo):

```yaml
name: Trigger site rebuild
on:
  push:
    branches: [main]
    paths: ["vault/**"]
jobs:
  dispatch:
    runs-on: ubuntu-latest
    steps:
      - run: |
          gh api repos/Spacetimeee/thrive-knowledge-portal-headstart/dispatches \
            -f event_type=vault-updated
        env:
          GH_TOKEN: ${{ secrets.SITE_DISPATCH_TOKEN }}
```

## Local development

```sh
npm i
npx quartz plugin install --from-config
git clone --depth 1 https://github.com/thrive-incubator/headstart-synthesis.git
npx quartz build -d headstart-synthesis/vault --serve
```

## Updating Quartz

This repo is a normal repo (not a GitHub fork) based on Quartz's `v5` branch, with
`jackyzha0/quartz` as the `upstream` remote:

```sh
git fetch upstream
git merge upstream/v5
npx quartz plugin install --from-config
```

Upstream's own workflows (`ci.yaml`, `deploy-v5.yaml`, …) are kept as-is; they are guarded by
`if: github.repository == 'jackyzha0/quartz'` and never run here.

## Site configuration

Everything lives in [quartz.config.yaml](quartz.config.yaml). Notable deltas from Quartz's
default config:

- `ignorePatterns` excludes `**/_template.md` (vault scaffolding) and `.obsidian`
- `analytics: null` (flip to Google Analytics by setting a `gtag` provider if wanted)
- `cname` plugin disabled (GitHub Pages-only)
- `latex` plugin disabled, and [quartz.ts](quartz.ts) adds an `EscapeDollarAmounts`
  transformer: the obsidian-flavored-markdown plugin unconditionally parses `$...$` as
  inline math, which mangles paragraphs containing two dollar amounts (`$1B … $61M`).
  The transformer escapes `$` before digits pre-parse; the vault contains no real math.
- footer links to the vault source repo
