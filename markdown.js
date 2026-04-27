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

  function parseInline(text) {
    var escaped = escapeHtml(text);

    escaped = escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    escaped = escaped.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    escaped = escaped.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      function (_m, label, url) {
        var safe = escapeHtml(sanitizeUrl(url));
        return '<a href="' + safe + '" target="_blank" rel="noopener noreferrer">' + label + "</a>";
      }
    );

    return escaped;
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

  function parseMarkdown(markdown) {
    var source = String(markdown || "").replace(/\r\n/g, "\n");
    var lines = source.split("\n");
    var html = [];
    var i = 0;

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
        html.push("<h" + level + ">" + parseInline(heading[2]) + "</h" + level + ">");
        i += 1;
        continue;
      }

      if (/^-\s+/.test(line)) {
        var items = [];
        while (i < lines.length && /^-\s+/.test(lines[i])) {
          items.push("<li>" + parseInline(lines[i].replace(/^-\s+/, "")) + "</li>");
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
      html.push("<p>" + parseInline(para.join(" ")) + "</p>");
    }

    return {
      title: extractTitle(lines),
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
