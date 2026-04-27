"use strict";

(function () {
  var ACCEPT_HEADER = "text/markdown, text/html;q=0.9";

  if (!window.location.protocol.startsWith("http")) {
    return;
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

  function injectStyles() {
    var style = document.createElement("style");
    style.textContent = [
      ":root { color-scheme: light; }",
      "body.markdown-reader-mode { margin: 0; background: #ffffff; color: #1f2937; }",
      ".mdr-shell { max-width: 760px; margin: 0 auto; padding: 16px 24px 48px; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif; }",
      ".mdr-utility { display: flex; justify-content: flex-end; margin-bottom: 16px; }",
      ".mdr-view-html { min-height: 44px; padding: 0 14px; border: 1px solid #d1d5db; border-radius: 10px; background: #fff; color: #111827; font-size: 13px; line-height: 1.4; font-weight: 600; cursor: pointer; }",
      ".mdr-view-html:focus-visible { outline: 2px solid #1d4ed8; outline-offset: 2px; }",
      ".mdr-status { margin-bottom: 12px; padding: 10px 12px; border-radius: 10px; border: 1px solid #e5e7eb; background: #f9fafb; color: #374151; font-size: 13px; line-height: 1.4; }",
      ".mdr-status.error { border-color: #fecaca; background: #fef2f2; color: #7f1d1d; }",
      ".mdr-title { margin: 0 0 6px; color: #111827; font-size: 32px; line-height: 1.2; font-weight: 700; }",
      ".mdr-meta { margin: 0 0 20px; color: #4b5563; font-size: 13px; line-height: 1.4; font-weight: 500; word-break: break-all; }",
      ".mdr-content { color: #1f2937; font-size: 18px; line-height: 1.65; font-weight: 400; }",
      ".mdr-content h1, .mdr-content h2, .mdr-content h3, .mdr-content h4, .mdr-content h5, .mdr-content h6 { color: #111827; line-height: 1.25; margin-top: 24px; margin-bottom: 10px; }",
      ".mdr-content p { margin: 0 0 16px; }",
      ".mdr-content ul { margin: 0 0 16px 24px; padding: 0; }",
      ".mdr-content li { margin: 0 0 8px; }",
      ".mdr-content a { color: #1d4ed8; }",
      ".mdr-content code { background: #f3f4f6; border-radius: 6px; padding: 2px 5px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.9em; }",
      ".mdr-content pre { overflow-x: auto; margin: 0 0 16px; padding: 12px; border-radius: 8px; background: #111827; color: #f9fafb; }",
      ".mdr-content pre code { background: transparent; padding: 0; color: inherit; }"
    ].join("\n");
    document.head.appendChild(style);
  }

  function renderReader(markdownText) {
    var parsed = MarkdownReader.parseMarkdown(markdownText);
    var title = parsed.title || document.title || "Markdown View";

    document.body.innerHTML = "";
    document.body.classList.add("markdown-reader-mode");
    document.title = title;
    injectStyles();

    var shell = document.createElement("main");
    shell.className = "mdr-shell";

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
    shell.appendChild(utility);

    var titleEl = document.createElement("h1");
    titleEl.className = "mdr-title";
    titleEl.textContent = title;
    shell.appendChild(titleEl);

    var meta = document.createElement("p");
    meta.className = "mdr-meta";
    meta.textContent = window.location.href;
    shell.appendChild(meta);

    var content = document.createElement("section");
    content.className = "mdr-content";
    content.innerHTML = parsed.html;
    shell.appendChild(content);

    document.body.appendChild(shell);
  }

  function showRenderError() {
    document.body.innerHTML = "";
    document.body.classList.add("markdown-reader-mode");
    injectStyles();

    var shell = document.createElement("main");
    shell.className = "mdr-shell";

    var utility = document.createElement("div");
    utility.className = "mdr-utility";
    var button = document.createElement("button");
    button.type = "button";
    button.className = "mdr-view-html";
    button.textContent = "View HTML";
    button.addEventListener("click", function () {
      sendMessage({ type: "markdown-reader-set-bypass" }).finally(function () {
        window.location.reload();
      });
    });
    utility.appendChild(button);
    shell.appendChild(utility);

    var status = document.createElement("div");
    status.className = "mdr-status error";
    status.textContent = "Some content couldn't be rendered. You can continue in standard HTML mode.";
    shell.appendChild(status);

    document.body.appendChild(shell);
  }

  async function bootstrap() {
    var bypassResult = await sendMessage({ type: "markdown-reader-consume-bypass" });
    if (bypassResult.bypass) {
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
        return;
      }

      var markdownText = await response.text();
      try {
        renderReader(markdownText);
      } catch (_renderError) {
        showRenderError();
      }
    } catch (_fetchError) {
      // Intentionally no-op for unsupported/fetch-failure states.
    }
  }

  bootstrap();
})();
