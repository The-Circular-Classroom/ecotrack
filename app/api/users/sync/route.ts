import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { UserRole } from '@/lib/prisma/generated/client/client'
import { createApiLogger } from '@/lib/logger'

/**
 * GET /api/users/sync - Alias of POST for legacy client support.
 */
export async function GET(request: NextRequest) {
  return POST(request)
}

/**
 * POST /api/users/sync - Sync users between Supabase Auth and database.
 * Compares and updates both ways:
 * 1. Pulls from Supabase Auth and adds missing database users or updates modified profiles.
 * 2. Pulls from database and creates missing Supabase Auth users, updates metadata, or disables (bans) them if inactive.
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
    // 1. Fetch all users from Supabase Auth
    const authUsers: Array<any> = []
    let page = 1
    const perPage = 100

    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      })

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

    // 2. Fetch all users from database
    const dbUsers = await prisma.user.findMany()
    logger.info('Fetched users from Database', { count: dbUsers.length })

    const authById = new Map(authUsers.map((u) => [u.id, u]))
    const authByEmail = new Map(authUsers.map((u) => [u.email?.toLowerCase(), u]))

    const dbById = new Map(dbUsers.map((u) => [u.supabaseAuthId, u]))
    const dbByEmail = new Map(
      dbUsers
        .filter((u) => u.email)
        .map((u) => [u.email.toLowerCase(), u])
    )

    let dbCreated = 0
    let dbUpdated = 0
    let supabaseCreated = 0
    let supabaseUpdated = 0
    let supabaseDisabled = 0
    const errors: Array<{ authId?: string; email?: string; error: string }> = []

    // --- PHASE A: Sync from Supabase Auth to DB ---
    for (const au of authUsers) {
      const emailLower = au.email?.toLowerCase()
      const existingDbUser = dbById.get(au.id) || (emailLower ? dbByEmail.get(emailLower) : null)

      const auFirstName = au.user_metadata?.first_name || ''
      const auLastName = au.user_metadata?.last_name || ''
      const auFullName = au.user_metadata?.full_name || [auFirstName, auLastName].filter(Boolean).join(' ')
      const auPhone = au.user_metadata?.phone_number || au.phone || ''
      const auRole = (au.app_metadata?.role as UserRole) || UserRole.Parent
      const auIsActive = au.banned_until ? false : true

      if (!existingDbUser) {
        // Create DB record
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
          dbCreated++
          logger.info('Created missing DB user from Auth', { email: au.email })
        } catch (dbErr: any) {
          logger.error('Failed to create DB user during sync', { email: au.email, error: dbErr.message })
          errors.push({
            authId: au.id,
            email: au.email,
            error: dbErr.message,
          })
        }
      } else {
        // Check for updates to apply to DB
        const diff =
          existingDbUser.supabaseAuthId !== au.id ||
          existingDbUser.firstName !== (auFirstName || null) ||
          existingDbUser.lastName !== (auLastName || null) ||
          existingDbUser.fullName !== (auFullName || null) ||
          existingDbUser.phoneNumber !== (auPhone || null) ||
          existingDbUser.role !== auRole ||
          existingDbUser.isActive !== auIsActive

        if (diff) {
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
            dbUpdated++
            logger.info('Updated DB user details from Auth', { email: au.email })
          } catch (dbErr: any) {
            logger.error('Failed to update DB user details during sync', { email: au.email, error: dbErr.message })
            errors.push({
              authId: au.id,
              email: au.email,
              error: dbErr.message,
            })
          }
        }
      }
    }

    // --- PHASE B: Sync from DB to Supabase Auth ---
    for (const dbUser of dbUsers) {
      const existingAuthUser =
        authById.get(dbUser.supabaseAuthId) ||
        (dbUser.email ? authByEmail.get(dbUser.email.toLowerCase()) : undefined)

      if (!existingAuthUser) {
        // Create user in Supabase Auth
        try {
          const tempPassword = generateTempPassword()
          const { data: newAuth, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
            email: dbUser.email,
            password: tempPassword,
            email_confirm: true,
            app_metadata: { role: dbUser.role },
            user_metadata: {
              first_name: dbUser.firstName || '',
              last_name: dbUser.lastName || '',
              full_name: dbUser.fullName || '',
              phone_number: dbUser.phoneNumber || '',
            },
          })

          if (createAuthError) {
            logger.error('Failed to create Auth user during sync', { email: dbUser.email, error: createAuthError.message })
            errors.push({
              authId: dbUser.supabaseAuthId,
              email: dbUser.email,
              error: createAuthError.message,
            })
          } else if (newAuth?.user) {
            // Update supabaseAuthId in DB to match new ID
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { supabaseAuthId: newAuth.user.id },
            })
            supabaseCreated++
            logger.info('Created missing Supabase Auth user from DB', { email: dbUser.email })
          }
        } catch (authErr: any) {
          logger.error('Failed to create Auth user from DB', { email: dbUser.email, error: authErr.message })
          errors.push({
            authId: dbUser.supabaseAuthId,
            email: dbUser.email,
            error: authErr.message,
          })
        }
      } else {
        // Check for updates to apply to Supabase Auth
        const auFirstName = existingAuthUser.user_metadata?.first_name || ''
        const auLastName = existingAuthUser.user_metadata?.last_name || ''
        const auFullName = existingAuthUser.user_metadata?.full_name || ''
        const auPhone = existingAuthUser.user_metadata?.phone_number || existingAuthUser.phone || ''
        const auRole = existingAuthUser.app_metadata?.role || ''
        const auIsActive = existingAuthUser.banned_until ? false : true

        const diffMeta =
          auFirstName !== (dbUser.firstName || '') ||
          auLastName !== (dbUser.lastName || '') ||
          auFullName !== (dbUser.fullName || '') ||
          auPhone !== (dbUser.phoneNumber || '') ||
          auRole !== dbUser.role

        const diffBan = auIsActive !== dbUser.isActive

        if (diffMeta || diffBan) {
          try {
            const updates: Record<string, any> = {}
            if (diffMeta) {
              updates.user_metadata = {
                first_name: dbUser.firstName || '',
                last_name: dbUser.lastName || '',
                full_name: dbUser.fullName || '',
                phone_number: dbUser.phoneNumber || '',
              }
              updates.app_metadata = { role: dbUser.role }
            }
            if (diffBan) {
              // Ban duration: '876000h' is ~100 years (disables user), 'none' lifts the ban
              updates.ban_duration = dbUser.isActive ? 'none' : '876000h'
              if (!dbUser.isActive) {
                supabaseDisabled++
              }
            }

            const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
              existingAuthUser.id,
              updates
            )

            if (updateAuthError) {
              logger.error('Failed to update Auth user during sync', { email: dbUser.email, error: updateAuthError.message })
              errors.push({
                authId: dbUser.supabaseAuthId,
                email: dbUser.email,
                error: updateAuthError.message,
              })
            } else {
              supabaseUpdated++
              logger.info('Updated Supabase Auth user from DB', { email: dbUser.email })
            }
          } catch (authErr: any) {
            logger.error('Failed to update Auth user from DB', { email: dbUser.email, error: authErr.message })
            errors.push({
              authId: dbUser.supabaseAuthId,
              email: dbUser.email,
              error: authErr.message,
            })
          }
        }
      }
    }

    logger.info('User sync completed successfully')
    return NextResponse.json({
      success: true,
      message: `Sync completed successfully.\nSummary:\n- DB Created: ${dbCreated}, Updated: ${dbUpdated}\n- Supabase Created: ${supabaseCreated}, Updated: ${supabaseUpdated}, Disabled: ${supabaseDisabled}`,
      totalAuthUsers: authUsers.length,
      existingDbUsers: dbUsers.filter((u) => u.supabaseAuthId).length,
      created: dbCreated,
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

function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
