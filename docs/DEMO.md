# 3-minute demo script (draft)

Updated Fri 11-06 22:40 IST for the basic build. Numbers in [brackets] come from the live app on
Saturday morning. Aarit
presents; say it in your own words, these are the beats.

## Before you start

- Backend has been running on this laptop since Friday evening (`docs/RUNBOOK.md`).
- Browser full screen at http://localhost:5181, coin tab on "All", no filters on.
- Pick one Profitable (30d) account in advance whose drawer looks good (Large, 30 days covered,
  a decent sample). Write its first 6 characters on a sticky note.
- If the WiFi is bad, use your phone hotspot. There is no offline replay in this build.

## The script

| Time | Beat | Say | Do |
|:-|:-|:-|:-|
| 0:00 | Hook | "Every order flow tool shows you what traded. Ours shows you which accounts traded, and whether they just opened or closed." | Tape scrolling, nothing clicked yet |
| 0:20 | The tape | "Every row is a real Hyperliquid trade, live. Both sides are named: the buyer's account and the seller's. Each one carries tags: profitable over 30 days or not, large, likely a bot. And this chip says what the trade did to their position." | Point at one row: both addresses, a tag, an open or close chip |
| 0:40 | Cut the noise | "Most of this is noise. Watch." | Click **Profitable only**, then **Hide closes**, drag **Min size** to $50k. "Now it is only accounts that made money over the last month, opening or adding, in size." |
| 1:00 | The account | "Click one." | Open the sticky-note account. "Net PnL after fees [+$X], max drawdown [Y%], [N] closed positions, history covers [30] days. Every tag shows its sample size, so you can judge it yourself." Point at the honest-scope note at the bottom |
| 1:40 | The flow | "Now zoom out." | Point at the left panel. "[12] profitable accounts raised [BTC] long exposure in the last 15 minutes, [4] cut it. That counts accounts, not dollars, so one whale cannot fake it. Coverage [68%]." |
| 2:10 | Honest by design | "We are careful with labels. Every tag shows its sample size and how many days it covers. Bots get 'Likely automated', and accounts with too little history get no performance tag at all." | Point at an "Insufficient history" chip and a "Likely automated" chip |
| 2:40 | Why on-chain, close | "Binance cannot show you any of this: their prints are anonymous. Hyperliquid publishes both wallets on every trade, for free. We built it for zero rupees. Next: a forward test that checks whether the Profitable tag predicts anything, then alerts." | Back to the tape |

## If a judge asks

| Question | Answer |
|:-|:-|
| "Does the Profitable tag predict anything?" | Not proven yet. The tag describes the past 30 days only. The next step is a forward test: freeze who is tagged, then measure their later trades after delay and fees against random accounts. The design is in `docs/ARCHITECTURE.md` |
| "Couldn't one person run many wallets?" | Yes. Tags describe one Hyperliquid account, not a person, and the drawer says so |
| "How do you stay under the rate limit?" | A weight budget at 1,000 of the 1,200 per minute, biggest trades scored first, bots stopped after one page |
| "Is this advice?" | No. The footer says it on every screen |
| "What did AI build?" | `AI_USAGE.md` logs every file. Aarit owned the product, the calls and the release gate: see `TASKS.md` |
