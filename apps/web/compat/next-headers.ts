export async function headers(): Promise<Headers> {
  return new Headers()
}

export async function cookies() {
  const store = new Map<string, string>()

  return {
    get: (name: string) => {
      const value = store.get(name)
      return value ? { name, value } : undefined
    },
    getAll: () =>
      Array.from(store.entries()).map(([name, value]) => ({ name, value })),
    set: (name: string, value: string) => {
      store.set(name, value)
    },
    delete: (name: string) => {
      store.delete(name)
    },
  }
}

export async function draftMode() {
  return {
    isEnabled: false,
    enable: () => {},
    disable: () => {},
  }
}
