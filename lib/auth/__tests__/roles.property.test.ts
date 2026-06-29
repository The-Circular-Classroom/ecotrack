/**
 * Property 3: Role value validation
 * Feature: aws-to-vercel-supabase-migration, Property 3: Role value validation
 *
 * For any string provided as a user role value, the role validation function SHALL accept it
 * if and only if it is exactly one of: 'Admin', 'SchoolStaff', 'PsgVolunteer', or 'Parent'.
 *
 * Property 5: Role hierarchy authorization
 * Feature: aws-to-vercel-supabase-migration, Property 5: Role hierarchy authorization
 *
 * For any combination of (userRole, endpointCategory), the authorization function SHALL grant
 * access if and only if the role has sufficient privilege per the defined hierarchy: Admin accesses
 * all, SchoolStaff accesses inventory and CSV, PsgVolunteer accesses collection and donation drives,
 * Parent accesses only own profile and donation history.
 *
 * **Validates: Requirements 3.1, 3.4, 3.6, 3.7**
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  type UserRole,
  type EndpointCategory,
  VALID_ROLES,
  ROLE_HIERARCHY,
  CATEGORY_PERMISSIONS,
  isValidRole,
  hasPermission,
} from '../roles'

/** The four canonical valid role strings */
const VALID_ROLE_STRINGS: readonly string[] = ['Admin', 'SchoolStaff', 'PsgVolunteer', 'Parent']

/** All endpoint categories defined in the system */
const ALL_CATEGORIES: readonly EndpointCategory[] = [
  'userManagement',
  'inventory',
  'csv',
  'collection',
  'donationDrives',
  'ownProfile',
  'donationHistory',
  'analytics',
  'reports',
  'health',
]

/**
 * Expected access matrix: for each role, which categories they can access.
 * Derived from the hierarchy definition:
 * - Admin: all endpoints
 * - SchoolStaff: inventory, csv, collection, donationDrives, ownProfile, donationHistory, analytics, reports, health
 * - PsgVolunteer: collection, donationDrives, ownProfile, donationHistory, health
 * - Parent: ownProfile, donationHistory, health
 */
const EXPECTED_ACCESS: Record<UserRole, Set<EndpointCategory>> = {
  Admin: new Set([
    'userManagement',
    'inventory',
    'csv',
    'collection',
    'donationDrives',
    'ownProfile',
    'donationHistory',
    'analytics',
    'reports',
    'health',
  ]),
  SchoolStaff: new Set([
    'inventory',
    'csv',
    'collection',
    'donationDrives',
    'ownProfile',
    'donationHistory',
    'analytics',
    'reports',
    'health',
  ]),
  PsgVolunteer: new Set([
    'collection',
    'donationDrives',
    'ownProfile',
    'donationHistory',
    'health',
  ]),
  Parent: new Set([
    'ownProfile',
    'donationHistory',
    'health',
  ]),
}

