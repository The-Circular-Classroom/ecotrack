// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';

// mui
import {
  Box, Card, CardContent, Typography, Collapse, Alert,
  Tooltip, Tabs, Tab, Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

// icon
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { FaCheck } from 'react-icons/fa6';
import { TbCancel } from 'react-icons/tb';

// components
import Pagination from '@/components/ui/Pagination';
import SnackbarAlert from '@/components/SnackbarAlert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CustomButton from '@/components/ui/CustomButton';

const FILES_PER_PAGE = 6;

function formatUploadDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

function getFileNameFromKey(key) {
  if (!key) return key;
  const parts = key.split('/');
  return parts[parts.length - 1] || key;
}

const FOLDER_LABELS = {
  validated: 'Approved',
  'pre-processing': 'Pending',
  failed: 'Failed',
};

function formatDisplayValue(val) {
  if (val == null || val === '') return '—';
  return String(val).replace(/_/g, ' ');
}

const TO_STATUS_LABELS = {
  for_psg: 'For PSG Activities',
  for_school_stock: 'For School',
  for_repurposing: 'For TCC Repurposing',
  for_recycling_disposal: 'For Recycling/Disposal',
};

function formatToStatusValue(val) {
  const key = String(val ?? '').trim().toLowerCase();
  return TO_STATUS_LABELS[key] || formatDisplayValue(val);
}

// Columns to hide in content table
const HIDDEN_CONTENT_COLUMNS = ['item_type_id', 'user_id', 'donation_drive_id', 'school_id'];

// Status badge classes
const STATUS_BADGE_CLASSES = {
  for_sale: 'bg-yellow-50 text-yellow-700 border border-yellow-300',
  'for sale': 'bg-yellow-50 text-yellow-700 border border-yellow-300',
  forsale: 'bg-yellow-50 text-yellow-700 border border-yellow-300',
  for_psg: 'bg-blue-50 text-blue-700 border border-blue-200',
  'for psg activities': 'bg-blue-50 text-blue-700 border border-blue-200',
  sold: 'bg-red-50 text-red-700 border border-red-200',
  repurposed: 'bg-green-50 text-green-700 border border-green-300',
  donated: 'bg-green-50 text-green-700 border border-green-300',
  for_repurpose: 'bg-blue-50 text-blue-700 border border-blue-200',
  'for repurpose': 'bg-blue-50 text-blue-700 border border-blue-200',
  forrepurpose: 'bg-blue-50 text-blue-700 border border-blue-200',
  for_repurposing: 'bg-amber-50 text-amber-700 border border-amber-200',
  'for tcc repurposing': 'bg-amber-50 text-amber-700 border border-amber-200',
  for_recycling_disposal: 'bg-gray-100 text-gray-700 border border-gray-300',
  'for recycling/disposal': 'bg-gray-100 text-gray-700 border border-gray-300',
  in_use: 'bg-gray-100 text-gray-700 border border-gray-300',
  'in use': 'bg-gray-100 text-gray-700 border border-gray-300',
  disposed: 'bg-gray-100 text-gray-700 border border-gray-300',
  general_office: 'bg-teal-50 text-teal-700 border border-teal-300',
  'general office': 'bg-teal-50 text-teal-700 border border-teal-300',
  generaloffice: 'bg-teal-50 text-teal-700 border border-teal-300',
};

const COLOUR_DOT_MAP = {
  blue: '#3b82f6',
  'light blue': '#93c5fd',
  black: '#171717',
  white: '#ffffff',
  khaki: '#c3b091',
  teal: '#0d9488',
  green: '#22c55e',
  red: '#dc2626',
  yellow: '#eab308',
  grey: '#9ca3af',
  gray: '#9ca3af',
  pink: '#ec4899',
  navy: '#1e3a5f',
  'navy blue': '#1e3a5f',
  brown: '#78350f',
  orange: '#f97316',
  purple: '#7c3aed',
  maroon: '#7f1d1d',
  beige: '#d4c5a9',
  cream: '#fffdd0',
};

// ── Colours ──────────────────────────────────────────────────────────────────
const cardBg = '#ffffff';
const cardBorder = '#e5e7eb';
const titleColor = '#111827';
const secondaryText = '#6b7280';

const FOLDER_STYLES = {
  validated:        { iconColor: '#16a34a', textColor: '#16a34a', borderColor: '#16a34a' },
  'pre-processing': { iconColor: '#fb923c', textColor: '#fb923c', borderColor: '#fb923c' },
  failed:           { iconColor: '#f87171', textColor: '#f87171', borderColor: '#f87171' },
};

// ── Build DataGrid columns from file headers ─────────────────────────────────
function buildContentColumns(headers) {
  const displayHeaders = headers.filter((h) => !HIDDEN_CONTENT_COLUMNS.includes(h));

  return displayHeaders.map((h) => {
    const headerLower = h.toLowerCase();

    const base = {
      field: h,
      headerName: formatDisplayValue(h),
      flex: 1,
      minWidth: 120,
    };

    if (headerLower === 'item_name') {
      return {
        ...base,
        headerName: 'Item',
        minWidth: 150,
        flex: 1.5,
        renderCell: ({ value }) => {
          const str = String(value ?? '').trim();
          if (!str) return '—';
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <Typography variant="body2" sx={{ color: titleColor, fontWeight: 500 }}>
                {str}
              </Typography>
            </Box>
          );
        },
      };
    }
    
    if (headerLower === 'colour_name') {
      return {
        ...base,
        headerName: 'Colour',
        minWidth: 130,
        flex: 0.8,
        renderCell: ({ value }) => {
          const str = String(value ?? '').trim();
          if (!str) return '—';
          const hex = COLOUR_DOT_MAP[str.toLowerCase()] || '#d1d5db';
          const isLight = ['#ffffff', '#fffdd0', '#f5f5f5', '#d4c5a9'].includes(hex);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: hex,
                  border: `1.5px solid ${isLight ? '#d1d5db' : hex}`,
                  flexShrink: 0,
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.05)',
                }}
              />
              <Typography variant="body2" sx={{ color: titleColor, fontSize: '0.8125rem' }}>
                {str}
              </Typography>
            </Box>
          );
        },
      };
    }
    
    if (headerLower === 'gender') {
      return {
        ...base,
        headerName: 'Gender',
        minWidth: 100,
        flex: 0.5,
        renderCell: ({ value }) => {
          const str = String(value ?? '').trim();
          if (!str || str === 'Unisex') return (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <Typography variant="body2" color="text.secondary">
                {str || '—'}
              </Typography>
            </Box>
          );
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <Chip
                label={str}
                size="small"
                sx={{
                  bgcolor: str === 'Male' ? '#eff6ff' : '#fdf2f8',
                  color: str === 'Male' ? '#1e40af' : '#9d174d',
                  border: `1px solid ${str === 'Male' ? '#bfdbfe' : '#fbcfe8'}`,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  height: 24,
                }}
              />
            </Box>
          );
        },
      };
    }

    if (headerLower === 'to_status') {
      return {
        ...base,
        minWidth: 130,
        renderCell: ({ value }) => {
          const str = String(value ?? '').trim();
          if (!str) return '—';
          const key = str.toLowerCase().replace(/\s/g, '_');
          const cls =
            STATUS_BADGE_CLASSES[key] ||
            STATUS_BADGE_CLASSES[str.toLowerCase()] ||
            'bg-gray-50 text-gray-600 border border-gray-200';
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <span className={`px-2 py-1 rounded-md text-xs font-semibold ${cls}`}>
                {formatToStatusValue(value)}
              </span>
            </Box>
          );
        },
      };
    }

    if (headerLower === 'size_name') {
      return {
        ...base,
        minWidth: 100,
        renderCell: ({ value }) => {
          const str = String(value ?? '').trim();
          if (!str) return '—';
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <Chip
                label={formatDisplayValue(value)}
                size="small"
                sx={{
                  bgcolor: '#f3f4f6',
                  color: titleColor,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  height: 24,
                }}
              />
            </Box>
          );
        },
      };
    }

    if (headerLower === 'to_stored_at') {
      return {
        ...base,
        headerName: 'Location',
        renderCell: ({ value }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2" sx={{ color: titleColor }}>
              {formatDisplayValue(value)}
            </Typography>
          </Box>
        ),
      };
    }

    if (headerLower === 'quantity') {
      return {
        ...base,
        minWidth: 80,
        flex: 0.5,
        renderCell: ({ value }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: titleColor }}>
              {value ?? '—'}
            </Typography>
          </Box>
        ),
      };
    }

    if (headerLower === 'remarks') {
      return {
        ...base,
        minWidth: 160,
        flex: 1.5,
        renderCell: ({ value }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary" noWrap>
              {value || '—'}
            </Typography>
          </Box>
        ),
      };
    }

    if (headerLower === 'colour_name' || headerLower === 'color') {
      return {
        ...base,
        minWidth: 80,
        flex: 0.5,
        renderCell: ({ value }) => {
          const str = String(value ?? '').trim();
          if (!str) return '—';
          const hex = COLOUR_DOT_MAP[str.toLowerCase()] || '#d1d5db';
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <Tooltip title={formatDisplayValue(value)} arrow placement="top">
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    width: 15,
                    height: 15,
                    borderRadius: '50%',
                    bgcolor: hex,
                    border: hex === '#f5f5f5' ? '1px solid #e5e7eb' : 'none',
                    cursor: 'default',
                  }}
                />
              </Tooltip>
            </Box>
          );
        },
      };
    }

    if (headerLower === 'category_name' || headerLower === 'category') {
      return {
        ...base,
        renderCell: ({ value }) => {
          const str = String(value ?? '').trim();
          if (!str) return '—';
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                  px: 1.25,
                  py: 0.5,
                  borderRadius: '9999px',
                  bgcolor: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #bbf7d0',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                }}
              >
                {formatDisplayValue(value)}
              </Box>
            </Box>
          );
        },
      };
    }

    // Default
    return {
      ...base,
      renderCell: ({ value }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" sx={{ color: titleColor }}>
            {formatDisplayValue(value)}
          </Typography>
        </Box>
      ),
    };
  });
}

