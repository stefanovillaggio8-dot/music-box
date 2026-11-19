"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium, webkit } = require("playwright");
const requestedEngine = process.env.LYRICS_ENGINE;
assert.ok(!requestedEngine || ["chromium", "webkit"].includes(requestedEngine),
  "LYRICS_ENGINE must be chromium or webkit");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const start = html.indexOf('<div class="lyrics-overlay"');
const end = html.indexOf('<div class="import-overlay" id="spotifyPanel"', start);
assert.ok(start !== -1 && end > start, "lyrics dialog markup must be present");
const lyricsFragment = html.slice(start, end);
const chromiumExecutable = fs.existsSync("/usr/bin/google-chrome")
  ? "/usr/bin/google-chrome"
  : fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : null;
const fixture = `<!doctype html><html lang="it"><head>
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <link rel="stylesheet" href="/style.css"></head><body>
  <div class="im-root" id="immersivePanel" style="display:block">Immersive layer</div>
  ${lyricsFragment}
  </body></html>`;

const server = http.createServer((req, res) => {
  const isCss = req.url === "/style.css";
  res.writeHead(200, { "Content-Type": isCss ? "text/css" : "text/html" });
  res.end(isCss ? css : fixture);
});

async function run() {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    for (const engine of requestedEngine ? [requestedEngine] : ["chromium", "webkit"]) {
      if (engine === "webkit" && !fs.existsSync(webkit.executablePath())) {
        console.log("[LYRICS FULL VIEW] WebKit not installed; skipping browser engine");
        continue;
      }
      const browser = await (engine === "webkit" ? webkit : chromium).launch({
        headless: true,
        ...(engine === "chromium" && chromiumExecutable
          ? { executablePath: chromiumExecutable } : {})
      });
      try {
        for (const screen of [
          { name: "desktop", width: 1360, height: 900 },
          { name: "iphone13", width: 390, height: 844 },
          { name: "small-phone", width: 360, height: 640 }
        ]) {
          const context = await browser.newContext({
            viewport: { width: screen.width, height: screen.height },
            ...(screen.name === "desktop" ? {} : { isMobile: true, hasTouch: true }),
            reducedMotion: "reduce"
          });
          const page = await context.newPage();
          await page.goto(`http://127.0.0.1:${server.address().port}/`);
          await page.evaluate(() => {
            const panel = document.querySelector("#lyricsPanel");
            const body = document.querySelector("#lyricsBody");
            panel.hidden = false;
            panel.classList.add("lyrics-full-view");
            body.classList.add("lyrics-plain");
            document.querySelector("#lyricsReadingTools").hidden = false;
            document.querySelector("#lyricsTitle").textContent =
              "Titolo abbastanza lungo per verificare il layout";
            for (let i = 0; i < 65; i++) {
              const p = document.createElement("p");
              p.textContent = "Riga di testo completa di prova " + (i + 1);
              p.className = "lyr-line-full";
              body.appendChild(p);
            }
          });
          const metrics = await page.evaluate(() => {
            const box = selector => {
              const element = document.querySelector(selector);
              const rect = element.getBoundingClientRect();
              return { top: rect.top, bottom: rect.bottom,
                left: rect.left, right: rect.right };
            };
            const body = document.querySelector("#lyricsBody");
            const topElement = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
            return {
              viewport: { width: innerWidth, height: innerHeight },
              card: box(".lyrics-card"),
              head: box(".lyrics-head"),
              toolbar: box(".lyrics-toolbar"),
              body: box("#lyricsBody"),
              footer: box(".lyrics-pie"),
              scrollable: body.scrollHeight > body.clientHeight,
              mask: getComputedStyle(body).maskImage,
              webkitMask: getComputedStyle(body).webkitMaskImage,
              topmostIsLyrics: !!topElement?.closest("#lyricsPanel"),
              pageOverflow: document.documentElement.scrollWidth - innerWidth
            };
          });
          assert.ok(metrics.topmostIsLyrics,
            `${engine} ${screen.name}: lyrics must appear above Immersive Mode`);
          assert.ok(metrics.card.top >= -2 && metrics.card.bottom <= metrics.viewport.height + 2,
            `${engine} ${screen.name}: card must fit vertically`);
          assert.ok(metrics.head.top >= -2 && metrics.footer.bottom <= metrics.viewport.height + 2,
            `${engine} ${screen.name}: header and footer must remain reachable`);
          assert.ok(metrics.body.bottom > metrics.body.top + 35,
            `${engine} ${screen.name}: readable text area must remain visible`);
          assert.ok(metrics.scrollable,
            `${engine} ${screen.name}: long text must scroll inside the reader`);
          assert.equal(metrics.mask, "none",
            `${engine} ${screen.name}: reader must not inherit karaoke fade mask`);
          assert.equal(metrics.webkitMask, "none");
          assert.ok(metrics.pageOverflow <= 2,
            `${engine} ${screen.name}: no horizontal page overflow`);
          console.log("[LYRICS FULL VIEW]", engine, screen.name, "OK");
          await context.close();
        }
      } finally {
        await browser.close();
      }
    }
  } finally {
    server.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
