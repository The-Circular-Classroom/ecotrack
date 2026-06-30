import type { PrismaClient } from '@/lib/prisma/generated/client/client'
import type { ParsedRow } from './parser'

export interface ValidationError {
  row: number
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  validRows: number
  invalidRows: number
}

export const REQUIRED_FIELDS = [
  'item_type_id',
  'size_name',
  'user_id',
  'school_id',
  'donation_drive_id',
  'to_stored_at',
  'quantity',
  'to_status',
] as const

export const MAX_ERRORS = 50

/**
 * Checks if the combination of storage location "school" and status "for_repurposing" is forbidden.
 */
export function isForbiddenCombination(storedAt: string, status: string): boolean {
  return (
    storedAt.toLowerCase() === 'school' &&
    status.toLowerCase() === 'for_repurposing'
  )
}

/**
 * Returns an array of required field names that are missing or empty in the given row.
 */
export function getMissingFields(row: Record<string, string>): string[] {
  return REQUIRED_FIELDS.filter(
    (field) => !row[field] || row[field].trim() === ''
  )
}

/**
 * Validates an array of parsed CSV rows against required fields and database state.
 *
 * Validation steps per row:
 * 1. Check all required fields are present and non-empty
 * 2. Check forbidden combination: to_stored_at="school" + to_status="for_repurposing"
 * 3. Validate against database:
 *    - User exists and is active
 *    - School exists and is cooperating
 *    - Donation drive exists, is active (current date within start/end), and belongs to the school
 *    - Item type exists
 *    - Size option exists for the item type's size category
 *
 * Error reporting is capped at MAX_ERRORS (50) entries.
 */
export async function validateDonationCsv(
  rows: ParsedRow[],
  prisma: PrismaClient
): Promise<ValidationResult> {
  const errors: ValidationError[] = []
  const invalidRowIndices = new Set<number>()

  function addError(row: number, field: string, message: string): void {
    if (errors.length < MAX_ERRORS) {
      errors.push({ row, field, message })
    }
    invalidRowIndices.add(row)
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNumber = i + 1 // 1-based row number

    // Step 1: Check required fields
    const missingFields = getMissingFields(row)
    if (missingFields.length > 0) {
      for (const field of missingFields) {
        addError(rowNumber, field, `Required field "${field}" is missing or empty`)
        if (errors.length >= MAX_ERRORS) break
      }
      // Skip database validation for rows with missing required fields
      continue
    }

    // Step 2: Check forbidden combination
    if (isForbiddenCombination(row.to_stored_at, row.to_status)) {
      addError(
        rowNumber,
        'to_stored_at',
        'Storage location "school" with status "for_repurposing" is not permitted'
      )
      if (errors.length >= MAX_ERRORS) continue
    }

    // Step 3: Database validations
    // 3a. Validate user exists and is active
    const userId = parseInt(row.user_id, 10)
    if (!isNaN(userId)) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isActive: true },
      })
      if (!user) {
        addError(rowNumber, 'user_id', `User with id ${row.user_id} does not exist`)
      } else if (!user.isActive) {
        addError(rowNumber, 'user_id', `User with id ${row.user_id} is not active`)
      }
      if (errors.length >= MAX_ERRORS) continue
    } else {
      addError(rowNumber, 'user_id', `Invalid user_id value: "${row.user_id}"`)
      if (errors.length >= MAX_ERRORS) continue
    }

    // 3b. Validate school exists and is cooperating
    const schoolId = parseInt(row.school_id, 10)
    if (!isNaN(schoolId)) {
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { id: true, isCooperating: true },
      })
      if (!school) {
        addError(rowNumber, 'school_id', `School with id ${row.school_id} does not exist`)
      } else if (!school.isCooperating) {
        addError(rowNumber, 'school_id', `School with id ${row.school_id} is not cooperating`)
      }
      if (errors.length >= MAX_ERRORS) continue
    } else {
      addError(rowNumber, 'school_id', `Invalid school_id value: "${row.school_id}"`)
      if (errors.length >= MAX_ERRORS) continue
    }

    // 3c. Validate donation drive exists, is active, and belongs to the school
    const donationDriveId = parseInt(row.donation_drive_id, 10)
    if (!isNaN(donationDriveId)) {
      const drive = await prisma.donationDrive.findUnique({
        where: { id: donationDriveId },
        select: { id: true, startDate: true, endDate: true, schoolId: true },
      })
      if (!drive) {
        addError(
          rowNumber,
          'donation_drive_id',
          `Donation drive with id ${row.donation_drive_id} does not exist`
        )
      } else {
        const now = new Date()
        const startDate = new Date(drive.startDate)
        const endDate = new Date(drive.endDate)

        if (now < startDate || now > endDate) {
          addError(
            rowNumber,
            'donation_drive_id',
            `Donation drive with id ${row.donation_drive_id} is not active. Valid date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
          )
        }

        if (drive.schoolId !== schoolId) {
          addError(
            rowNumber,
            'donation_drive_id',
            `Donation drive with id ${row.donation_drive_id} does not belong to school with id ${row.school_id}`
          )
        }
      }
      if (errors.length >= MAX_ERRORS) continue
    } else {
      addError(
        rowNumber,
        'donation_drive_id',
        `Invalid donation_drive_id value: "${row.donation_drive_id}"`
      )
      if (errors.length >= MAX_ERRORS) continue
    }

    // 3d. Validate item type exists
    const itemTypeId = parseInt(row.item_type_id, 10)
    if (!isNaN(itemTypeId)) {
      const itemType = await prisma.itemType.findUnique({
        where: { id: itemTypeId },
        select: { id: true, sizeCategoryId: true },
      })
      if (!itemType) {
        addError(
          rowNumber,
          'item_type_id',
          `Item type with id ${row.item_type_id} does not exist`
        )
      } else {
        // 3e. Validate size option exists for the item type's size category
        const sizeOption = await prisma.sizeOption.findFirst({
          where: {
            sizeCategoryId: itemType.sizeCategoryId,
            sizeName: row.size_name,
          },
          select: { id: true },
        })
        if (!sizeOption) {
          addError(
            rowNumber,
            'size_name',
            `Size "${row.size_name}" does not exist for item type with id ${row.item_type_id}`
          )
        }
      }
      if (errors.length >= MAX_ERRORS) continue
    } else {
      addError(
        rowNumber,
        'item_type_id',
        `Invalid item_type_id value: "${row.item_type_id}"`
      )
      if (errors.length >= MAX_ERRORS) continue
    }
  }

  const invalidRows = invalidRowIndices.size
  const validRows = rows.length - invalidRows

  return {
    valid: errors.length === 0,
    errors,
    validRows,
    invalidRows,
  }
}
