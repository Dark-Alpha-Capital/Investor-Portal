import {
  notFound as tanstackNotFound,
  redirect as tanstackRedirect,
  useLocation,
  useNavigate,
  useRouter as useTanstackRouter,
} from "@tanstack/react-router";

export function usePathname() {
  return useLocation({ select: (location) => location.pathname });
}

export function useSearchParams() {
  const search = useLocation({ select: (location) => location.search });
  // Route validateSearch may return typed objects (numbers/enums); coerce for URLSearchParams.
  if (
    search &&
    typeof search === "object" &&
    !(search instanceof URLSearchParams) &&
    !Array.isArray(search)
  ) {
    const entries: [string, string][] = [];
    for (const [key, value] of Object.entries(
      search as Record<string, unknown>,
    )) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item !== undefined && item !== null) {
            entries.push([key, String(item)]);
          }
        }
      } else {
        entries.push([key, String(value)]);
      }
    }
    return new URLSearchParams(entries);
  }
  return new URLSearchParams(search as unknown as string | undefined);
}

function parseHref(href: string): {
  pathname: string;
  search: Record<string, string>;
  hash: string | undefined;
} {
  const hashIndex = href.indexOf("#");
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const hash = hashIndex >= 0 ? href.slice(hashIndex + 1) : undefined;

  const queryIndex = withoutHash.indexOf("?");
  const pathname =
    queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const query = queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : "";

  const search: Record<string, string> = {};
  if (query) {
    const params = new URLSearchParams(query);
    params.forEach((value, key) => {
      search[key] = value;
    });
  }

  return { pathname, search, hash };
}

export function useRouter() {
  const navigate = useNavigate();
  const router = useTanstackRouter();

  return {
    push: (href: string, options?: { scroll?: boolean }) => {
      const { pathname, search, hash } = parseHref(href);
      void navigate({
        to: pathname,
        search: () => search,
        hash,
        resetScroll: options?.scroll ?? true,
      });
    },
    replace: (href: string, options?: { scroll?: boolean }) => {
      const { pathname, search, hash } = parseHref(href);
      void navigate({
        to: pathname,
        search: () => search,
        hash,
        replace: true,
        resetScroll: options?.scroll ?? true,
      });
    },
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    refresh: () => router.invalidate(),
    prefetch: async (_href: string) => Promise.resolve(),
  };
}

export function redirect(href: string): never {
  throw tanstackRedirect({ to: href });
}

export function notFound(): never {
  throw tanstackNotFound();
}
