import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma/client'
import {
  validatePassword,
  validateEmail,
  validateProfileFields,
} from '@/lib/auth/validation'

/**
 * POST /api/auth/register
 *
 * Registers a new user with email and password.
 * Requires email confirmation. Assigns default role 'Parent'.
 *
 * Requirements: 2.1 (email/password registration, min 8 char password, email confirmation)
 *               2.7 (profile field validation)
 *               2.8 (default Parent role)
 *               2.10 (email already registered error)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, fullName, phoneNumber } = body

    // Validate required fields
    const emailError = validateEmail(email)
    if (emailError) {
      return NextResponse.json(
        { error: 'validation_error', message: emailError.message },
        { status: 400 }
      )
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      return NextResponse.json(
        { error: 'validation_error', message: passwordError.message },
        { status: 400 }
      )
    }

    // Validate optional profile fields
    const profileErrors = validateProfileFields({
      firstName,
      lastName,
      fullName,
      phoneNumber,
    })
    if (profileErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: profileErrors[0].message,
          details: profileErrors,
        },
        { status: 400 }
      )
    }

    // Check if email already exists using the admin client
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const emailExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    )

    if (emailExists) {
      // Requirement 2.10: generic "unavailable" message
      return NextResponse.json(
        { error: 'email_unavailable', message: 'Email is unavailable' },
        { status: 409 }
      )
    }

    // Create user with Supabase Auth
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName || '',
          last_name: lastName || '',
          full_name: fullName || '',
          phone_number: phoneNumber || '',
        },
        emailRedirectTo: `${request.nextUrl.origin}/api/auth/callback`,
      },
    })

    if (error) {
      // Handle Supabase-specific errors
      console.error('Supbase Auth signup error:', error)
      if (
        error.message?.includes('already registered') ||
        error.message?.includes('already been registered')
      ) {
        return NextResponse.json(
          { error: 'email_unavailable', message: 'Email is unavailable' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: 'registration_failed', message: 'Registration failed' },
        { status: 400 }
      )
    }

    // Set default role to Parent using admin client (Requirement 2.8)
    if (data.user) {
      await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
        app_metadata: { role: 'Parent' },
      })

      // Create Prisma user record to keep Supabase Auth and Prisma in sync
      try {
        await prisma.user.upsert({
          where: { supabaseAuthId: data.user.id },
          update: {},
          create: {
            supabaseAuthId: data.user.id,
            email: email.toLowerCase(),
            firstName: firstName || null,
            lastName: lastName || null,
            fullName: fullName || null,
            phoneNumber: phoneNumber || null,
            role: 'Parent',
          },
        })
      } catch (prismaError) {
        // Rollback: delete the Supabase user if Prisma creation fails
        await supabaseAdmin.auth.admin.deleteUser(data.user.id)
        console.error('Prisma user creation failed, rolled back Supabase user:', prismaError)
        return NextResponse.json(
          { error: 'registration_failed', message: 'Registration failed' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      {
        message:
          'Registration successful. Please check your email to confirm your account.',
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { error: 'internal_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
