# Demo-night runbook

Plain steps for running Wallet-Labeled Tape from Friday night to judging. Every command goes in
**PowerShell**, typed one line at a time.

## The one rule

**One laptop, one backend, running the whole night.** Scored accounts live in a file on the
laptop that ran the backend (`server/data/tape.db`). The longer it runs, the more accounts have
tags on stage. Start it as early as you can.

## 1. Get the laptop ready

1. Plug the laptop in.
2. Windows Settings > System > Power & battery > Screen, sleep & hibernate timeouts: set "When
   plugged in, put my device to sleep after" to **Never**. The screen can turn off; sleep cannot.
3. Settings > Windows Update > Pause updates for 1 week, so it does not restart overnight.

## 2. Start the backend and leave it running

```powershell
cd $HOME\Documents\wallet-labeled-tape
git switch main
git pull
npm install
npm run dev
```

Leave this window open all night: closing it stops scoring. Open http://localhost:5181.

**Healthy looks like this** (top bar):

| What | Healthy | If not |
|:-|:-|:-|
| Dot next to "Live" | Green | Red for more than 2 minutes: see section 4 |
| Accounts scored | Going up | Stuck for 10 minutes: copy the backend window to Claude |
| REST budget | Under 95% | Sitting high is fine: the rate limit is being used fully |

## 3. Check 5 accounts (before you record the video)

1. Click an address that has tags. In the drawer click **Open in Hyperliquid explorer**.
2. Check that the drawer's "Current position" (coin, Long or Short) matches the open positions on
   the explorer, and that a "Likely automated" account has a wall of trades there.
3. Do 5 accounts. Send anything that does not match to Claude.

## 4. When something goes wrong

| What you see | What to do |
|:-|:-|
| Red dot for over 2 minutes, internet works | Nothing; it reconnects by itself |
| "Port 8787 is already taken" | Another copy is running. Close the other window, then `npm run dev` |
| Backend window closed or laptop restarted | Run section 2 again. Scored accounts reload from the file |
| Browser says "Backend not running" | The backend window was closed: run section 2 again |
| Anything else | Copy the last 20 lines of the backend window to Claude |

Never delete the `server\data` folder: that is the whole night's scoring.

## Timeline

| When (IST) | What |
|:-|:-|
| Fri night | Sections 1 and 2: backend running all night |
| Sat ~06:30 | Section 3: check 5 accounts |
| Sat ~07:00 | Record the backup demo video (`docs/DEMO.md`) |
| Sat ~08:00 | Write the "Not built by AI" section of `AI_USAGE.md` |
| Sat 08:30 | Submit on the ETHGlobal dashboard |
| Sat 09:30 | Judging. Backend still running |
