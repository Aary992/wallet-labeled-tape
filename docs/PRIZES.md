# Partner prizes: shortlist for Aarit (A03)

Source: the ETHGlobal Mumbai prizes page (read Fri 11-06 16:45 IST). We are on the From Scratch
track, so "Continuity only" prizes do not apply. Up to 3 partner prizes. **Aarit decides**; this
page only lays out the fit. ETHGlobal may drop AI-only projects from partner prizes, so the
`TASKS.md` record of Aarit's own work matters here too.

## Recommended

| # | Prize | Pot (1st) | Why it fits | What it costs us |
|:-|:-|:-|:-|:-|
| 1 | **Arkiv: Build on Arkiv (from scratch)** | $4,000 ($3,000) | The forward test's whole point is "this cohort was fixed before the results". Publishing the frozen cohort and the results as Arkiv entities makes that public and queryable by anyone, and the forward-test card reads it back from Arkiv. A real reason for Arkiv, not a sticker | One Codex task (write cohort and results to Arkiv testnet, read them back), a small UI change, and Arkiv's files: `/arkiv/schema.md`, `/arkiv/friction.md`, one judging file per criterion. Aarit makes a testnet wallet and gets test funds |
| 2 | **Hedera: "No Solidity Allowed" (SDKs)** | $2,000 ($1,000 x 2) | Same proof idea on a second chain: post the cohort's sha256 to a Consensus Service topic at freeze (timestamped by Hedera) and store the cohort file in the File Service. TypeScript SDK, no contracts, which matches our stack | One Codex task, a README section with transaction IDs, a demo of 5 minutes or less. Aarit makes a Hedera testnet account in the Hedera portal |
| 3 | **Ethereum Foundation: Best CROPS App** | $3,500 ($2,000) | The app is open source, runs locally, has no accounts and no trackers, and anyone can re-run the forward test from the repo. "Open source" and verifiability can be the lead property | Mostly paperwork: a README section titled CROPS covering each letter, a demo of 3 minutes or less. Weakest fit of the three: judges may see the property as not central enough |

## Considered and left out

| Prize | Why not |
|:-|:-|
| ENS: Best Use of ENSv2 | Must be central, "not cosmetic". Names next to addresses is cosmetic, and most Hyperliquid accounts have no ENS name |
| 0G Private Computer | Wants AI in the main flow where removing it breaks the app. Our only AI idea is the optional narrator (S1) |
| Chainlink CRE workflow ($1,500) | Possible (a workflow that reads Hyperliquid and writes the cohort hash on-chain, simulation allowed), but new tooling for a small prize. Fallback if Hedera does not work out |
| Uniswap, 1inch, Arc, Whitechain, World, Definitive, EF Anon-RPC and alt mempool | Need swaps, stablecoin payments, identity or contracts. Would bend the product |

## If Aarit picks Arkiv and Hedera

Both hang off the same moment: the cohort freeze (A10). The freeze script would publish to them
right after writing `cohorts/<id>.json`, so the order of work does not change. The Codex prompts
get written once the pick is made, and Aarit does the wallet and account sign-ups himself (Claude
never handles keys).
