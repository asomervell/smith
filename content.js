"use strict";

(function () {
  var ACCEPT_HEADER = "text/markdown, text/html;q=0.9";
  var prehideTimeoutId;
  var prehideApplied = false;
  var priorVisibility = "";

  if (!window.location.protocol.startsWith("http")) {
    return;
  }

  function setPageHidden() {
    if (prehideApplied) {
      return;
    }

    function applyHide() {
      if (!document.documentElement || prehideApplied) {
        return;
      }

      priorVisibility = document.documentElement.style.visibility || "";
      document.documentElement.style.visibility = "hidden";
      prehideApplied = true;
    }

    applyHide();
    if (!prehideApplied) {
      document.addEventListener("readystatechange", applyHide, { once: true });
    }

    // Never leave the page hidden if markdown negotiation stalls.
    prehideTimeoutId = window.setTimeout(revealPage, 1200);
  }

  function revealPage() {
    if (prehideTimeoutId) {
      window.clearTimeout(prehideTimeoutId);
      prehideTimeoutId = undefined;
    }

    if (prehideApplied && document.documentElement) {
      document.documentElement.style.visibility = priorVisibility;
      prehideApplied = false;
    }
  }

  function waitForBody() {
    if (document.body) {
      return Promise.resolve();
    }

    return new Promise(function (resolve) {
      function onReady() {
        if (document.body) {
          document.removeEventListener("DOMContentLoaded", onReady);
          resolve();
        }
      }

      document.addEventListener("DOMContentLoaded", onReady);
    });
  }

  function sendMessage(message) {
    return new Promise(function (resolve) {
      try {
        chrome.runtime.sendMessage(message, function (response) {
          resolve(response || {});
        });
      } catch (_error) {
        resolve({});
      }
    });
  }

  function readerCss() {
    return [
      ":host { all: initial; }",
      "*, *::before, *::after { box-sizing: border-box; }",
      ".smith-page { min-height: 100vh; margin: 0; background: #ffffff; color: #1f2937; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; font-stretch: normal; }",
      ".mdr-shell { position: relative; max-width: 760px; margin: 0 auto; padding: 20px 24px 48px; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; font-stretch: normal !important; }",
      ".mdr-utility { position: fixed; top: 16px; right: 16px; z-index: 2147483647; }",
      ".mdr-view-html { min-height: 44px; padding: 0 14px; border: 1px solid #d1d5db; border-radius: 10px; background: #fff; color: #111827; font-size: 13px; line-height: 1.4; font-weight: 600; cursor: pointer; }",
      ".mdr-view-html:focus-visible { outline: 2px solid #1d4ed8; outline-offset: 2px; }",
      ".mdr-status { margin-bottom: 12px; padding: 10px 12px; border-radius: 10px; border: 1px solid #e5e7eb; background: #f9fafb; color: #374151; font-size: 13px; line-height: 1.4; }",
      ".mdr-status.error { border-color: #fecaca; background: #fef2f2; color: #7f1d1d; }",
      ".mdr-title { margin: 64px 0 6px; color: #111827; font-size: 32px; line-height: 1.2; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; font-weight: 800; font-stretch: normal !important; letter-spacing: -0.01em; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }",
      ".mdr-meta { margin: 0 0 20px; color: #4b5563; font-size: 13px; line-height: 1.4; font-weight: 500; word-break: break-all; }",
      ".prose { color: #374151; max-width: 65ch; font-size: 1.125rem; line-height: 1.75; font-stretch: normal !important; }",
      ".prose p { margin-top: 1.25em; margin-bottom: 1.25em; }",
      ".prose a { color: #111827; text-decoration: underline; font-weight: 500; }",
      ".prose .mdr-link-lines a { display: block; margin: 0.5rem 0; }",
      ".prose strong { color: #111827; font-weight: 600; }",
      ".prose code { color: #111827; font-weight: 600; font-size: 0.875em; background: #f3f4f6; border-radius: 0.375rem; padding: 0.15rem 0.35rem; }",
      ".prose h1, .prose h2, .prose h3, .prose h4 { color: #111827; font-weight: 800; line-height: 1.25; }",
      ".prose h1 { font-size: 2.25em; margin-top: 0; margin-bottom: 0.8888889em; }",
      ".prose h2 { font-size: 1.5em; margin-top: 2em; margin-bottom: 1em; }",
      ".prose h3 { font-size: 1.25em; margin-top: 1.6em; margin-bottom: 0.6em; }",
      ".prose ul { list-style-type: disc; margin-top: 1.25em; margin-bottom: 1.25em; padding-left: 1.625em; }",
      ".prose li { margin-top: 0.5em; margin-bottom: 0.5em; }",
      ".prose pre { color: #e5e7eb; background-color: #111827; overflow-x: auto; font-weight: 400; font-size: 0.875em; line-height: 1.7; margin-top: 1.7em; margin-bottom: 1.7em; border-radius: 0.5rem; padding: 0.85em 1.15em; }",
      ".prose pre code { background-color: transparent; border-width: 0; border-radius: 0; padding: 0; font-weight: inherit; color: inherit; font-size: inherit; line-height: inherit; }"
    ].join("\n");
  }

  function createIsolatedRoot() {
    if (!document.body) {
      return null;
    }

    document.body.innerHTML = "";
    document.body.style.margin = "0";

    var host = document.createElement("div");
    host.className = "smith";
    host.style.display = "block";
    host.style.width = "100%";
    document.body.appendChild(host);

    var shadow = host.attachShadow({ mode: "open" });
    var style = document.createElement("style");
    style.textContent = readerCss();
    shadow.appendChild(style);

    var page = document.createElement("div");
    page.className = "smith-page";
    shadow.appendChild(page);

    return page;
  }

  function buildUtility() {
    var utility = document.createElement("div");
    utility.className = "mdr-utility";
    var button = document.createElement("button");
    button.type = "button";
    button.className = "mdr-view-html";
    button.textContent = "View HTML";
    button.addEventListener("click", function () {
      button.disabled = true;
      sendMessage({ type: "markdown-reader-set-bypass" }).finally(function () {
        window.location.reload();
      });
    });
    utility.appendChild(button);
    return utility;
  }

  function renderReader(markdownText) {
    var parsed = MarkdownReader.parseMarkdown(markdownText);
    var title = parsed.title || document.title || "Markdown View";
    var root = createIsolatedRoot();
    if (!root) {
      return;
    }

    document.title = title;

    var shell = document.createElement("main");
    shell.className = "mdr-shell";
    shell.appendChild(buildUtility());

    var titleEl = document.createElement("h1");
    titleEl.className = "mdr-title";
    titleEl.textContent = title;
    shell.appendChild(titleEl);

    var meta = document.createElement("p");
    meta.className = "mdr-meta";
    meta.textContent = window.location.href;
    shell.appendChild(meta);

    var content = document.createElement("section");
    content.className = "mdr-content prose prose-lg";
    content.innerHTML = parsed.html;
    shell.appendChild(content);

    root.appendChild(shell);
  }

  function showRenderError() {
    var root = createIsolatedRoot();
    if (!root) {
      return;
    }

    var shell = document.createElement("main");
    shell.className = "mdr-shell";
    shell.appendChild(buildUtility());

    var status = document.createElement("div");
    status.className = "mdr-status error";
    status.textContent = "Some content couldn't be rendered. You can continue in standard HTML mode.";
    shell.appendChild(status);

    root.appendChild(shell);
  }

  async function bootstrap() {
    setPageHidden();

    var bypassResult = await sendMessage({ type: "markdown-reader-consume-bypass" });
    if (bypassResult.bypass) {
      revealPage();
      return;
    }

    try {
      var response = await fetch(window.location.href, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: ACCEPT_HEADER
        }
      });

      var contentType = (response.headers.get("content-type") || "").toLowerCase();
      if (!contentType.startsWith("text/markdown")) {
        revealPage();
        return;
      }

      var markdownText = await response.text();
      await waitForBody();
      try {
        renderReader(markdownText);
      } catch (_renderError) {
        showRenderError();
      }
      revealPage();
    } catch (_fetchError) {
      // Intentionally no-op for unsupported/fetch-failure states.
      revealPage();
    }
  }

  bootstrap();
})();
