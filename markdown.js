(function (global) {
  "use strict";

  function escapeHtml(input) {
    return String(input)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function sanitizeUrl(raw) {
    var value = String(raw || "").trim();
    var lower = value.toLowerCase();

    if (
      lower.startsWith("http://") ||
      lower.startsWith("https://") ||
      lower.startsWith("mailto:") ||
      lower.startsWith("/") ||
      lower.startsWith("#") ||
      lower.startsWith("?")
    ) {
      return value;
    }
    return "#";
  }

  function protectEscapedMarkdown(input) {
    var tokens = [];
    var protectedText = String(input).replace(
      /\\([\\`*_{}\[\]()#+\-.!])/g,
      function (_m, symbol) {
        var token = "@@MDR_ESC_" + tokens.length + "@@";
        tokens.push(symbol);
        return token;
      }
    );

    return {
      text: protectedText,
      tokens: tokens
    };
  }

  function restoreEscapedMarkdown(input, tokens) {
    var output = String(input);
    for (var i = 0; i < tokens.length; i += 1) {
      output = output.replace("@@MDR_ESC_" + i + "@@", tokens[i]);
    }
    return output;
  }

  function parseInline(text, state) {
    var withoutImages = String(text)
      .replace(/!\[[^\]]*\]\(([^)]*)\)/g, "")
      .replace(/!\[[^\]]*\]\[[^\]]*\]/g, "")
      .replace(/!\[[^\]]*\]/g, "")
      .trim();
    var protectedEscapes = protectEscapedMarkdown(withoutImages);
    var escaped = escapeHtml(protectedEscapes.text);

    escaped = escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    escaped = escaped.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    escaped = escaped.replace(
      /\[([^\]]*)\]\(([^)]*)\)/g,
      function (_m, label, url) {
        var rawUrl = String(url || "").trim();
        var rawLabel = String(label || "").trim();
        var safeUrl = sanitizeUrl(rawUrl);
        var dedupeKey = safeUrl.toLowerCase();

        if (!rawUrl || safeUrl === "#") {
          if (rawUrl) {
            return escapeHtml(rawUrl);
          }
          return rawLabel ? escapeHtml(rawLabel) : "";
        }

        if (state && state.seenLinks && state.seenLinks[dedupeKey]) {
          return " ";
        }
        if (state && state.seenLinks) {
          state.seenLinks[dedupeKey] = true;
        }

        var displayLabel = rawLabel || rawUrl;
        return (
          '<a href="' +
          escapeHtml(safeUrl) +
          '" target="_blank" rel="noopener noreferrer">' +
          escapeHtml(displayLabel) +
          "</a>"
        );
      }
    );

    escaped = escaped.replace(/<\/a>\s*(?=<a\b)/g, "</a> ");

    return restoreEscapedMarkdown(escaped, protectedEscapes.tokens);
  }

  function extractTitle(lines) {
    for (var i = 0; i < lines.length; i += 1) {
      var match = lines[i].match(/^#\s+(.+)\s*$/);
      if (match) {
        return match[1].trim();
      }
    }
    return "";
  }

  function stripFrontmatter(source) {
    if (!source.startsWith("---\n")) {
      return source;
    }

    var endIndex = source.indexOf("\n---\n", 4);
    if (endIndex === -1) {
      return source;
    }

    return source.slice(endIndex + 5);
  }

  function isLinkOnlyParagraph(text) {
    return /^\s*(\[[^\]]+\]\(([^)]+)\)\s*)+$/.test(text);
  }

  function parseMarkdown(markdown) {
    var source = String(markdown || "").replace(/\r\n/g, "\n");
    source = stripFrontmatter(source);
    var lines = source.split("\n");
    var title = extractTitle(lines);
    var html = [];
    var i = 0;
    var skippedTopTitle = false;
    var state = { seenLinks: {} };

    while (i < lines.length) {
      var line = lines[i];

      if (line.trim() === "") {
        i += 1;
        continue;
      }

      if (line.startsWith("```")) {
        var code = [];
        i += 1;
        while (i < lines.length && !lines[i].startsWith("```")) {
          code.push(lines[i]);
          i += 1;
        }
        if (i < lines.length && lines[i].startsWith("```")) {
          i += 1;
        }
        html.push("<pre><code>" + escapeHtml(code.join("\n")) + "</code></pre>");
        continue;
      }

      var heading = line.match(/^(#{1,6})\s+(.+)\s*$/);
      if (heading) {
        var level = heading[1].length;
        var headingText = heading[2].trim();
        if (level === 1 && !skippedTopTitle && title && headingText === title) {
          skippedTopTitle = true;
          i += 1;
          continue;
        }
        html.push("<h" + level + ">" + parseInline(heading[2], state) + "</h" + level + ">");
        i += 1;
        continue;
      }

      if (/^-\s+/.test(line)) {
        var items = [];
        while (i < lines.length && /^-\s+/.test(lines[i])) {
          items.push("<li>" + parseInline(lines[i].replace(/^-\s+/, ""), state) + "</li>");
          i += 1;
        }
        html.push("<ul>" + items.join("") + "</ul>");
        continue;
      }

      var para = [];
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !lines[i].startsWith("```") &&
        !/^#{1,6}\s+/.test(lines[i]) &&
        !/^-\s+/.test(lines[i])
      ) {
        para.push(lines[i]);
        i += 1;
      }
      var paragraphText = para.join(" ").trim();
      var parsedParagraph = parseInline(paragraphText, state);
      if (!parsedParagraph) {
        continue;
      }
      if (isLinkOnlyParagraph(paragraphText)) {
        html.push('<p class="mdr-link-lines">' + parsedParagraph + "</p>");
      } else {
        html.push("<p>" + parsedParagraph + "</p>");
      }
    }

    return {
      title: title,
      html: html.join("\n")
    };
  }

  var api = {
    escapeHtml: escapeHtml,
    sanitizeUrl: sanitizeUrl,
    parseInline: parseInline,
    parseMarkdown: parseMarkdown
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  global.MarkdownReader = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
