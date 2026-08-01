/** SSR stub — Shiki language grammars must not ship in the Worker. */
export async function createHighlighter() {
  return {
    codeToTokens: () => ({ tokens: [] as never[], fg: "inherit", bg: "transparent" }),
    codeToHtml: () => "",
    dispose: () => {},
  };
}

export type BundledLanguage = string;
export type BundledTheme = string;
export type HighlighterGeneric<L = string, T = string> = {
  codeToTokens: (...args: unknown[]) => {
    tokens: never[];
    fg: string;
    bg: string;
  };
  codeToHtml: (...args: unknown[]) => string;
  dispose: () => void;
  langs?: L;
  themes?: T;
};
export type ThemedToken = {
  content: string;
  color?: string;
  fontStyle?: number;
};
