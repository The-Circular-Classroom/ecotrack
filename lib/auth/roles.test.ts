import { describe, it, expect } from 'vitest'
import {
  type UserRole,
  VALID_ROLES,
  ROLE_HIERARCHY,
  CATEGORY_PERMISSIONS,
  isValidRole,
  hasPermission,
  requireRole,
} from './roles'

describe('lib/auth/roles', () => {
  describe('VALID_ROLES', () => {
    it('contains exactly four roles', () => {
      expect(VALID_ROLES).toHaveLength(4)
    })

    it('contains Admin, SchoolStaff, PsgVolunteer, Parent', () => {
      expect(VALID_ROLES).toContain('Admin')
      expect(VALID_ROLES).toContain('SchoolStaff')
      expect(VALID_ROLES).toContain('PsgVolunteer')
      expect(VALID_ROLES).toContain('Parent')
    })
  })

  describe('ROLE_HIERARCHY', () => {
    it('assigns Admin the highest level', () => {
      expect(ROLE_HIERARCHY.Admin).toBe(4)
    })

    it('assigns SchoolStaff level 3', () => {
      expect(ROLE_HIERARCHY.SchoolStaff).toBe(3)
    })

    it('assigns PsgVolunteer level 2', () => {
      expect(ROLE_HIERARCHY.PsgVolunteer).toBe(2)
    })

    it('assigns Parent the lowest level', () => {
      expect(ROLE_HIERARCHY.Parent).toBe(1)
    })

    it('maintains strict ordering Admin > SchoolStaff > PsgVolunteer > Parent', () => {
      expect(ROLE_HIERARCHY.Admin).toBeGreaterThan(ROLE_HIERARCHY.SchoolStaff)
      expect(ROLE_HIERARCHY.SchoolStaff).toBeGreaterThan(ROLE_HIERARCHY.PsgVolunteer)
      expect(ROLE_HIERARCHY.PsgVolunteer).toBeGreaterThan(ROLE_HIERARCHY.Parent)
    })
  })

  describe('isValidRole', () => {
    it('returns true for each valid role', () => {
      expect(isValidRole('Admin')).toBe(true)
      expect(isValidRole('SchoolStaff')).toBe(true)
      expect(isValidRole('PsgVolunteer')).toBe(true)
      expect(isValidRole('Parent')).toBe(true)
    })

    it('returns false for invalid role strings', () => {
      expect(isValidRole('admin')).toBe(false)
      expect(isValidRole('ADMIN')).toBe(false)
      expect(isValidRole('school_staff')).toBe(false)
      expect(isValidRole('SuperAdmin')).toBe(false)
      expect(isValidRole('')).toBe(false)
      expect(isValidRole(' Admin')).toBe(false)
      expect(isValidRole('Admin ')).toBe(false)
    })
  })

  describe('hasPermission', () => {
    describe('with allowedRoles', () => {
      it('grants access when user role is in the allowed list', () => {
        expect(hasPermission('Admin', { allowedRoles: ['Admin'] })).toBe(true)
        expect(hasPermission('SchoolStaff', { allowedRoles: ['SchoolStaff', 'Admin'] })).toBe(true)
      })

      it('denies access when user role is not in the allowed list', () => {
        expect(hasPermission('Parent', { allowedRoles: ['Admin'] })).toBe(false)
        expect(hasPermission('PsgVolunteer', { allowedRoles: ['Admin', 'SchoolStaff'] })).toBe(false)
      })
    })

    describe('with minRole', () => {
      it('grants access when user role meets minimum', () => {
        expect(hasPermission('Admin', { minRole: 'Parent' })).toBe(true)
        expect(hasPermission('Admin', { minRole: 'Admin' })).toBe(true)
        expect(hasPermission('SchoolStaff', { minRole: 'SchoolStaff' })).toBe(true)
        expect(hasPermission('SchoolStaff', { minRole: 'PsgVolunteer' })).toBe(true)
      })

      it('denies access when user role is below minimum', () => {
        expect(hasPermission('Parent', { minRole: 'Admin' })).toBe(false)
        expect(hasPermission('Parent', { minRole: 'SchoolStaff' })).toBe(false)
        expect(hasPermission('PsgVolunteer', { minRole: 'SchoolStaff' })).toBe(false)
      })
    })

    describe('with no restrictions', () => {
      it('grants access to any role when no restrictions specified', () => {
        const roles: UserRole[] = ['Admin', 'SchoolStaff', 'PsgVolunteer', 'Parent']
        for (const role of roles) {
          expect(hasPermission(role, {})).toBe(true)
        }
      })
    })

    describe('allowedRoles takes precedence over minRole', () => {
      it('uses allowedRoles when both are specified', () => {
        // Admin has higher level than SchoolStaff, but allowedRoles restricts to SchoolStaff only
        expect(
          hasPermission('Admin', { allowedRoles: ['SchoolStaff'], minRole: 'Parent' })
        ).toBe(false)
      })
    })
  })

  describe('requireRole', () => {
    it('returns true when role meets minimum', () => {
      expect(requireRole('Admin', 'Parent')).toBe(true)
      expect(requireRole('Admin', 'Admin')).toBe(true)
      expect(requireRole('SchoolStaff', 'PsgVolunteer')).toBe(true)
    })

    it('returns false when role is below minimum', () => {
      expect(requireRole('Parent', 'Admin')).toBe(false)
      expect(requireRole('PsgVolunteer', 'SchoolStaff')).toBe(false)
    })

    it('returns false for null role', () => {
      expect(requireRole(null, 'Parent')).toBe(false)
    })

    it('returns false for invalid role strings', () => {
      expect(requireRole('invalid', 'Parent')).toBe(false)
      expect(requireRole('', 'Parent')).toBe(false)
    })
  })

  describe('CATEGORY_PERMISSIONS', () => {
    it('restricts userManagement to Admin only', () => {
      expect(hasPermission('Admin', CATEGORY_PERMISSIONS.userManagement)).toBe(true)
      expect(hasPermission('SchoolStaff', CATEGORY_PERMISSIONS.userManagement)).toBe(false)
      expect(hasPermission('PsgVolunteer', CATEGORY_PERMISSIONS.userManagement)).toBe(false)
      expect(hasPermission('Parent', CATEGORY_PERMISSIONS.userManagement)).toBe(false)
    })

    it('allows SchoolStaff and above for inventory', () => {
      expect(hasPermission('Admin', CATEGORY_PERMISSIONS.inventory)).toBe(true)
      expect(hasPermission('SchoolStaff', CATEGORY_PERMISSIONS.inventory)).toBe(true)
      expect(hasPermission('PsgVolunteer', CATEGORY_PERMISSIONS.inventory)).toBe(false)
      expect(hasPermission('Parent', CATEGORY_PERMISSIONS.inventory)).toBe(false)
    })

    it('allows PsgVolunteer and above for CSV upload, Admin only for CSV approve', () => {
      expect(hasPermission('Admin', CATEGORY_PERMISSIONS.csvUpload)).toBe(true)
      expect(hasPermission('SchoolStaff', CATEGORY_PERMISSIONS.csvUpload)).toBe(true)
      expect(hasPermission('PsgVolunteer', CATEGORY_PERMISSIONS.csvUpload)).toBe(true)
      expect(hasPermission('Parent', CATEGORY_PERMISSIONS.csvUpload)).toBe(false)

      expect(hasPermission('Admin', CATEGORY_PERMISSIONS.csvApprove)).toBe(true)
      expect(hasPermission('SchoolStaff', CATEGORY_PERMISSIONS.csvApprove)).toBe(false)
      expect(hasPermission('PsgVolunteer', CATEGORY_PERMISSIONS.csvApprove)).toBe(false)
      expect(hasPermission('Parent', CATEGORY_PERMISSIONS.csvApprove)).toBe(false)
    })

    it('allows PsgVolunteer and above for collection', () => {
      expect(hasPermission('Admin', CATEGORY_PERMISSIONS.collection)).toBe(true)
      expect(hasPermission('SchoolStaff', CATEGORY_PERMISSIONS.collection)).toBe(true)
      expect(hasPermission('PsgVolunteer', CATEGORY_PERMISSIONS.collection)).toBe(true)
      expect(hasPermission('Parent', CATEGORY_PERMISSIONS.collection)).toBe(false)
    })

    it('allows PsgVolunteer and above for donationDrives', () => {
      expect(hasPermission('Admin', CATEGORY_PERMISSIONS.donationDrives)).toBe(true)
      expect(hasPermission('SchoolStaff', CATEGORY_PERMISSIONS.donationDrives)).toBe(true)
      expect(hasPermission('PsgVolunteer', CATEGORY_PERMISSIONS.donationDrives)).toBe(true)
      expect(hasPermission('Parent', CATEGORY_PERMISSIONS.donationDrives)).toBe(false)
    })

    it('allows all roles for ownProfile', () => {
      expect(hasPermission('Admin', CATEGORY_PERMISSIONS.ownProfile)).toBe(true)
      expect(hasPermission('SchoolStaff', CATEGORY_PERMISSIONS.ownProfile)).toBe(true)
      expect(hasPermission('PsgVolunteer', CATEGORY_PERMISSIONS.ownProfile)).toBe(true)
      expect(hasPermission('Parent', CATEGORY_PERMISSIONS.ownProfile)).toBe(true)
    })

    it('allows all roles for donationHistory', () => {
      expect(hasPermission('Admin', CATEGORY_PERMISSIONS.donationHistory)).toBe(true)
      expect(hasPermission('SchoolStaff', CATEGORY_PERMISSIONS.donationHistory)).toBe(true)
      expect(hasPermission('PsgVolunteer', CATEGORY_PERMISSIONS.donationHistory)).toBe(true)
      expect(hasPermission('Parent', CATEGORY_PERMISSIONS.donationHistory)).toBe(true)
    })

    it('allows any role for health (public)', () => {
      expect(hasPermission('Admin', CATEGORY_PERMISSIONS.health)).toBe(true)
      expect(hasPermission('Parent', CATEGORY_PERMISSIONS.health)).toBe(true)
    })
  })
})
