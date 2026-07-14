import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { UserRole } from '@/lib/prisma/generated/client/client'
import { createApiLogger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SyncAction {
  email: string
  action:
    | 'auth_created'
    | 'auth_banned'
    | 'auth_unbanned'
    | 'auth_metadata_updated'
    | 'db_created'
    | 'db_updated'
    | 'auth_banned_orphan'
  details?: string
}

interface SyncError {
  authId?: string
  email?: string
  error: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generates a cryptographically secure temporary password.
 * The user must use "Forgot Password" to set their own — this value is never surfaced.
 */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('')
}

/** Returns true when a Supabase Auth user is currently banned. */
function isAuthUserBanned(authUser: { banned_until?: string | null }): boolean {
  if (!authUser.banned_until || authUser.banned_until === 'none') return false
  return new Date(authUser.banned_until) > new Date()
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/**
 * GET /api/users/sync - Alias of POST for legacy client support.
 */
export async function GET(request: NextRequest) {
  return POST(request)
}

/**
 * POST /api/users/sync - Sync users between Supabase Auth and the database.
 *
 * Phase A — Auth → DB:
 *   - Auth user with no DB record  → create DB record
 *   - Auth user with existing DB record → update DB fields if they differ
 *
 * Phase B — DB → Auth:
 *   - DB user (is_active=true) with no Auth record  → create Auth user (email confirmation skipped)
 *   - DB user (is_active=false) with active Auth record → ban Auth user
 *   - DB user (is_active=true) with banned Auth record  → un-ban Auth user
 *   - DB user metadata differs from Auth metadata        → update Auth metadata
 *
 * Phase C — Orphan cleanup:
 *   - Auth user with no matching DB record (by supabase_auth_id or email) → ban Auth user
 *
 * Admin-only endpoint.
 */
export async function POST(request: NextRequest) {
  const logger = createApiLogger('POST /api/users/sync')
  const role = request.headers.get('x-user-role')
  if (!requireRole(role, 'Admin')) {
    logger.warn('Forbidden: Admin access required', { role })
    return NextResponse.json(
      { error: 'forbidden', message: 'Admin access required' },
      { status: 403 }
    )
  }

  logger.info('Starting user sync operation')

  try {
    // -----------------------------------------------------------------------
    // 1. Fetch all Supabase Auth users (paginated)
    // -----------------------------------------------------------------------
    const authUsers: Array<any> = []
    let page = 1
    const perPage = 100

    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })

      if (error) {
        logger.error('Failed to list auth users', { error: error.message })
        return NextResponse.json(
          { error: 'auth_error', message: 'Failed to list auth users' },
          { status: 500 }
        )
      }

      if (!data.users || data.users.length === 0) break
      authUsers.push(...data.users)
      if (data.users.length < perPage) break
      page++
    }

    logger.info('Fetched users from Supabase Auth', { count: authUsers.length })

    // -----------------------------------------------------------------------
    // 2. Fetch all DB users
    // -----------------------------------------------------------------------
    const dbUsers = await prisma.user.findMany()
    logger.info('Fetched users from database', { count: dbUsers.length })

    // Build lookup maps
    const authById = new Map(authUsers.map((u) => [u.id, u]))
    const authByEmail = new Map(
      authUsers.filter((u) => u.email).map((u) => [u.email.toLowerCase(), u])
    )
    const dbByAuthId = new Map(dbUsers.map((u) => [u.supabaseAuthId, u]))
    const dbByEmail = new Map(
      dbUsers.filter((u) => u.email).map((u) => [u.email.toLowerCase(), u])
    )

    const actions: SyncAction[] = []
    const errors: SyncError[] = []

    // -----------------------------------------------------------------------
    // PHASE A: Auth → DB
    // -----------------------------------------------------------------------
    for (const au of authUsers) {
      const emailLower = au.email?.toLowerCase()
      const existingDbUser =
        dbByAuthId.get(au.id) ?? (emailLower ? dbByEmail.get(emailLower) : undefined)

      const auFirstName: string = au.user_metadata?.first_name || ''
      const auLastName: string = au.user_metadata?.last_name || ''
      const auFullName: string =
        au.user_metadata?.full_name ||
        [auFirstName, auLastName].filter(Boolean).join(' ')
      const auPhone: string = au.user_metadata?.phone_number || au.phone || ''
      const auRole: UserRole = (au.app_metadata?.role as UserRole) || UserRole.Parent
      const auIsActive: boolean = !isAuthUserBanned(au)

      if (!existingDbUser) {
        try {
          await prisma.user.create({
            data: {
              supabaseAuthId: au.id,
              email: au.email || `${au.id}@unknown.local`,
              role: auRole,
              firstName: auFirstName || null,
              lastName: auLastName || null,
              fullName: auFullName || null,
              phoneNumber: auPhone || null,
              isActive: auIsActive,
            },
          })
          actions.push({ email: au.email, action: 'db_created', details: `role=${auRole}` })
          logger.info('Created missing DB user from Auth', { email: au.email })
        } catch (dbErr: any) {
          logger.error('Failed to create DB user from Auth', {
            email: au.email,
            error: dbErr.message,
          })
          errors.push({ authId: au.id, email: au.email, error: dbErr.message })
        }
      } else {
        const needsUpdate =
          existingDbUser.supabaseAuthId !== au.id ||
          existingDbUser.firstName !== (auFirstName || null) ||
          existingDbUser.lastName !== (auLastName || null) ||
          existingDbUser.fullName !== (auFullName || null) ||
          existingDbUser.phoneNumber !== (auPhone || null) ||
          existingDbUser.role !== auRole ||
          existingDbUser.isActive !== auIsActive

        if (needsUpdate) {
          try {
            await prisma.user.update({
              where: { id: existingDbUser.id },
              data: {
                supabaseAuthId: au.id,
                firstName: auFirstName || null,
                lastName: auLastName || null,
                fullName: auFullName || null,
                phoneNumber: auPhone || null,
                role: auRole,
                isActive: auIsActive,
              },
            })
            actions.push({
              email: au.email,
              action: 'db_updated',
              details: `role=${auRole}, isActive=${auIsActive}`,
            })
            logger.info('Updated DB user from Auth', { email: au.email })
          } catch (dbErr: any) {
            logger.error('Failed to update DB user from Auth', {
              email: au.email,
              error: dbErr.message,
            })
            errors.push({ authId: au.id, email: au.email, error: dbErr.message })
          }
        }
      }
    }

    // -----------------------------------------------------------------------
    // PHASE B: DB → Auth
    // -----------------------------------------------------------------------
    for (const dbUser of dbUsers) {
      const existingAuthUser =
        authById.get(dbUser.supabaseAuthId) ??
        (dbUser.email ? authByEmail.get(dbUser.email.toLowerCase()) : undefined)

      if (!existingAuthUser) {
        // No Auth record found
        if (!dbUser.isActive) {
          // Inactive DB users without an Auth record — nothing to create
          logger.info('Skipping inactive DB user with no Auth record', { email: dbUser.email })
          continue
        }

        // Active DB user → create Auth user
        try {
          const tempPassword = generateTempPassword()
          const { data: newAuth, error: createAuthError } =
            await supabaseAdmin.auth.admin.createUser({
              email: dbUser.email,
              password: tempPassword,
              email_confirm: true, // skip email confirmation
              app_metadata: { role: dbUser.role },
              user_metadata: {
                first_name: dbUser.firstName || '',
                last_name: dbUser.lastName || '',
                full_name: dbUser.fullName || '',
                phone_number: dbUser.phoneNumber || '',
              },
            })

          if (createAuthError) {
            logger.error('Failed to create Auth user from DB', {
              email: dbUser.email,
              error: createAuthError.message,
            })
            errors.push({
              authId: dbUser.supabaseAuthId,
              email: dbUser.email,
              error: createAuthError.message,
            })
          } else if (newAuth?.user) {
            // Keep supabase_auth_id in DB in sync with the new Auth UUID
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { supabaseAuthId: newAuth.user.id },
            })
            actions.push({
              email: dbUser.email,
              action: 'auth_created',
              details: `new auth id=${newAuth.user.id}`,
            })
            logger.info('Created Supabase Auth user from DB', { email: dbUser.email })
          }
        } catch (authErr: any) {
          logger.error('Failed to create Auth user from DB', {
            email: dbUser.email,
            error: authErr.message,
          })
          errors.push({
            authId: dbUser.supabaseAuthId,
            email: dbUser.email,
            error: authErr.message,
          })
        }
      } else {
        const currentlyBanned = isAuthUserBanned(existingAuthUser)

        // --- Ban inactive DB users that are active in Auth ---
        if (!dbUser.isActive && !currentlyBanned) {
          try {
            const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
              existingAuthUser.id,
              { ban_duration: '876000h' } // ~100 years
            )
            if (banError) {
              logger.error('Failed to ban Auth user', {
                email: dbUser.email,
                error: banError.message,
              })
              errors.push({
                authId: existingAuthUser.id,
                email: dbUser.email,
                error: banError.message,
              })
            } else {
              actions.push({
                email: dbUser.email,
                action: 'auth_banned',
                details: 'is_active=false in DB',
              })
              logger.info('Banned Auth user (DB is_active=false)', { email: dbUser.email })
            }
          } catch (authErr: any) {
            logger.error('Failed to ban Auth user', {
              email: dbUser.email,
              error: authErr.message,
            })
            errors.push({
              authId: existingAuthUser.id,
              email: dbUser.email,
              error: authErr.message,
            })
          }
          continue // Skip metadata update for banned users
        }

        // --- Un-ban active DB users that are currently banned in Auth ---
        if (dbUser.isActive && currentlyBanned) {
          try {
            const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(
              existingAuthUser.id,
              { ban_duration: 'none' }
            )
            if (unbanError) {
              logger.error('Failed to un-ban Auth user', {
                email: dbUser.email,
                error: unbanError.message,
              })
              errors.push({
                authId: existingAuthUser.id,
                email: dbUser.email,
                error: unbanError.message,
              })
            } else {
              actions.push({
                email: dbUser.email,
                action: 'auth_unbanned',
                details: 'is_active=true in DB',
              })
              logger.info('Un-banned Auth user (DB is_active=true)', { email: dbUser.email })
            }
          } catch (authErr: any) {
            logger.error('Failed to un-ban Auth user', {
              email: dbUser.email,
              error: authErr.message,
            })
            errors.push({
              authId: existingAuthUser.id,
              email: dbUser.email,
              error: authErr.message,
            })
          }
        }

        // --- Update Auth metadata if it has drifted from DB ---
        const auFirstName: string = existingAuthUser.user_metadata?.first_name || ''
        const auLastName: string = existingAuthUser.user_metadata?.last_name || ''
        const auFullName: string = existingAuthUser.user_metadata?.full_name || ''
        const auPhone: string =
          existingAuthUser.user_metadata?.phone_number || existingAuthUser.phone || ''
        const auRole: string = existingAuthUser.app_metadata?.role || ''

        const metadataDrifted =
          auFirstName !== (dbUser.firstName || '') ||
          auLastName !== (dbUser.lastName || '') ||
          auFullName !== (dbUser.fullName || '') ||
          auPhone !== (dbUser.phoneNumber || '') ||
          auRole !== dbUser.role

        if (metadataDrifted) {
          try {
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
              existingAuthUser.id,
              {
                user_metadata: {
                  first_name: dbUser.firstName || '',
                  last_name: dbUser.lastName || '',
                  full_name: dbUser.fullName || '',
                  phone_number: dbUser.phoneNumber || '',
                },
                app_metadata: { role: dbUser.role },
              }
            )
            if (updateError) {
              logger.error('Failed to update Auth metadata', {
                email: dbUser.email,
                error: updateError.message,
              })
              errors.push({
                authId: existingAuthUser.id,
                email: dbUser.email,
                error: updateError.message,
              })
            } else {
              actions.push({
                email: dbUser.email,
                action: 'auth_metadata_updated',
                details: `role=${dbUser.role}`,
              })
              logger.info('Updated Auth metadata from DB', { email: dbUser.email })
            }
          } catch (authErr: any) {
            logger.error('Failed to update Auth metadata', {
              email: dbUser.email,
              error: authErr.message,
            })
            errors.push({
              authId: existingAuthUser.id,
              email: dbUser.email,
              error: authErr.message,
            })
          }
        }
      }
    }

    // -----------------------------------------------------------------------
    // PHASE C: Orphan cleanup
    // Ban Auth users that have no corresponding record in public.users
    // -----------------------------------------------------------------------
    for (const au of authUsers) {
      const emailLower = au.email?.toLowerCase()
      const hasDbRecord =
        dbByAuthId.has(au.id) || (emailLower ? dbByEmail.has(emailLower) : false)

      if (!hasDbRecord) {
        if (isAuthUserBanned(au)) continue // Already banned

        try {
          const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(au.id, {
            ban_duration: '876000h',
          })
          if (banError) {
            logger.error('Failed to ban orphan Auth user', {
              email: au.email,
              error: banError.message,
            })
            errors.push({ authId: au.id, email: au.email, error: banError.message })
          } else {
            actions.push({
              email: au.email,
              action: 'auth_banned_orphan',
              details: 'no matching DB record',
            })
            logger.info('Banned orphan Auth user (no DB record)', { email: au.email })
          }
        } catch (authErr: any) {
          logger.error('Failed to ban orphan Auth user', {
            email: au.email,
            error: authErr.message,
          })
          errors.push({ authId: au.id, email: au.email, error: authErr.message })
        }
      }
    }

    // -----------------------------------------------------------------------
    // Build summary from the action log
    // -----------------------------------------------------------------------
    const summary = {
      authCreated: actions.filter((a) => a.action === 'auth_created').length,
      authBanned: actions.filter((a) => a.action === 'auth_banned').length,
      authUnbanned: actions.filter((a) => a.action === 'auth_unbanned').length,
      authMetadataUpdated: actions.filter((a) => a.action === 'auth_metadata_updated').length,
      authBannedOrphan: actions.filter((a) => a.action === 'auth_banned_orphan').length,
      dbCreated: actions.filter((a) => a.action === 'db_created').length,
      dbUpdated: actions.filter((a) => a.action === 'db_updated').length,
      errorCount: errors.length,
    }

    logger.info('User sync completed', summary)

    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      totalAuthUsers: authUsers.length,
      totalDbUsers: dbUsers.length,
      summary,
      actions,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err: any) {
    logger.error('Unhandled sync error', { error: err.message })
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred during sync' },
      { status: 500 }
    )
  }
}
