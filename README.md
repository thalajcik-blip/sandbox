# sandbox

Static client demos, one directory per demo, deployed as the Vercel project
`sandbox`. No build step, no framework.

```
/                     neutral placeholder, lists nothing
/billex-homepage/     Billex homepage with interactive sections
```

## Rules

- **Share demos by direct link only.** The root page must never list them:
  clients must not be able to browse to each other's work.
- **Everything is `noindex`.** `vercel.json` sends `X-Robots-Tag: noindex,
  nofollow` for every path. Don't add a `robots.txt` that disallows crawling;
  it would hide that header from crawlers.
- **Reference assets relatively** (`hero-live.css`, not `/hero-live.css`), so
  a demo works under its own directory. `trailingSlash: true` in
  `vercel.json` redirects `/demo` to `/demo/`; without it relative paths
  break.
- **Copy third-party assets in** rather than hotlinking files whose names
  carry a build hash; those disappear on the next deploy of the source site.
- **Keep it small.** Images at about 3x their on-screen size, no videos or
  design exports. The Vercel team shares a 10 GB storage cap and every
  deploy stores a full copy.

## Run locally

```bash
python3 -m http.server 8090
```

Then open <http://localhost:8090/billex-homepage/>.

## Adding a demo

1. Create `/<demo-name>/index.html` with its assets beside it.
2. Check it locally, including on a phone-sized viewport.
3. Commit, deploy once, and send the client
   `https://<sandbox-domain>/<demo-name>/`.

Deploy only on purpose: a demo URL is public to anyone who has it.
