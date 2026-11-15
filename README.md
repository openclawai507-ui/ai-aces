# AI Aces

Scroll-driven motion website for AI Aces, an AI consulting firm. Plain HTML, CSS and JavaScript with no build step.

The story: an ace of spades held in a hand, flicked across the screen, into a roulette wheel where the AI calls the pocket, then a poker showdown won with four aces and an AI wild card. Services, process and contact follow.

## Files

- `index.html` – all content. **Edit the `window.AIACES` block near the top** to set your email and social links.
- `css/styles.css` – design and layout.
- `js/main.js` – scroll story and page logic.
- `js/fx.js` – particle network, chip burst, text scramble, cursor.

GSAP, ScrollTrigger and Lenis load from public CDNs. Everything you see is drawn in SVG, CSS and canvas, so there are no image files.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Add `?static` to the URL to see the reduced-motion version.

## Publish on GitHub Pages

1. Create a new repository on GitHub and push this folder to it.
2. In the repository: Settings → Pages → Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
3. The site appears at `https://<username>.github.io/<repository>/` after a minute or two.

All paths are relative, so it works from a sub-folder URL without changes.
