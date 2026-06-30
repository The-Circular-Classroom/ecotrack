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
 * POST /api/auth/signup
 *
 * Creates a new user account and triggers email verification.
 * Accepts full profile fields (fullName, firstName, lastName, phoneNumber, email, password).
 * Stores name and phone fields in user_metadata.
 *
 * This endpoint is used by the legacy-style registration form and exists
 * alongside the existing POST /api/auth/register endpoint (which remains unchanged).
 *
 * Requirements: 2.4 (full registration form with all legacy fields)
 *               3.1 (new endpoint added alongside existing ones)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, firstName, lastName, phoneNumber, email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'validation_error', message: 'Email and password are required' },
        { status: 400 }
      )
    }

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
      return NextResponse.json(
        { error: 'email_unavailable', message: 'Email is unavailable' },
        { status: 409 }
      )
    }

    // Create user with Supabase Auth, storing profile fields in user_metadata
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

    // Create Prisma user record to keep Supabase Auth and Prisma in sync
    if (data.user) {
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
        success: true,
        message: 'Verification code sent',
        session: null,
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
