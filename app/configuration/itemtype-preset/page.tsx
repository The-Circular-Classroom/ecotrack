// @ts-nocheck
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLayoutLoading } from '@/app/configuration/layout';
import Image from 'next/image';

// mui
import { Backdrop, Tooltip, Chip, Box, Typography, Alert, Button } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

// icon
import { FaPlus, FaCheck } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { FiEdit3, FiTrash2 } from "react-icons/fi";
import { TbCancel } from "react-icons/tb";

// components
import PresetFormModal from '@/components/configuration/PresetFormModal';
import SnackbarAlert from '@/components/SnackbarAlert';
import CustomButton from '@/components/ui/CustomButton';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
import CustomErrorButton from '@/components/ui/CustomErrorButton';

// ── Column definitions ───────────────────────────────────────────────────────
const buildColumns = (onEdit, onDelete) => [
    {
        field: 'preview',
        headerName: 'Preview',
        width: 100,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <Image
                    src={row.image_url || 'https://placehold.co/100/png'}
                    alt={row.category_name || 'preview'}
                    width={48}
                    height={48}
                    style={{ objectFit: 'contain', borderRadius: 4 }}
                />
            </Box>
        ),
    },
    {
        field: 'school_name',
        headerName: 'School',
        flex: 1,
        minWidth: 180,
        renderCell: ({ row }) => (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <Typography variant="body2" sx={{ color: '#111827' }}>
                    {row.school_name
                        ? row.school_name
                            .toLowerCase()
                            .replace(/\b\w/g, (c) => c.toUpperCase())
                        : '-'}
                </Typography>
            </Box>
        ),
    },
    {
        field: 'itemType',
        headerName: 'Item Type - Colour',
        minWidth: 230,
        // keep valueGetter for sorting/filtering
        valueGetter: (value, row) => {
            const category = row.category_name;
            if (!category) return '-';
            const colour = row.colour_name;

            return `${category}${colour ? ` - ${colour}` : ''} : ''}`;
        },
        renderCell: ({ row }) => {
            const category = row.category_name;
            if (!category) return '-';

            const colour = row.colour_name;

            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, height: '100%' }}>
                    <Tooltip title={category + (row.colour_name ? ` - ${row.colour_name}` : '')}>
                        <span>{category}</span>
                    </Tooltip>
                    {colour && (
                        <>
                            <span>-</span>
                            <Box
                                sx={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    backgroundColor: row.hexcode, // e.g. '#FFFFFF'
                                    border: '1px solid #ccc',           // helps white colors show
                                    flexShrink: 0,
                                }}
                            />
                            <Typography variant="body2">{row.colour_name || '-'}</Typography>
                        </>
                    )}
                </Box>
            );
        },
    },
    {
        field: 'gender',
        headerName: 'Gender',
        minWidth: 100,
        renderCell: ({ value }) => (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <Typography variant="body2" sx={{ color: '#111827' }}>
                    {value || '-'}
                </Typography>
            </Box>
        ),
    },
    {
        field: 'material',
        headerName: 'Material',
        minWidth: 170,
        renderCell: ({ value }) => (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <Typography variant="body2" sx={{ color: '#111827' }}>
                    {value || '-'}
                </Typography>
            </Box>
        ),
    },
    {
        field: 'brand',
        headerName: 'Brand',
        width: 190,
        renderCell: ({ value }) => (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <Chip
                    label={value || '-'}
                    size="small"
                    sx={{
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        height: 26,
                    }}
                />
            </Box>
        ),
    },
    {
        field: 'action',
        headerName: 'Action',
        width: 100,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 0.5 }}>
                <CustomButton
                    iconOnly
                    icon={<FiEdit3 size={14} />}
                    onClick={(e) => { e.stopPropagation(); onEdit(row); }}
                />
                <CustomButton
                    iconOnly
                    variant="iconDanger"
                    icon={<FiTrash2 size={14} />}
                    onClick={(e) => { e.stopPropagation(); onDelete(row); }}
                />
            </Box>
        ),
    },
];

