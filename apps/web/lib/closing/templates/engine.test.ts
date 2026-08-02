import { describe, expect, test } from "bun:test";
import { renderTemplate, stripHtmlToText } from "./engine";

describe("template engine", () => {
  test("substitutes variables", () => {
    const html = renderTemplate(
      "<p>{{InvestorName}} commits {{CommitmentAmount}}</p>",
      {
        InvestorName: "Jane Doe",
        EntityName: "Jane Doe",
        CommitmentAmount: "$250,000",
        DealName: "Alpha",
        ClosingDate: "2026-08-02",
        FundName: "Alpha Fund",
        ManagerName: "DAC",
        GeneratedAt: "2026-08-02T00:00:00.000Z",
      },
    );
    expect(html).toContain("Jane Doe");
    expect(html).toContain("$250,000");
  });

  test("leaves unknown variables intact", () => {
    expect(renderTemplate("{{Missing}}", {} as never)).toBe("{{Missing}}");
  });

  test("strips html to text", () => {
    expect(stripHtmlToText("<p>Hello</p><br/>World")).toContain("Hello");
  });
});
