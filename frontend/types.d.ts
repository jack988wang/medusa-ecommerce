// Global type declarations for Docker environment
declare module 'react' {
  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prevState: T) => T)) => void]
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void
  export interface FormEvent<T = Element> {
    preventDefault(): void
  }
}

declare module 'next/router' {
  export function useRouter(): {
    push: (url: string) => void
    back: () => void
    query: { [key: string]: string | string[] | undefined }
  }
}

declare module 'next/head' {
  export default function Head(props: any): any
}

declare module 'next/link' {
  export default function Link(props: any): any
}

declare namespace React {
  interface FormEvent<T = Element> {
    preventDefault(): void
  }
}

declare var process: {
  env: {
    NEXT_PUBLIC_MEDUSA_BACKEND_URL: string
    [key: string]: string | undefined
  }
}
