import { notFound as tanstackNotFound, redirect as tanstackRedirect, useLocation, useNavigate, useRouter as useTanstackRouter } from '@tanstack/react-router'

export function usePathname() {
  return useLocation({ select: (location) => location.pathname })
}

export function useSearchParams() {
  const search = useLocation({ select: (location) => location.search })
  return new URLSearchParams(search)
}

export function useRouterCompat() {
  const navigate = useNavigate()
  const router = useTanstackRouter()

  return {
    push: (href: string, options?: { scroll?: boolean }) =>
      navigate({ to: href, resetScroll: options?.scroll ?? true }),
    replace: (href: string, options?: { scroll?: boolean }) =>
      navigate({ to: href, replace: true, resetScroll: options?.scroll ?? true }),
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    refresh: () => router.invalidate(),
    prefetch: async (_href: string) => Promise.resolve(),
  }
}

export const useRouter = useRouterCompat

export function redirect(href: string): never {
  throw tanstackRedirect({ to: href })
}

export function notFound(): never {
  throw tanstackNotFound()
}
