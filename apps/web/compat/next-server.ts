export type NextRequest = Request

export class NextResponse extends Response {
  static json(data: unknown, init?: ResponseInit) {
    return Response.json(data, init)
  }

  static redirect(url: string | URL, status?: number) {
    return Response.redirect(url, status)
  }

  static next() {
    return new Response(null, { status: 204 })
  }
}

export function after(callback: () => void | Promise<void>) {
  queueMicrotask(() => {
    void callback()
  })
}
