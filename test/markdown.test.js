import { describe, it, expect } from "vitest";
import markdownApi from "../markdown.js";

const { parseMarkdown, sanitizeUrl } = markdownApi;

describe("parseMarkdown", () => {
  it("extracts title but avoids duplicating top-level heading content", () => {
    const result = parseMarkdown("# Hello\n\nThis is a paragraph.");

    expect(result.title).toBe("Hello");
    expect(result.html).not.toContain("<h1>Hello</h1>");
    expect(result.html).toContain("<p>This is a paragraph.</p>");
  });

  it("strips yaml frontmatter from markdown source", () => {
    const result = parseMarkdown(["---", "title: Test", "tags:", "  - demo", "---", "# Hello"].join("\n"));
    expect(result.title).toBe("Hello");
    expect(result.html).toBe("");
  });

  it("escapes raw html tags", () => {
    const result = parseMarkdown("Hello <script>alert(1)</script>");
    expect(result.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(result.html).not.toContain("<script>");
  });

  it("renders links with safe protocol only", () => {
    const safe = parseMarkdown("[good](https://example.com)");
    const unsafe = parseMarkdown("[bad](javascript:alert(1))");
    const emptyLabel = parseMarkdown("[](https://example.com/path_here)");

    expect(safe.html).toContain('href="https://example.com"');
    expect(unsafe.html).toContain("<p>javascript:alert(1)</p>");
    expect(unsafe.html).not.toContain('href="#"');
    expect(emptyLabel.html).toContain(">https://example.com/path_here</a>");
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

  it("renders link-only paragraphs as newline-separated links", () => {
    const result = parseMarkdown("[one](https://one.example) [two](https://two.example)");
    expect(result.html).toContain('<p class="mdr-link-lines">');
    expect(result.html).toContain('href="https://one.example"');
    expect(result.html).toContain('href="https://two.example"');
  });

  it("suppresses duplicate links after first occurrence", () => {
    const result = parseMarkdown(
      ["[Sign In](https://www.tryhamster.com/sign-in)", "[Sign In](https://www.tryhamster.com/sign-in)"].join("\n\n")
    );

    const matches = result.html.match(/href="https:\/\/www\.tryhamster\.com\/sign-in"/g) || [];
    expect(matches.length).toBe(1);
  });

  it("keeps separators between adjacent links without whitespace in source", () => {
    const result = parseMarkdown("[Product](https://example.com/p)[Design](https://example.com/d)");
    expect(result.html).toContain("</a> <a");
  });

  it("does not render markdown images for now", () => {
    const result = parseMarkdown(
      ["![diagram](https://example.com/img.png)", "![ref-image][hero]", "![alt only]"].join("\n")
    );
    expect(result.html).toBe("");
    expect(result.html).not.toContain("<img");
    expect(result.html).not.toContain("diagram");
    expect(result.html).not.toContain("ref-image");
    expect(result.html).not.toContain("alt only");
  });

  it("renders escaped markdown symbols as literal characters", () => {
    const result = parseMarkdown(String.raw`Escaped \_value\_ and \*stars\* stay literal.`);
    expect(result.html).toContain("<p>Escaped _value_ and *stars* stay literal.</p>");
    expect(result.html).not.toContain("<em>");
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
