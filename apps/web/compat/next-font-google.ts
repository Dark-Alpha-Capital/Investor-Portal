type FontOptions = {
  subsets?: string[]
  variable?: string
  display?: string
}

type FontResult = {
  className: string
  variable: string
}

function makeFont(options?: FontOptions): FontResult {
  return {
    className: '',
    variable: options?.variable ?? '',
  }
}

export function DM_Sans(options?: FontOptions): FontResult {
  return makeFont(options)
}

export function Geist_Mono(options?: FontOptions): FontResult {
  return makeFont(options)
}

export function Inter(options?: FontOptions): FontResult {
  return makeFont(options)
}
