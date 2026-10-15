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

### 2. Supabase (the trip password and syncing)
1. Create a free project at supabase.com.
2. **Authentication → Sign In / Providers**: turn **off** "Allow new users to sign up". Leave Email enabled.
3. **Authentication → Users → Add user → Create new user**: enter a shared email (any address you control) and the trip password you want. Tick **Auto Confirm User**.
4. **SQL Editor**: paste `supabase/schema.sql`, change the email at the bottom to that shared email, and run it.
5. **Project Settings → API**: copy the Project URL and the `anon` public key. Put them, plus the shared email, in `config.js`. The anon key is designed to be public; only someone signed in with the trip password can read or change data.

To lock everyone out, change the password under Authentication → Users. Everyone has to enter the new one.

### 3. Install on each iPhone
1. Open the GitHub Pages address in **Safari**.
2. Tap **Share → Add to Home Screen**.
3. Open it from the home screen and enter the trip password. It stays signed in, including offline.
4. Open Map view once while online so it's saved for offline use.

## How offline works
- Everything you see (guides, map, flight counts) is saved on the phone after the first visit.
- Ratings, notes and your counts save on the phone instantly. When you're online and signed in, they sync. If you both edit the same thing, the most recent edit wins.
- Flight counts update when the app opens online; offline you see the last saved copy and its date.

## Notes on the flight counts
Counts come from FlightsFrom.com's published schedules, read once a day. If that site changes its layout or blocks the refresh, the job stops updating and keeps the last good data instead of wiping it. Check southwest.com for exact flights before going standby.
