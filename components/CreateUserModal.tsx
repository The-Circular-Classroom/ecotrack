'use client';

import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

const ROLE_OPTIONS = ['Admin', 'SchoolStaff', 'PsgVolunteer', 'Parent'] as const;
type RoleOption = (typeof ROLE_OPTIONS)[number];

interface School {
  id: number | string;
  name?: string;
  schoolName?: string;
  address?: string;
}

export interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: RoleOption;
  schoolId: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  schoolId?: string;
}

export default function CreateUserModal({ open, onClose, onSuccess }: CreateUserModalProps) {
  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'Parent',
    schoolId: '',
  });

  const [schools, setSchools] = useState<School[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');

  // Fetch schools when modal opens
  useEffect(() => {
    if (!open) return;
    const fetchSchools = async () => {
      setLoadingSchools(true);
      try {
        const res = await fetch('/api/schools');
        if (res.ok) {
          const result = await res.json();
          setSchools(result.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch schools:', err);
      } finally {
        setLoadingSchools(false);
      }
    };
    fetchSchools();
  }, [open]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'Parent',
        schoolId: '',
      });
      setErrors({});
      setSubmitError('');
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      if (name === 'role') {
        const isAdmin = value.toLowerCase() === 'admin';
        return { ...prev, role: value as RoleOption, schoolId: isAdmin ? '' : prev.schoolId };
      }
      return { ...prev, [name]: value };
    });
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSubmitError('');
  };

  const validate = (): FormErrors => {
    const isAdmin = form.role.toLowerCase() === 'admin';
    const newErrors: FormErrors = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required.';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      newErrors.email = 'Please provide a valid email address.';
    }
    if (!form.role) newErrors.role = 'Role is required.';
    if (!isAdmin && !form.schoolId) newErrors.schoolId = 'School is required.';
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const isAdmin = form.role.toLowerCase() === 'admin';
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          assignedRole: form.role,
          schoolId: isAdmin ? null : parseInt(form.schoolId, 10),
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const result = await response.json().catch(() => null);
        setSubmitError(result?.message || result?.error || 'Failed to create user');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setSubmitError('Failed to create user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = form.role.toLowerCase() === 'admin';

  const inputCls =
    'w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white ' +
    'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors';

  const inputErrorCls =
    'w-full px-3 py-2 border border-red-400 rounded-md text-sm text-gray-900 bg-white ' +
    'focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-colors';

  const selectCls =
    'w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white ' +
    'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none cursor-pointer';

  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="text-lg font-semibold text-gray-900">Add User</span>
        <IconButton aria-label="close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <p className="text-sm text-gray-500 mb-4">
          Create a new user account for the platform.
        </p>

        {submitError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* First Name */}
          <div>
            <label className={labelCls}>
              First Name<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="e.g. Rajesh"
              className={errors.firstName ? inputErrorCls : inputCls}
            />
            {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
          </div>

          {/* Last Name and Role - side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Last Name<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
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
                onChange={handleChange}
                className={selectCls}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className={labelCls}>
              Email<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. staff@school.edu.sg"
              className={errors.email ? inputErrorCls : inputCls}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* Phone and School - side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Phone Number</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="e.g. +6591234567"
                className={inputCls}
              />
            </div>
            {!isAdmin && (
              <div>
                <label className={labelCls}>
                  Assigned School<span className="text-red-500 ml-0.5">*</span>
                </label>
                <select
                  name="schoolId"
                  value={form.schoolId}
                  onChange={handleChange}
                  disabled={loadingSchools}
                  className={errors.schoolId ? inputErrorCls : selectCls}
                >
                  <option value="" disabled>
                    {loadingSchools ? 'Loading...' : 'Select School'}
                  </option>
                  {schools.map((school) => (
                    <option key={school.id} value={String(school.id)}>
                      {school.schoolName || school.name}
                    </option>
                  ))}
                </select>
                {errors.schoolId && <p className="text-xs text-red-500 mt-1">{errors.schoolId}</p>}
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-white bg-[#69aa56] rounded-md hover:bg-[#5a9648] disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          {submitting && <CircularProgress size={14} color="inherit" />}
          {submitting ? 'Saving...' : 'Create User'}
        </button>
      </DialogActions>
    </Dialog>
  );
}