// ── Main component ───────────────────────────────────────────────────────────
export default function PresetPage() {
    const { setLoading } = useLayoutLoading();
    const [itemPreset, setItemPreset] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editRow, setEditRow] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' // 'success' | 'error' | 'warning' | 'info'
    });

    const [error, setError] = useState(null);
    const [deleteRow, setDeleteRow] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        fetchAllItemTypePresets();
    }, []);

    const fetchAllItemTypePresets = async () => {
        try {
            setLoading(true);

            const apiUrl = '';
            const response = await fetch(`${apiUrl}/api/inventory/item-types`);

            if (!response.ok) throw new Error('Failed to fetch item preset');

            const result = await response.json();
            const rawPresets = result.itemTypes || result.data || [];

            const mappedPresets = rawPresets.map((item: any) => ({
                id: item.id,
                item_type_id: item.id,
                image_url: item.imageUrl,
                school_name: item.school?.schoolName || '',
                category_name: item.category?.categoryName || '',
                colour_name: item.primaryColour?.colourName || '',
                hexcode: item.primaryColour?.hexcode || item.primaryColour?.hexCode || '',
                gender: item.gender,
                schoolId: item.schoolId,
                categoryId: item.categoryId,
                primaryColourId: item.primaryColourId,
                secondaryColourId: item.secondaryColourId,
                patternId: item.patternId,
                materialId: item.materialId,
                sizeCategoryId: item.sizeCategoryId,
                createdDate: item.createdDate,
                lastUpdated: item.createdDate, // fallback
            }));

            const sortedData = mappedPresets.sort((a, b) =>
                new Date(b.createdDate) - new Date(a.createdDate)
            );

            setItemPreset(sortedData);
            setError(null);
        } catch (err) {
            console.error('Error fetching item preset:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (row) => {
        setEditRow(row);
        setModalOpen(true);
    };

    const handleDelete = (row) => {
        setDeleteRow(row);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteRow) return;
        setDeleteLoading(true);
        try {
            const apiUrl = '';
            const response = await fetch(`${apiUrl}/api/inventory/item-types/${deleteRow.item_type_id}`, {
                method: 'DELETE',
            });

            const result = await response.json();
            setSnackbar({
                open: true,
                message: response.ok ? 'Preset deleted successfully' : result.message || 'Failed to delete preset',
                severity: response.ok ? 'success' : 'error',
            });

            if (response.ok) fetchAllItemTypePresets(true);
        } catch (err) {
            console.error('Error deleting preset:', err);
            setSnackbar({ open: true, message: 'Something went wrong', severity: 'error' });
        } finally {
            setDeleteLoading(false);
            setDeleteRow(null);
        }
    };

    const handleClose = (result) => {
        setModalOpen(false);
        setEditRow(null); // reset on close
        if (result) {
            setSnackbar({ open: true, message: result.message, severity: result.success ? 'success' : 'error' });
            fetchAllItemTypePresets(true); // refresh list after edit
        }
    };

    const columns = useMemo(() => buildColumns(handleEdit, handleDelete), []);

    // Handle snackbar close
    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar(prev => ({ ...prev, open: false }));
    };


    // ── Error ──────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <CustomErrorButton
                title="Error Loading Item Type Preset Page"
                message={error}
                onRetry={fetchAllItemTypePresets}
            />
        );
    }

    // ── Main render ────────────────────────────────────────────────────────────
    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} sx={{ color: 'var(--color-darker)' }}>
                        Item Type Preset
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {itemPreset.length} total preset{itemPreset.length !== 1 ? 's' : ''} — define configurations for your inventory management system
                    </Typography>
                </Box>
                <CustomButton
                    onClick={() => setModalOpen(true)}
                    icon={<FaPlus />}
                >
                    Add New Preset
                </CustomButton>
            </Box>

            {/* DataGrid */}
            <Box
                sx={{
                    height: 680,
                    width: '100%',
                    backgroundColor: '#fff',
                    borderRadius: 2,
                    boxShadow: 1,
                    overflow: 'hidden',
                }}
            >
                <DataGrid
                    rows={itemPreset}
                    columns={columns}
                    getRowId={(row) => `${row.item_type_id}-${row.hexcode}`}
                    slots={{ toolbar: GridToolbar }}
                    slotProps={{
                        toolbar: {
                            showQuickFilter: true,
                            quickFilterProps: { debounceMs: 300 },
                            printOptions: { disableToolbarButton: true },
                        },
                    }}
                    pageSizeOptions={[10, 25, 50, 100]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    disableRowSelectionOnClick
                    density="comfortable"
                    sx={{
                        border: 'none',
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: 'var(--color-bg-light)',
                            fontWeight: 600,
                        },
                        '& .MuiDataGrid-cell .MuiTypography-root': {
                            lineHeight: 1.3,
                        },
                    }}
                />
            </Box>

            {/* Snackbar for notifications */}
            <SnackbarAlert
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleSnackbarClose}
                message={snackbar.message}
                severity={snackbar.severity}
                icon={snackbar.severity === 'success' ? <FaCheck /> : <TbCancel />}
            />

            {/* Modal */}
            {modalOpen && (
                <Backdrop
                    open={modalOpen}
                    onClick={() => { setModalOpen(false); setEditRow(null); }}
                    sx={{ zIndex: 50, p: 2 }}
                >
                    <div
                        className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-4 sm:p-6 border-b">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                                {editRow ? 'Edit Item Type Preset' : 'Add New Item Type Preset'}
                            </h2>
                            <button
                                onClick={() => { setModalOpen(false); setEditRow(null); }}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer"
                            >
                                <IoClose />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            <PresetFormModal onClose={handleClose} editData={editRow} />
                        </div>
                    </div>
                </Backdrop>
            )}

            {/* Delete Confirmation Dialog */}
            {deleteRow && (
                <DeleteConfirmModal
                    open={!!deleteRow}
                    onClose={() => setDeleteRow(null)}
                    onConfirm={handleDeleteConfirm}
                    loading={deleteLoading}
                    title="Delete Preset"
                    description={
                        <>
                            Are you sure you want to delete the <span className="font-medium text-gray-700">{deleteRow?.category_name}</span> preset for <span className="font-medium text-gray-700">{deleteRow?.school_name?.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}</span>? This action cannot be undone.
                        </>
                    }
                />
            )}
        </Box>
    );
}