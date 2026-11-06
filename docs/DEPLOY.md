# Hosting the demo link

ETHGlobal's form wants a public demo link. The whole app is one Node process: the relay serves the
built web app, the WebSocket tape and the account API on one port, so one free web service is
enough. Test it locally first: `npm run build`, then `npm start`, then open http://localhost:8787.

## Render (free, about 10 minutes, Aarit signs up)

1. Go to render.com and sign in with GitHub (Aary992).
2. New, then **Web Service**, then pick `Aary992/wallet-labeled-tape`.
3. Settings:

| Setting | Value |
|:-|:-|
| Language | Node |
| Branch | main |
| Build command | `npm ci && npm run build` |
| Start command | `npm start` |
| Instance type | Free |
| Environment variable | `RELAY_PORT` = `10000` |
| Environment variable | `NODE_VERSION` = `22.21.0` |

4. Create. The first build takes a few minutes. The URL looks like
   `https://wallet-labeled-tape.onrender.com`. Open it: the tape should be live within seconds.
5. Paste that URL into the form's demo link.

What to know about the free tier:

- It sleeps after 15 minutes with no visitors; the first visit after that takes about a minute.
- Its disk is wiped on every restart, so scores start from zero and warm up over 10 to 20 minutes.
  Fine for a link; the live demo at the table still runs on the laptop, which has been scoring
  all night.

## Plan B: tunnel from the laptop (no sign-up)

While the laptop runs the backend after `npm run build`:

```powershell
winget install Cloudflare.cloudflared
cloudflared tunnel --url http://localhost:8787
```

It prints a `https://<random>.trycloudflare.com` URL that shows the laptop's warmed-up app. It
dies when the laptop sleeps or the command stops, and the URL changes every run, so only use it if
Render fails.

## Plan C

Put the YouTube link of the demo video in the demo field.
