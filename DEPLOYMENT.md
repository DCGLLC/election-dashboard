# GitHub Desktop and Cloudflare

## Add the existing project in GitHub Desktop

1. Choose **File → Add Local Repository**.
2. Select `C:\Users\Todd\Documents\Codex\election-dashboard`.
3. If Desktop says this directory is not a Git repository, choose **create a repository here**. Use name `election-dashboard` and local path `C:\Users\Todd\Documents\Codex` so the final repository path is the existing project folder. Do not create a nested folder.
4. Review Changes. `node_modules`, `.wrangler`, and secret files should be excluded. Commit any pending project files with summary `Build Valley Vote election dashboard`.
5. Use branch `main` for the supplied deployment workflow.
6. Click **Publish repository**. Keep the repository private if desired; a private source repository can deploy a public website.

## Publish on Cloudflare

Use one deployment path:

### Cloudflare Git integration

In Cloudflare Workers & Pages, create a Worker by importing the GitHub repository. Select `main`, the repository root, and use:

- Build command: `pnpm install --frozen-lockfile && pnpm run check`
- Deploy command: `pnpm run deploy`

Cloudflare will upload `public` and deploy `worker.mjs` using `wrangler.jsonc`. Open the resulting `workers.dev` URL and verify the source desk and race selection. If using Cloudflare Git integration, disable the supplied GitHub deployment workflow to avoid duplicate deployments.

### GitHub Actions

The supplied `.github/workflows/deploy.yml` validates pull requests and deploys pushes to `main`. Configure the repository's GitHub Actions secrets:

- `CLOUDFLARE_ACCOUNT_ID`: your Cloudflare account ID.
- `CLOUDFLARE_API_TOKEN`: a token authorized to edit Workers scripts and the static assets deployment for this account, following Cloudflare's current documentation. Store it only in GitHub secrets.

Run the **Validate and deploy** workflow. It uses pinned Wrangler dependencies and a frozen lockfile, checks JavaScript, runs Worker routing tests, and checks the deployment bundle before publishing.

## Local preview

With Node.js 24 or later, run `node --use-system-ca server.mjs`, then visit `http://127.0.0.1:3000`. For Cloudflare runtime preview, install the locked dependencies with pnpm and run `pnpm dev`.

## Current data limits

The site automatically retrieves election-related links from the official county, official state, KRGV, and ValleyCentral pages. It does not import candidate vote totals or make race calls. Links may include older elections. County and district-wide results must not be combined without a proper race-level data adapter.

Watchlists are stored on the user's device. Supabase is not required for this deployment. Add authenticated accounts and ownership policies if cross-device sync is introduced later.
