const { test, expect, chromium } = require("@playwright/test");
const http = require("node:http");
const path = require("node:path");

function startServer() {
  const server = http.createServer((req, res) => {
    const requestUrl = new URL(req.url, "http://127.0.0.1");
    if (requestUrl.pathname !== "/doc" && requestUrl.pathname !== "/html-only") {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }

    if (requestUrl.pathname === "/html-only") {
      res.setHeader("content-type", "text/html; charset=utf-8");
      res.end(
        "<!doctype html><html><head><title>Only HTML</title></head><body><h1 id='plain-html-title'>Plain HTML Only</h1></body></html>"
      );
      return;
    }

    const acceptHeader = String(req.headers.accept || "");
    if (acceptHeader.includes("text/markdown")) {
      res.setHeader("content-type", "text/markdown; charset=utf-8");
      res.end("# Reader Title\n\nThis should render in reader mode.");
      return;
    }

    res.setHeader("content-type", "text/html; charset=utf-8");
    res.end(
      "<!doctype html><html><head><title>Original Doc</title></head><body><h1 id='html-title'>Original HTML Title</h1><p>Fallback page.</p></body></html>"
    );
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/doc`
      });
    });
  });
}

test("renders markdown reader and allows one-shot HTML bypass", async () => {
  const { server, url } = await startServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  try {
    await context.addInitScript(() => {
      window.chrome = {
        runtime: {
          sendMessage(message, callback) {
            const key = "__mdr_bypass__";
            if (message && message.type === "markdown-reader-set-bypass") {
              sessionStorage.setItem(key, "1");
              callback({ ok: true });
              return;
            }

            if (message && message.type === "markdown-reader-consume-bypass") {
              const hadBypass = sessionStorage.getItem(key) === "1";
              if (hadBypass) {
                sessionStorage.removeItem(key);
              }
              callback({ bypass: hadBypass });
              return;
            }

            callback({});
          }
        }
      };
    });
    await context.addInitScript({ path: path.join(__dirname, "..", "markdown.js") });
    await context.addInitScript({ path: path.join(__dirname, "..", "content.js") });

    const page = await context.newPage();
    await page.goto(url);

    await expect(page.locator(".mdr-title")).toHaveText("Reader Title");
    await page.getByRole("button", { name: "View HTML" }).click();
    await expect(page.locator("#html-title")).toHaveText("Original HTML Title");
    await expect(page.locator(".mdr-shell")).toHaveCount(0);
  } finally {
    await context.close();
    await browser.close();
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
});

test("shows safe HTML fallback when markdown render fails", async () => {
  const { server, url } = await startServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  try {
    await context.addInitScript(() => {
      window.chrome = {
        runtime: {
          sendMessage(_message, callback) {
            callback({ bypass: false });
          }
        }
      };
    });
    await context.addInitScript({ path: path.join(__dirname, "..", "markdown.js") });
    await context.addInitScript(() => {
      const original = window.MarkdownReader.parseMarkdown;
      window.MarkdownReader.parseMarkdown = function (input) {
        if (window.location.search.includes("crash=1")) {
          throw new Error("forced render crash");
        }
        return original(input);
      };
    });
    await context.addInitScript({ path: path.join(__dirname, "..", "content.js") });

    const page = await context.newPage();
    await page.goto(`${url}?crash=1`);

    await expect(page.locator(".mdr-status.error")).toContainText("couldn't be rendered");
    await expect(page.getByRole("button", { name: "View HTML" })).toBeVisible();
  } finally {
    await context.close();
    await browser.close();
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
});

test("leaves page unchanged for non-markdown responses", async () => {
  const { server, url } = await startServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  try {
    await context.addInitScript(() => {
      window.chrome = {
        runtime: {
          sendMessage(_message, callback) {
            callback({ bypass: false });
          }
        }
      };
    });
    await context.addInitScript({ path: path.join(__dirname, "..", "markdown.js") });
    await context.addInitScript({ path: path.join(__dirname, "..", "content.js") });

    const page = await context.newPage();
    await page.goto(url.replace("/doc", "/html-only"));

    await expect(page.locator("#plain-html-title")).toHaveText("Plain HTML Only");
    await expect(page.locator(".mdr-shell")).toHaveCount(0);
  } finally {
    await context.close();
    await browser.close();
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
});