describe('Feature: aws-to-vercel-supabase-migration, Property 3: Role value validation', () => {
  /**
   * Arbitrary that generates random strings — including near-miss variations
   * of valid roles (different casing, extra spaces, substrings, etc.)
   */
  const arbitraryStringArb = fc.oneof(
    fc.string({ minLength: 0, maxLength: 50 }),
    // Generate strings that look similar to valid roles but aren't
    fc.constantFrom(
      'admin', 'ADMIN', 'Admin ', ' Admin',
      'schoolStaff', 'School_Staff', 'SCHOOLSTAFF',
      'psgVolunteer', 'PSG_VOLUNTEER', 'Psg_Volunteer',
      'parent', 'PARENT', 'Parent ',
      'SuperAdmin', 'User', 'Moderator', 'Guest',
      '', ' ', 'null', 'undefined',
    ),
  )

  it('should accept a string if and only if it is exactly one of the four valid roles', () => {
    fc.assert(
      fc.property(arbitraryStringArb, (input: string) => {
        const result = isValidRole(input)
        const shouldBeValid = VALID_ROLE_STRINGS.includes(input)

        expect(result).toBe(shouldBeValid)
      }),
      { numRuns: 100 }
    )
  })

  it('should always accept the four valid role values', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_ROLE_STRINGS),
        (role: string) => {
          expect(isValidRole(role)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should reject any string that is not exactly one of the four valid roles', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }).filter(
          (s) => !VALID_ROLE_STRINGS.includes(s)
        ),
        (input: string) => {
          expect(isValidRole(input)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Feature: aws-to-vercel-supabase-migration, Property 5: Role hierarchy authorization', () => {
  /** Arbitrary that picks a valid UserRole */
  const roleArb = fc.constantFrom<UserRole>('Admin', 'SchoolStaff', 'PsgVolunteer', 'Parent')

  /** Arbitrary that picks an EndpointCategory */
  const categoryArb = fc.constantFrom<EndpointCategory>(...ALL_CATEGORIES)

  it('should grant access if and only if the role has sufficient privilege per the defined hierarchy', () => {
    fc.assert(
      fc.property(roleArb, categoryArb, (role: UserRole, category: EndpointCategory) => {
        const permission = CATEGORY_PERMISSIONS[category]
        const result = hasPermission(role, permission)
        const expected = EXPECTED_ACCESS[role].has(category)

        expect(result).toBe(expected)
      }),
      { numRuns: 100 }
    )
  })

  it('Admin should have access to all endpoint categories', () => {
    fc.assert(
      fc.property(categoryArb, (category: EndpointCategory) => {
        const permission = CATEGORY_PERMISSIONS[category]
        expect(hasPermission('Admin', permission)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('SchoolStaff should access inventory and CSV but not userManagement', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<EndpointCategory>('inventory', 'csv'),
        (category: EndpointCategory) => {
          const permission = CATEGORY_PERMISSIONS[category]
          expect(hasPermission('SchoolStaff', permission)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )

    // SchoolStaff should NOT access userManagement
    expect(hasPermission('SchoolStaff', CATEGORY_PERMISSIONS.userManagement)).toBe(false)
  })

  it('PsgVolunteer should access collection and donation drives but not inventory or CSV', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<EndpointCategory>('collection', 'donationDrives'),
        (category: EndpointCategory) => {
          const permission = CATEGORY_PERMISSIONS[category]
          expect(hasPermission('PsgVolunteer', permission)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )

    // PsgVolunteer should NOT access inventory or CSV
    expect(hasPermission('PsgVolunteer', CATEGORY_PERMISSIONS.inventory)).toBe(false)
    expect(hasPermission('PsgVolunteer', CATEGORY_PERMISSIONS.csv)).toBe(false)
  })

  it('Parent should access only own profile and donation history', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<EndpointCategory>('ownProfile', 'donationHistory'),
        (category: EndpointCategory) => {
          const permission = CATEGORY_PERMISSIONS[category]
          expect(hasPermission('Parent', permission)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )

    // Parent should NOT access higher privilege categories
    expect(hasPermission('Parent', CATEGORY_PERMISSIONS.inventory)).toBe(false)
    expect(hasPermission('Parent', CATEGORY_PERMISSIONS.csv)).toBe(false)
    expect(hasPermission('Parent', CATEGORY_PERMISSIONS.collection)).toBe(false)
    expect(hasPermission('Parent', CATEGORY_PERMISSIONS.donationDrives)).toBe(false)
    expect(hasPermission('Parent', CATEGORY_PERMISSIONS.userManagement)).toBe(false)
  })

  it('higher roles in the hierarchy should have access to everything lower roles can access', () => {
    fc.assert(
      fc.property(categoryArb, (category: EndpointCategory) => {
        const permission = CATEGORY_PERMISSIONS[category]

        // If Parent can access it, all higher roles should too
        if (hasPermission('Parent', permission)) {
          expect(hasPermission('PsgVolunteer', permission)).toBe(true)
          expect(hasPermission('SchoolStaff', permission)).toBe(true)
          expect(hasPermission('Admin', permission)).toBe(true)
        }

        // If PsgVolunteer can access it, SchoolStaff and Admin should too
        if (hasPermission('PsgVolunteer', permission)) {
          expect(hasPermission('SchoolStaff', permission)).toBe(true)
          expect(hasPermission('Admin', permission)).toBe(true)
        }

        // If SchoolStaff can access it, Admin should too
        if (hasPermission('SchoolStaff', permission)) {
          expect(hasPermission('Admin', permission)).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })
})
