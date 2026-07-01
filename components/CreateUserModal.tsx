'use client'

import React, { useState, useEffect } from 'react'
import { CircularProgress } from '@mui/material'
import CustomButton from '@/components/ui/CustomButton'
import { getErrorMessage, parseApiResponse, withFallbackMessage } from '@/utils/apiResponse'

const ROLE_OPTIONS = ['Admin', 'SchoolStaff', 'PsgVolunteer', 'Parent']

interface CreateUserModalProps {
  onClose: (result: { success: boolean; message: string; data?: any } | null) => void
  loggedInSchoolId?: number | null
}

export default function CreateUserModal({ onClose, loggedInSchoolId = null }: CreateUserModalProps) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 'Parent',
    schoolId: loggedInSchoolId ? String(loggedInSchoolId) : '',
    isActive: true,
  })

  const [schools, setSchools] = useState<any[]>([])
  const [loadingSchools, setLoadingSchools] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (loggedInSchoolId) {
      setForm((prev) => ({ ...prev, schoolId: String(loggedInSchoolId) }))
    }
  }, [loggedInSchoolId])

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const res = await fetch('/api/schools')
        const result = await res.json()
        setSchools(result.schools || result.data || [])
      } catch (err) {
        console.error('Failed to fetch schools:', err)
      } finally {
        setLoadingSchools(false)
      }
    }
    fetchSchools()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => {
      if (name === 'role') {
        const isRoleAdmin = `${value || ''}`.toLowerCase() === 'admin'
        return {
          ...prev,
          role: value,
          schoolId: isRoleAdmin ? '' : prev.schoolId,
        }
      }

      return { ...prev, [name]: value }
    })
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const isTargetUserAdmin = `${form.role || ''}`.toLowerCase() === 'admin'
    const newErrors: Record<string, string> = {}
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required.'
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required.'
    if (!form.email.trim()) {
      newErrors.email = 'Email is required.'
    } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      newErrors.email = 'Please provide a valid email address.'
    }
    if (!form.role) newErrors.role = 'Role is required.'
    if (!isTargetUserAdmin && !form.schoolId) newErrors.schoolId = 'School is required.'
    return newErrors
  }

  const handleSubmit = async () => {
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          fullName: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim() || null,
          role: form.role,
          schoolId: `${form.role || ''}`.toLowerCase() === 'admin'
            ? null
            : parseInt(form.schoolId, 10),
          isActive: true,
        }),
      })

      const { payload: result, message: responseMessage } = await parseApiResponse(response)
      onClose({
        success: response.ok,
        message: withFallbackMessage(responseMessage, response.ok ? 'User created successfully' : 'Failed to create user'),
        data: result?.data || result?.user || null,
      })
    } catch (err) {
      console.error('Submit error:', err)
      onClose({ success: false, message: getErrorMessage(err, 'Failed to create user') })
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    'w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'

  const inputErrorCls =
    'w-full px-3 py-2 border border-red-400 rounded-md text-sm text-gray-900 bg-white ' +
    'focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-colors'

  const selectCls =
    'w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm text-gray-900 bg-white ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer ' +
    "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMS41TDYgNi41TDExIDEuNSIgc3Ryb2tlPSIjNkI3MjgwIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] " +
    'bg-no-repeat bg-[center_right_0.75rem] disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-100'

  const labelCls = 'block text-sm font-medium text-gray-900 mb-2'

  const isFormValid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.role

  return (
    <div className="flex flex-col">
      {/* Fields */}
      <div className="flex flex-col gap-5 p-6">
        <div>
          <p className="text-base font-semibold text-gray-900">Add User</p>
          <p className="text-sm text-gray-500 mt-1">Create a new user account for the platform.</p>
        </div>

        <div>
          <label className={labelCls}>
            First Name<span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleChange as any}
            placeholder="e.g. Rajesh"
            className={errors.firstName ? inputErrorCls : inputCls}
          />
          {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              Last Name<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange as any}
              placeholder="e.g. Kumar"
              className={errors.lastName ? inputErrorCls : inputCls}
            />
            {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
          </div>
          <div>
            <label className={labelCls}>
              Role<span className="text-red-500 ml-0.5">*</span>
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange as any}
              className={selectCls}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
          </div>
        </div>

        <div>
          <label className={labelCls}>
            Email<span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange as any}
            placeholder="e.g. staff@tmjc.moe.edu.sg"
            className={errors.email ? inputErrorCls : inputCls}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Phone Number</label>
            <input
              type="text"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange as any}
              placeholder="e.g. +6591234567"
              className={inputCls}
            />
          </div>
          {`${form.role || ''}`.toLowerCase() !== 'admin' && (
            <div>
              <label className={labelCls}>Assigned School<span className="text-red-500 ml-0.5">*</span></label>
              <select
                name="schoolId"
                value={form.schoolId}
                onChange={handleChange as any}
                disabled={loadingSchools}
                className={errors.schoolId ? inputErrorCls : selectCls}
              >
                <option value="" disabled>Select School</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.schoolName}
                  </option>
                ))}
              </select>
              {errors.schoolId && <p className="text-xs text-red-500 mt-1">{errors.schoolId}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
        <CustomButton
          variant="ghost"
          onClick={() => onClose(null)}
          disabled={submitting}
          icon={null}
          className="flex-1"
        >
          Cancel
        </CustomButton>
        <CustomButton
          onClick={handleSubmit}
          disabled={submitting || !isFormValid}
          icon={submitting ? <CircularProgress size={14} color="inherit" /> : null}
          className="flex-1"
        >
          {submitting ? 'Saving...' : 'Create User'}
        </CustomButton>
      </div>
    </div>
  )
}