// ── Main component ───────────────────────────────────────────────────────────
export default function FileApprovalPage() {
  const [data, setData] = useState({ folders: [], count: 0, files: [], byFolder: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedKey, setExpandedKey] = useState(null);
  const [page, setPage] = useState(1);
  const [folderFilter, setFolderFilter] = useState('all');
  const [contentByKey, setContentByKey] = useState({});
  const [contentErrorByKey, setContentErrorByKey] = useState({});
  const [loadingContentKey, setLoadingContentKey] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const apiUrl = process.env.NEXT_PUBLIC_INVENTORY_API_URL;

  const fetchValidatedFiles = useCallback(async () => {
    if (!apiUrl) {
      setError('API URL not configured');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/donation-drive/validated-files`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`,
        },
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || json.error || 'Failed to load files');
      }
      if (json.success && json.data) {
        setData({
          folders: json.data.folders ?? ['validated', 'pre-processing', 'failed'],
          count: json.data.count ?? 0,
          files: json.data.files ?? [],
          byFolder: json.data.byFolder ?? {},
        });
        setPage(1);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err.message || 'Error loading files');
      setData({ folders: [], count: 0, files: [], byFolder: {} });
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchValidatedFiles();
  }, [fetchValidatedFiles]);

  const filteredFiles = (
    folderFilter === 'all'
      ? data.files
      : data.files.filter((f) => f.folder === folderFilter)
  ).sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

  const totalPages = Math.max(1, Math.ceil((filteredFiles.length || 0) / FILES_PER_PAGE));
  const start = (page - 1) * FILES_PER_PAGE;
  const paginatedFiles = filteredFiles.slice(start, start + FILES_PER_PAGE);

  const getStatusColor = (folder) =>
    (FOLDER_STYLES[folder] ?? FOLDER_STYLES.failed).iconColor;

  const getStatusChip = (folder) => {
    const label = FOLDER_LABELS[folder] || folder;
    const { textColor, borderColor } = FOLDER_STYLES[folder] ?? FOLDER_STYLES.failed;
    const Icon =
      folder === 'validated' ? CheckCircleOutlinedIcon
      : folder === 'pre-processing' ? ScheduleOutlinedIcon
      : ErrorOutlinedIcon;
    return (
      <div
        className="rounded-full flex items-center justify-center font-medium px-4 py-2 gap-1.5 text-sm h-9 bg-white w-[130px]"
        style={{ color: textColor, border: `1.5px solid ${borderColor}` }}
      >
        <Icon style={{ fontSize: 15, color: textColor }} />
        {label}
      </div>
    );
  };

  const toggleExpand = (key) => {
    setExpandedKey((prev) => (prev === key ? null : key));
    if (key && !contentByKey[key] && !contentErrorByKey[key]) {
      fetchFileContent(key);
    }
  };

  const fetchFileContent = async (key) => {
    if (!apiUrl) return;
    setLoadingContentKey(key);
    setContentErrorByKey((prev) => ({ ...prev, [key]: null }));
    try {
      const encodedKey = encodeURIComponent(key);
      const response = await fetch(
        `${apiUrl}/api/donation-drive/validated-files/content?key=${encodedKey}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`,
          },
        }
      );
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || json.error || 'Failed to load file content');
      }
      if (json.success && json.data) {
        setContentByKey((prev) => ({
          ...prev,
          [key]: {
            headers: json.data.headers || [],
            rows: json.data.rows || [],
            metadata: json.data.metadata || {},
          },
        }));
      } else {
        throw new Error('Invalid response');
      }
    } catch (err) {
      setContentErrorByKey((prev) => ({
        ...prev,
        [key]: err.message || 'Failed to load content',
      }));
    } finally {
      setLoadingContentKey(null);
    }
  };

  const handleApprove = async (e, file) => {
    e.stopPropagation();
    if (!apiUrl || !file?.key) return;

    try {
      const response = await fetch(`${apiUrl}/api/donation-drive/approve-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ key: file.key }),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json.success) {
        throw new Error(json.message || json.error || 'Failed to approve file');
      }

      setSnackbar({ open: true, message: 'File approved successfully', severity: 'success' });
      fetchValidatedFiles();
    } catch (err) {
      setSnackbar({ open: true, message: err?.message || 'Failed to approve file', severity: 'error' });
      console.error('Error approving file:', err);
    }
  };

  const handleDeny = async (e, file) => {
    e.stopPropagation();
    if (!apiUrl || !file?.key) return;

    try {
      const response = await fetch(`${apiUrl}/api/donation-drive/deny-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ key: file.key }),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json.success) {
        throw new Error(json.message || json.error || 'Failed to deny file');
      }

      setSnackbar({ open: true, message: 'File denied', severity: 'success' });
      fetchValidatedFiles();
    } catch (err) {
      setSnackbar({ open: true, message: err?.message || 'Failed to deny file', severity: 'error' });
      console.error('Error denying file:', err);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ color: 'var(--color-darker)', fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          File Approval
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Review and approve uploaded donation files before they are processed
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <LoadingSpinner message="Loading..." />
      ) : data.files.length === 0 ? (
        <Typography variant="body2" sx={{ color: secondaryText, textAlign: 'center', py: 3 }}>
          No files to display.
        </Typography>
      ) : (
        <>
          <Tabs
            value={folderFilter}
            onChange={(_, v) => { setFolderFilter(v); setPage(1); }}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              mb: 2,
              minHeight: 40,
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' }, minWidth: { xs: 'auto', sm: 90 }, px: { xs: 1.5, sm: 2 } },
              '& .Mui-selected': { color: '#69aa56 !important' },
              '& .MuiTabs-indicator': { backgroundColor: '#69aa56' },
            }}
          >
            <Tab label={`All (${data.count})`} value="all" />
            <Tab label={`Approved (${data.byFolder.validated ?? 0})`} value="validated" />
            <Tab label={`Pending (${data.byFolder['pre-processing'] ?? 0})`} value="pre-processing" />
            <Tab label={`Failed (${data.byFolder.failed ?? 0})`} value="failed" />
          </Tabs>

          {filteredFiles.length === 0 ? (
            <Typography variant="body2" sx={{ color: secondaryText, py: 3, textAlign: 'center' }}>
              No files in this category.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {paginatedFiles.map((file) => {
                const isExpanded = expandedKey === file.key;
                const displayName = getFileNameFromKey(file.key);
                const folder = file.folder || 'validated';
                const isPending = folder === 'pre-processing';

                return (
                  <Card
                    key={file.key}
                    variant="outlined"
                    sx={{
                      bgcolor: cardBg,
                      border: `1px solid ${cardBorder}`,
                      borderRadius: '8px',
                      boxShadow: 'none',
                      overflow: 'hidden',
                    }}
                  >
                    <CardContent sx={{ py: 2.5, px: { xs: 2, sm: 3 }, '&:last-child': { pb: 2.5 } }}>
                      {/* ── Clickable card header ──────────────────────── */}
                      <Box
                        onClick={() => toggleExpand(file.key)}
                        sx={{
                          display: 'flex',
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          justifyContent: 'space-between',
                          flexDirection: { xs: 'column', sm: 'row' },
                          gap: 1.5,
                          cursor: 'pointer',
                          userSelect: 'none',
                          '&:hover': { opacity: 0.85 },
                        }}
                      >
                        {/* File info */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
                          <DescriptionOutlinedIcon sx={{ color: getStatusColor(folder), fontSize: { xs: 28, sm: 36 }, flexShrink: 0 }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="subtitle1"
                              fontWeight={600}
                              sx={{ color: titleColor, fontSize: { xs: '0.875rem', sm: '1rem' }, wordBreak: 'break-all' }}
                            >
                              {displayName}
                            </Typography>
                            <Typography variant="body2" sx={{ color: secondaryText, mt: 0.25, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              Uploaded on {formatUploadDate(file.lastModified)}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Actions row */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>
                          {isPending && (
                            <>
                              <CustomButton
                                variant="primary"
                                icon={<FaCheck size={12} />}
                                onClick={(e) => handleApprove(e, file)}
                              >
                                Approve
                              </CustomButton>
                              <CustomButton
                                variant="danger"
                                icon={<TbCancel size={12} />}
                                onClick={(e) => handleDeny(e, file)}
                              >
                                Deny
                              </CustomButton>
                            </>
                          )}

                          {getStatusChip(folder)}

                          {isExpanded ? (
                            <ExpandLessIcon sx={{ color: secondaryText }} />
                          ) : (
                            <ExpandMoreIcon sx={{ color: secondaryText }} />
                          )}
                        </Box>
                      </Box>

                      {/* ── Expanded content ───────────────────────────── */}
                      <Collapse in={isExpanded}>
                        <Box sx={{ mt: 2 }}>
                          {loadingContentKey === file.key ? (
                            <LoadingSpinner message="Loading file content..." />
                          ) : contentErrorByKey[file.key] ? (
                            <Alert severity="error" sx={{ my: 1 }}>
                              {contentErrorByKey[file.key]}
                            </Alert>
                          ) : contentByKey[file.key] ? (() => {
                            const { headers, rows, metadata } = contentByKey[file.key];
                            const columns = buildContentColumns(headers);
                            const gridRows = rows.map((row, idx) => ({ id: idx, ...row }));
                            const hiddenPsgRows = Number(metadata?.hiddenPsgRows || 0);
                            const visibleRows = rows.length;

                            return (
                              <>
                                {/* Metadata summary */}
                                {metadata && (metadata.schoolName || metadata.uploaderName || metadata.donationDriveName) && (
                                  <Box
                                    sx={{
                                      display: 'grid',
                                      gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(auto-fit, minmax(140px, 1fr))' },
                                      gap: 2,
                                      mb: 2,
                                      p: 2,
                                      bgcolor: '#f9fafb',
                                      borderRadius: '8px',
                                      border: `1px solid ${cardBorder}`,
                                    }}
                                  >
                                    {metadata.schoolName && (
                                      <Box>
                                        <Typography variant="caption" sx={{ color: secondaryText, fontWeight: 500, display: 'block' }}>
                                          School
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: titleColor, fontWeight: 600 }}>
                                          {metadata.schoolName}
                                        </Typography>
                                      </Box>
                                    )}
                                    {metadata.uploaderName && (
                                      <Box>
                                        <Typography variant="caption" sx={{ color: secondaryText, fontWeight: 500, display: 'block' }}>
                                          Uploaded by
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: titleColor, fontWeight: 600 }}>
                                          {metadata.uploaderName}
                                        </Typography>
                                      </Box>
                                    )}
                                    {metadata.donationDriveName && (
                                      <Box>
                                        <Typography variant="caption" sx={{ color: secondaryText, fontWeight: 500, display: 'block' }}>
                                          Donation Drive
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: titleColor, fontWeight: 600 }}>
                                          {metadata.donationDriveName}
                                        </Typography>
                                      </Box>
                                    )}
                                    {metadata.totalRows != null && (
                                      <Box>
                                        <Typography variant="caption" sx={{ color: secondaryText, fontWeight: 500, display: 'block' }}>
                                          Visible Rows
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: titleColor, fontWeight: 600 }}>
                                          {metadata.totalRows}
                                        </Typography>
                                      </Box>
                                    )}
                                    {hiddenPsgRows > 0 && (
                                      <Box>
                                        <Typography variant="caption" sx={{ color: secondaryText, fontWeight: 500, display: 'block' }}>
                                          Hidden PSG Rows
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: titleColor, fontWeight: 600 }}>
                                          {hiddenPsgRows}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                )}

                                {hiddenPsgRows > 0 && (
                                  <Alert severity="info" sx={{ mb: 2 }}>
                                    {visibleRows === 0
                                      ? 'All rows in this file are For PSG Activities, so they are hidden from the TCC Admin preview. The file can still be approved and processed.'
                                      : `${hiddenPsgRows} For PSG Activities row${hiddenPsgRows === 1 ? '' : 's'} hidden from the TCC Admin preview.`}
                                  </Alert>
                                )}

                                {visibleRows === 0 ? (
                                  <Alert severity="warning" sx={{ mb: 1 }}>
                                    No viewable rows to display for this role.
                                  </Alert>
                                ) : (
                                  <>
                                    {/* DataGrid table */}
                                    <Box
                                      sx={{
                                        width: '100%',
                                        backgroundColor: '#fff',
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        border: `1px solid ${cardBorder}`,
                                      }}
                                    >
                                      <DataGrid
                                        rows={gridRows}
                                        columns={columns}
                                        pageSizeOptions={[10, 25, 50]}
                                        initialState={{
                                          pagination: { paginationModel: { pageSize: 10 } },
                                        }}
                                        disableRowSelectionOnClick
                                        density="comfortable"
                                        autoHeight
                                        sx={{
                                          border: 'none',
                                          '& .MuiDataGrid-columnHeaders': {
                                            backgroundColor: 'var(--color-bg-light)',
                                            fontWeight: 600,
                                          },
                                        }}
                                      />
                                    </Box>
                                  </>
                                )}
                              </>
                            );
                          })() : null}
                        </Box>
                      </Collapse>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}

          {filteredFiles.length > 0 && (
            <Typography variant="body2" sx={{ color: secondaryText, mt: 3 }}>
              Showing {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
              {folderFilter !== 'all' ? ` in ${FOLDER_LABELS[folderFilter] || folderFilter}` : ' across all categories'}.
            </Typography>
          )}
          {filteredFiles.length > 0 && totalPages > 1 && (
            <Box sx={{ mt: 3, borderTop: `1px solid ${cardBorder}`, pt: 2 }}>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </Box>
          )}
        </>
      )}

      <SnackbarAlert
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbar.message}
        icon={snackbar.severity === 'success' ? <FaCheck /> : <TbCancel />}
        severity={snackbar.severity}
      />
    </Box>
  );
}
