function firstNonEmptyString(values: any[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }
  return ''
}

export function extractApiMessage(payload: any): string {
  if (!payload) return ''

  if (typeof payload === 'string') {
    return payload.trim()
  }

  return firstNonEmptyString([
    payload.message,
    payload.error,
    payload.detail,
    payload.title,
  ])
}

export async function parseApiResponse(response: Response): Promise<{ payload: any; message: string }> {
  let payload: any = null

  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  return {
    payload,
    message: extractApiMessage(payload),
  }
}

export function withFallbackMessage(message: string | null | undefined, fallbackMessage: string): string {
  return typeof message === 'string' && message.trim() ? message : fallbackMessage
}

export function getErrorMessage(error: any, fallbackMessage: string): string {
  const errorMessage = typeof error?.message === 'string' ? error.message.trim() : ''

  if (!errorMessage || errorMessage === 'Failed to fetch') {
    return fallbackMessage
  }

  return errorMessage
}
