const FALLBACK_RATE = 1.55 // reasonable AUD/USD fallback if API is unreachable

/**
 * Fetch the live USD → AUD exchange rate from open.er-api.com.
 * Result is cached by Next.js for 6 hours (revalidate: 21600).
 */
export async function getUsdToAudRate(): Promise<number> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 21600 },
    })
    if (!res.ok) return FALLBACK_RATE
    const data = await res.json()
    return data?.rates?.AUD ?? FALLBACK_RATE
  } catch {
    return FALLBACK_RATE
  }
}

export function convertToAud(usdPrice: number, rate: number): number {
  return Math.round(usdPrice * rate)
}
