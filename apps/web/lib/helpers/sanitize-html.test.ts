import { describe, expect, it } from "bun:test";

import { sanitizeHtml } from "./sanitize-html";

describe("sanitizeHtml", () => {
  it("strips script tags and their content", () => {
    const input = '<div>safe</div><script>alert("xss")</script><p>content</p>';
    const output = sanitizeHtml(input);

    expect(output).toBe("<div>safe</div><p>content</p>");
  });

  it("removes inline event handler attributes", () => {
    const input = '<button onclick="alert(1)" onmouseover=\'run()\' class="cta">Go</button>';
    const output = sanitizeHtml(input);

    expect(output).toBe('<button class="cta">Go</button>');
  });

  it("neutralizes javascript: URLs in href and src", () => {
    const input =
      '<a href="javascript:alert(1)">link</a><img src=\'javascript:alert(2)\' alt="x">';
    const output = sanitizeHtml(input);

    expect(output).toBe('<a href="#">link</a><img src="#" alt="x">');
  });
});
