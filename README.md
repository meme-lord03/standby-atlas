# AUS Standby Atlas (home-screen app)

Every Southwest nonstop from Austin with things to do, places to eat, facts, flight times, daily flight counts, ratings and notes. Install it on your iPhone's home screen and it works offline.

## What's in here

| Path | What it does |
| --- | --- |
| `index.html` | The whole app |
| `sw.js` | Saves the app, map and fonts on the phone so it opens offline |
| `manifest.webmanifest`, `icons/` | Home-screen name and icon |
| `config.js` | Your Supabase project address and public key (for syncing) |
| `data/schedule.json` | Southwest flight counts per route, refreshed daily |
| `scripts/update-schedule.mjs` | Reads the latest counts |
| `.github/workflows/update-schedule.yml` | Runs that script every morning and saves changes |
| `supabase/schema.sql` | Database setup for syncing between your phones |

## One-time setup

### 1. GitHub Pages (hosting)
1. Push this folder to a GitHub repo.
2. Repo **Settings → Pages**: Source **Deploy from a branch**, branch **main**, folder **/ (root)**. Save.
3. Your app address will be `https://<your-username>.github.io/<repo-name>/`.
4. Repo **Settings → Actions → General → Workflow permissions**: choose **Read and write permissions** so the daily refresh can save new counts.
5. **Actions** tab → **Refresh flight counts** → **Run workflow** once to test it.

### 2. Supabase (sync between phones)
1. Create a free project at supabase.com.
2. **SQL Editor**: paste `supabase/schema.sql`, change the two emails at the bottom, and run it.
3. **Authentication → Email Templates → Magic Link**: make sure the email includes the code. Put `{{ .Token }}` in the template body, for example: `Your Standby Atlas code is {{ .Token }}`. The app signs in with this 6-digit code, because iPhone home-screen apps can't receive magic links.
4. **Authentication → URL Configuration**: set Site URL to your GitHub Pages address.
5. **Project Settings → API**: copy the Project URL and the `anon` public key into `config.js`. The anon key is designed to be public; the database rules only let your two emails read or write.

### 3. Install on each iPhone
1. Open the GitHub Pages address in **Safari**.
2. Tap **Share → Add to Home Screen**.
3. Open it from the home screen, tap the sync button (top right), enter your email and the code you receive.
4. Open Map view once while online so it's saved for offline use.

## How offline works
- Everything you see (guides, map, flight counts) is saved on the phone after the first visit.
- Ratings, notes and your counts save on the phone instantly. When you're online and signed in, they sync. If you both edit the same thing, the most recent edit wins.
- Flight counts update when the app opens online; offline you see the last saved copy and its date.

## Notes on the flight counts
Counts come from FlightsFrom.com's published schedules, read once a day. If that site changes its layout or blocks the refresh, the job stops updating and keeps the last good data instead of wiping it. Check southwest.com for exact flights before going standby.
