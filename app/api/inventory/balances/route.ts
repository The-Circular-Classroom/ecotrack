import { NextRequest } from 'next/server'
import { GET as getBalance } from '../balance/route'

/**
 * GET /api/inventory/balances - Alias for /api/inventory/balance
 */
export async function GET(request: NextRequest) {
  return getBalance(request)
}
