# GitHub Desktop and Cloudflare

**New account setup and requested free Pages address:** follow [ACCOUNT-SETUP.md](ACCOUNT-SETUP.md). For Pages use `pnpm run build:pages`, output `release/pages`, and project name `dcg-my-elections-texas` if available. `wrangler.jsonc` is now the Pages configuration; the original Worker configuration is preserved in `wrangler.worker.jsonc`.

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

For the original Worker, `pnpm run deploy` uploads `public` and deploys `worker.mjs` using `wrangler.worker.jsonc`. Open the resulting `workers.dev` URL and verify race selection. If using Cloudflare Git integration, disable the supplied GitHub deployment workflow to avoid duplicate deployments.

### GitHub Actions

The supplied `.github/workflows/deploy.yml` validates pull requests and deploys pushes to `main`. Configure the repository's GitHub Actions secrets:

- `CLOUDFLARE_ACCOUNT_ID`: your Cloudflare account ID.
- `CLOUDFLARE_API_TOKEN`: a token authorized to edit Workers scripts and the static assets deployment for this account, following Cloudflare's current documentation. Store it only in GitHub secrets.

Run the **Validate and deploy** workflow. It uses pinned Wrangler dependencies and a frozen lockfile, checks JavaScript, runs Worker routing tests, and checks the deployment bundle before publishing.

## Local preview

With Node.js 24 or later, run `node --use-system-ca server.mjs`, then visit `http://127.0.0.1:3000`. For Cloudflare runtime preview, install the locked dependencies with pnpm and run `pnpm dev`.

## Current data limits

The site imports Texas official candidate counts and partial national U.S. Senate counts from official state election offices via Open America. Dashboard cards show candidate names, party colors, and counts directly. Forecast ranges and source comparisons are supported by the view model, but no forecast or newsroom-call provider is connected. Cameron County local candidate counts are not connected. See RESULTS-DATA.md for coverage and reporting-unit details. Missing data is never presented as zero or an inferred winner.

Without public Supabase configuration, watchlists remain browser-only and the UI states that accounts are still being set up. Once configured, authenticated watchlists sync through the private `dashboard_races` table. Follow ACCOUNT-SETUP.md before advertising account signup as live.
