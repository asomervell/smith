import { describe, it, expect } from "vitest";
import markdownApi from "../markdown.js";

const { parseMarkdown, sanitizeUrl } = markdownApi;

describe("parseMarkdown", () => {
  it("parses headings and paragraphs", () => {
    const result = parseMarkdown("# Hello\n\nThis is a paragraph.");

    expect(result.title).toBe("Hello");
    expect(result.html).toContain("<h1>Hello</h1>");
    expect(result.html).toContain("<p>This is a paragraph.</p>");
  });

  it("escapes raw html tags", () => {
    const result = parseMarkdown("Hello <script>alert(1)</script>");
    expect(result.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(result.html).not.toContain("<script>");
  });

  it("renders links with safe protocol only", () => {
    const safe = parseMarkdown("[good](https://example.com)");
    const unsafe = parseMarkdown("[bad](javascript:alert(1))");

    expect(safe.html).toContain('href="https://example.com"');
    expect(unsafe.html).toContain('href="#"');
  });

  it("parses lists, inline styles, and fenced code blocks", () => {
    const result = parseMarkdown(
      [
        "# Title",
        "",
        "- **Bold item** with `code`",
        "- *Italic item*",
        "",
        "```",
        "const value = '<safe>';",
        "```"
      ].join("\n")
    );

    expect(result.html).toContain("<ul>");
    expect(result.html).toContain("<strong>Bold item</strong>");
    expect(result.html).toContain("<em>Italic item</em>");
    expect(result.html).toContain("<code>code</code>");
    expect(result.html).toContain("<pre><code>const value = &#39;&lt;safe&gt;&#39;;</code></pre>");
  });
});

describe("sanitizeUrl", () => {
  it("allows expected url types", () => {
    expect(sanitizeUrl("https://example.com")).toBe("https://example.com");
    expect(sanitizeUrl("/local/path")).toBe("/local/path");
    expect(sanitizeUrl("#anchor")).toBe("#anchor");
  });

  it("blocks javascript urls", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("#");
  });
});
