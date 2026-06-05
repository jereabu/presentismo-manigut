import messages from '../../messages/es.json'

type Obj = Record<string, unknown>

function get(obj: Obj, path: string): string {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return path
    current = (current as Obj)[part]
  }
  return typeof current === 'string' ? current : path
}

export function useTranslations(namespace?: string) {
  return function t(key: string, params?: Record<string, string | number>): string {
    const fullKey = namespace ? `${namespace}.${key}` : key
    let value = get(messages as unknown as Obj, fullKey)
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(`{${k}}`, String(v))
      }
    }
    return value
  }
}
