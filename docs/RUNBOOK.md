# Demo-night runbook

Plain steps for running Wallet-Labeled Tape from Friday evening to judging. Every command goes in
**PowerShell**, typed one line at a time. Each step says which task has to be merged before it
works.

## The one rule

**One laptop, one backend, running the whole night.** The scored accounts live in a file on the
laptop that ran the backend (`server/data/tape.db`). If you start fresh on another machine, it
starts cold. So pick the demo laptop and keep it running.

## 1. Get the laptop ready (do this once, Friday evening)

1. Plug the laptop in.
2. Windows Settings > System > Power & battery > Screen, sleep & hibernate timeouts: set "When
   plugged in, put my device to sleep after" to **Never**. The screen can turn off; sleep cannot.
3. Turn off Windows Update restarts tonight: Settings > Windows Update > Pause updates for 1 week.
4. Stay on the venue WiFi (or your phone hotspot if the WiFi is bad).

## 2. Start the backend (after X05 is merged)

Open PowerShell and run:

```powershell
cd $HOME\Documents\wallet-labeled-tape
git switch main
git pull
npm install
npm run dev
```

Leave this window open all night. Closing it stops everything. Then open
http://localhost:5181 in the browser.

**Healthy looks like this** (top bar of the app):

| What | Healthy | If not |
|:-|:-|:-|
| Dot next to "Live" | Green | Amber "Reconciling" is fine for a minute. Red for more than 2 minutes: see section 6 |
| Accounts scored | Going up every minute | Stuck at 0 after 5 minutes: tell Claude |
| Queue | Up and down, under 500 | Always 500: normal when it is busy, the smallest accounts are skipped |
| REST budget | Under 85% | Over 95% for long: tell Claude |

Scoring is slow at first: roughly 600 to 1,800 accounts in the first hour.

## 3. Check 5 accounts (A08, about Fri 22:00)

1. In the app, click "Profitable only", then click an account address.
2. In the drawer, click **Open in Hyperliquid explorer**.
3. Check three things match:
   - **Position:** the drawer's "Current position" (Long or Short, which coin) matches the
     explorer's open positions.
   - **Activity:** an account tagged "Likely automated" has a wall of trades on the explorer.
   - **Size:** an account tagged "Large" has big position values on the explorer.
4. Do this for 5 accounts: 3 Profitable (30d), 1 Unprofitable (30d), 1 Large. Write down
   anything that does not match and send it to Claude.

## 4. Pick the tag settings (A09) and freeze the cohort (A10), about Fri 22:30

1. Claude sends you the tuning report with 2 or 3 options. Reply with the one you pick; Claude
   puts it in `server/src/config.ts`. The backend restarts by itself and keeps its data.
2. Wait 10 minutes for the new tags to settle.
3. Open a **second** PowerShell window (leave the first one running) and run:

```powershell
cd $HOME\Documents\wallet-labeled-tape
npm run freeze
```

4. It prints a file name like `cohorts/2026-11-06T22-30.json`, the count of accounts per tag
   and a long code (the sha256). Copy that whole output to Claude.
5. Publish it so the freeze time is public. In the same second window:

```powershell
git status
git add cohorts
git commit -m "Freeze forward-test cohort"
git push
```

`git status` must say "On branch main" first. If it names any other branch, stop and tell Claude
(Codex may be using the folder).

From this moment the forward test is running. Do not run `npm run freeze` again.

## 5. Forward-test result (after X07 is merged, Sat about 06:00)

In the second PowerShell window:

```powershell
npm run forward-test
```

It prints a table. Send it to Claude: it goes on the card in the app and in the README. Then you
pick which horizon leads the pitch (A11): 15 minutes, 1 hour or 4 hours.

## 6. When something goes wrong

| What you see | What to do |
|:-|:-|
| Red dot for more than 2 minutes, but internet works | Nothing; it reconnects by itself and backfills the gap |
| Venue WiFi is down | In the backend window press Ctrl+C, then `npm run dev:replay` (needs X04 and a recording, section 7). It plays real trades from earlier through the same app |
| WiFi is back | Ctrl+C, then `npm run dev` |
| "Port 8787 is already taken" | Another copy is running. Close the other PowerShell window or Claude preview, then `npm run dev` again |
| The backend window closed or the laptop restarted | Run section 2 again. Scored accounts are kept in the file, so it starts warm |
| Browser shows "Backend not running" | The backend window was closed: run section 2 again |
| Anything else | Copy the last 20 lines of the backend window to Claude |

Never delete the `server\data` folder: that is the whole night's scoring.

## 7. Record the WiFi backup (A07, after X04 is merged, while WiFi is good)

In the second PowerShell window:

```powershell
npm run replay:record
```

It records 2 minutes of real trades and prints where it saved them. Nothing to commit: the
recording stays on this laptop, which is the one that needs it.

## Timeline

| When (IST) | You | Needs |
|:-|:-|:-|
| Fri ~20:30 | Sections 1 and 2: laptop ready, backend running | X05 merged |
| Fri ~22:00 | Section 3: check 5 accounts | 1.5 h of scoring |
| Fri ~22:30 | Section 4: pick settings, freeze, push | Claude's tuning report |
| Sat ~01:00 | Section 7: record the WiFi backup | X04 merged |
| Sat ~06:00 | Section 5: forward-test result | X07 merged |
| Sat 07:00 | Record the backup demo video | Claude's demo script |
| Sat 08:30 | Submit on the ETHGlobal dashboard | Video |
| Sat 09:30 | Judging. Backend still running | |
