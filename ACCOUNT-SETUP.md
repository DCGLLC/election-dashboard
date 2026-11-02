# Turn on accounts and the new free address

The requested production address is **https://dcg-my-elections-texas.pages.dev**. Cloudflare must accept that project name before the address exists. `dcg-my-elections.texas.pages.dev` is not the normal production hostname format; the project name goes directly before `.pages.dev`.

## 1. Create the Supabase project

1. Open [Supabase](https://supabase.com/dashboard) and create a project on the Free plan. Name it **DCG My Elections**. Choose a database password and save it privately; the website does not need that password.
2. Wait until the project is ready. Open **SQL Editor → New query**.
3. Open [supabase/setup.sql](supabase/setup.sql), copy its full contents into the editor, and click **Run**. This creates the private saved-race table and ownership rules.
4. Open **Authentication → Sign In / Providers → Email** (some dashboard versions label this **Providers**). Enable email/password signup and turn **Confirm email** off. This permits immediate signup with email and password. Leave MFA enrollment and phone login unused; this website does not request them.
5. Under **Authentication → URL Configuration**, set **Site URL** to the actual Pages address after Cloudflare accepts it. Add that address with a trailing `/` to **Redirect URLs**. While the old site is in use, also allow `https://election-dashboard.day-todd.workers.dev/`. Local testing can use `http://localhost:3000/` and `http://127.0.0.1:3000/`.
6. In **Connect** or **Settings → API Keys**, copy the **Project URL** and the **Publishable key** beginning with `sb_publishable_`. Send those two public values to Codex to finish [public/account-config.js](public/account-config.js). Do not send a database password, secret key or `service_role` key.

Only email and password are requested by the website. No profile form, SMS challenge or MFA setup is required. Password reset is available in the UI; sending reset emails to public users requires a production email/SMTP provider configured in Supabase. Supabase's default email service has delivery restrictions. This does not prevent direct password signup/login when email confirmation is off.

## 2. Commit and publish the Pages version

After the public Supabase configuration has been filled in:

1. In GitHub Desktop, commit the changes with **Add accounts and synced election dashboards**, then **Push origin**.
2. In [Cloudflare Workers & Pages](https://dash.cloudflare.com/), create a **Pages** application, choose **Connect to Git**, and select the existing **DCGLLC/election-dashboard** repository.
3. Use project name **dcg-my-elections-texas**, production branch **main**, framework **None**, and repository root `/`.
4. Set **Build command** to `pnpm run build:pages` and **Build output directory** to `release/pages`. A Pages project does not need a separate deploy command.
5. Save and deploy. If the name is taken, choose a close available project name and give Codex the actual address so `wrangler.jsonc` and the Supabase URL settings can match it.
6. Finish the Site URL and Redirect URL settings in Supabase from step 1, then test the new address.

This is a new Pages application connected to the same repository. Renaming the existing Worker alone does not remove the account's `day-todd.workers.dev` suffix. The original Worker deployment remains supported by `wrangler.worker.jsonc` and `pnpm run deploy`; no existing site was deleted or redirected.

## 3. Use one dashboard on desktop and phone

1. On the desktop site, choose **Create account** and enter email/password.
2. If you already selected races before accounts existed, click **Add them to my account** in the dashboard notice. This explicitly imports that device's saved selections without overwriting anything already in the account.
3. On the phone, open the same new address and **Sign in** with that same account. Its saved races will load.
4. Add or remove a race on either device. The other device reloads the account dashboard when opened or focused and checks every 15 seconds while visible. **Refresh** also checks immediately.

Switching from the old address to the new one requires signing in again because browser sessions are tied to the site address. To preserve old browser-only selections, import them into the account on the old address first, or add the desired races after signing in at the new address. Account data itself is shared through the same Supabase project.

## Implementation and verification

- `dashboard_races` stores one `(user_id, race_id)` membership per selection. Concurrent additions on different devices do not replace each other's whole lists.
- Row-level security and explicit grants allow authenticated users to select, insert and delete only their own rows. No public read or update permission is granted. No privileged database function or secret browser key is used.
- Offline operations are retained per account on the current device and replayed. Cached lists and pending changes are isolated by account; sign-out clears the visible dashboard.
- Polling/news details open at the top, with **Polls & news** and **Official results** navigation. Missing news coverage is stated explicitly. Verified coverage remains partial as described in [NEWS-DATA.md](NEWS-DATA.md).
- Tests exercise actual Postgres ownership policies in PGlite with two test identities, concurrent device changes, offline retries, account switching, and stale responses. Browser signup, sign-in and two-session sync were checked against a local test service. Both the Pages bundle and the original Worker build were validated.
- **Supabase connected:** the supplied project URL and publishable key are configured. Live checks confirmed email signup enabled, email autoconfirm enabled, and anonymous reads rejected on the existing saved-race table. No secret key is stored. Hosted sign-in and two-device verification remain pending deployment and the user's first account. The Pages name has not been reserved or deployed.

References: [Supabase password accounts](https://supabase.com/docs/guides/auth/passwords), [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security), [default email restrictions](https://supabase.com/docs/guides/auth/auth-smtp), [Cloudflare static Pages deployment](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/), [Pages advanced Worker mode](https://developers.cloudflare.com/pages/functions/advanced-mode/).
