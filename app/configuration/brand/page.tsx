// @ts-nocheck
"use client";

import { useState, useEffect, useMemo } from "react";
import { useLayoutLoading } from "@/app/configuration/layout";

// mui
import { Backdrop, Box, Typography, Chip } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";

// icons
import { FaPlus, FaCheck } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { FiEdit3, FiTrash2 } from "react-icons/fi";
import { TbCancel } from "react-icons/tb";

// components
import BrandFormModal from "@/components/configuration/BrandFormModal";
import SnackbarAlert from "@/components/SnackbarAlert";
import CustomButton from "@/components/ui/CustomButton";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import CustomErrorButton from "@/components/ui/CustomErrorButton";

// ─── constants ───────────────────────────────────────────────────────────────

const API_URL = '';

const SIZE_TYPE_CHIP_STYLE = {
  Alphabetical: { backgroundColor: "#dcfce7", color: "#166534" },
  Numerical: { backgroundColor: "#dbeafe", color: "#1e40af" },
  OneSize: { backgroundColor: "#fef3c7", color: "#92400e" },
};

const SIZE_TYPE_LABELS = {
  Alphabetical: "Alphabetical",
  Numerical: "Numerical",
  OneSize: "One Size",
};

const SIZE_TYPE_ORDER = ["Alphabetical", "Numerical", "OneSize"];
const sortByTypeOrder = (types) =>
  [...types].sort(
    (a, b) => SIZE_TYPE_ORDER.indexOf(a) - SIZE_TYPE_ORDER.indexOf(b),
  );

// ─── Column definitions ──────────────────────────────────────────────────────

const buildColumns = (onEdit, onDelete) => [
  {
    field: "brandSupplier",
    headerName: "Brand Name",
    flex: 1,
    minWidth: 180,
    renderCell: ({ value }) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        <Typography variant="body2" sx={{ color: "#111827", fontWeight: 500 }}>
          {value || "-"}
        </Typography>
      </Box>
    ),
  },
  {
    field: "sizeType",
    headerName: "Size Type",
    flex: 1,
    minWidth: 220,
    valueGetter: (_, row) =>
      sortByTypeOrder(
        (row.sizeCategories ?? []).map((c) => c.sizeType).filter(Boolean),
      ).join(", "),
    renderCell: ({ row }) => {
      const types = sortByTypeOrder(
        (row.sizeCategories ?? []).map((c) => c.sizeType).filter(Boolean),
      );
      if (types.length === 0)
        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          </Box>
        );
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            height: "100%",
            gap: 0.5,
            flexWrap: "wrap",
          }}
        >
          {types.map((t) => {
            const style = SIZE_TYPE_CHIP_STYLE[t] || {
              backgroundColor: "#f3f4f6",
              color: "#374151",
            };
            return (
              <Chip
                key={t}
                label={SIZE_TYPE_LABELS[t] || t}
                size="small"
                sx={{
                  ...style,
                  borderRadius: "999px",
                  fontSize: "0.72rem",
                  fontWeight: 500,
                  height: 24,
                }}
              />
            );
          })}
        </Box>
      );
    },
  },
  {
    field: "sizeOptions",
    headerName: "Size Options",
    flex: 2,
    minWidth: 220,
    sortable: false,
    filterable: false,
    valueGetter: (_, row) => {
      const allOptions = sortByTypeOrder(
        (row.sizeCategories ?? []).map((c) => c.sizeType).filter(Boolean),
      ).flatMap((type) => {
        const cat = (row.sizeCategories ?? []).find((c) => c.sizeType === type);
        return (cat?.sizeOptions ?? [])
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder);
      });
      const names = allOptions.map((o) => o.sizeName);
      const display = names.slice(0, 5);
      return names.length > 5
        ? display.join(", ") + ` +${names.length - 5} more`
        : display.join(", ") || "-";
    },
    renderCell: ({ value }) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        <Typography variant="body2" sx={{ color: "#374151" }}>
          {value || "-"}
        </Typography>
      </Box>
    ),
  },
  {
    field: "action",
    headerName: "Actions",
    width: 100,
    sortable: false,
    filterable: false,
    renderCell: ({ row }) => (
      <Box
        sx={{ display: "flex", alignItems: "center", height: "100%", gap: 0.5 }}
      >
        <CustomButton
          iconOnly
          icon={<FiEdit3 size={14} />}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(row);
          }}
        />
        <CustomButton
          iconOnly
          variant="iconDanger"
          icon={<FiTrash2 size={14} />}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(row);
          }}
        />
      </Box>
    ),
  },
];

// ─── Main component ─────────────────────────────────────────────────────────

export default function BrandPage() {
  const { setLoading } = useLayoutLoading();
  const [brands, setBrands] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editBrand, setEditBrand] = useState(null);
  const [deleteBrand, setDeleteBrand] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/inventory/brands`);
      if (!res.ok) throw new Error("Failed to fetch brands");
      const result = await res.json();
      const rawBrands = result.brands || result.data || [];
      const sorted = rawBrands.sort((a, b) =>
        (a.brandSupplier || "").localeCompare(b.brandSupplier || ""),
      );
      setBrands(sorted);
      setError(null);
    } catch (err) {
      console.error("Error fetching brands:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteBrand) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/inventory/brands/${deleteBrand.id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      setSnackbar({
        open: true,
        message: res.ok
          ? "Brand deleted successfully"
          : result.message || "Failed to delete brand",
        severity: res.ok ? "success" : "error",
      });
      if (res.ok) fetchBrands();
    } catch {
      setSnackbar({
        open: true,
        message: "Something went wrong",
        severity: "error",
      });
    } finally {
      setDeleteLoading(false);
      setDeleteBrand(null);
    }
  };

  const handleModalClose = (result) => {
    setModalOpen(false);
    setEditBrand(null);
    if (result) {
      setSnackbar({
        open: true,
        message: result.message,
        severity: result.success ? "success" : "error",
      });
      if (result.success) fetchBrands();
    }
  };

  const handleSnackbarClose = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const columns = useMemo(
    () =>
      buildColumns(
        (row) => {
          setEditBrand(row);
          setModalOpen(true);
        },
        (row) => setDeleteBrand(row),
      ),
    [],
  );

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <CustomErrorButton
        title="Error Loading Brand Page"
        message={error}
        onRetry={fetchBrands}
      />
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ color: "var(--color-darker)" }}
          >
            Brand Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Configure brand sizes and available options
          </Typography>
        </Box>
        <CustomButton onClick={() => setModalOpen(true)} icon={<FaPlus />}>
          Add New Brand
        </CustomButton>
      </Box>

      {/* DataGrid */}
      <Box
        sx={{
          height: 680,
          width: "100%",
          backgroundColor: "#fff",
          borderRadius: 2,
          boxShadow: 1,
          overflow: "hidden",
        }}
      >
        <DataGrid
          rows={brands}
          columns={columns}
          getRowId={(row) => row.id}
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
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "var(--color-bg-light)",
              fontWeight: 600,
            },
            "& .MuiDataGrid-cell .MuiTypography-root": {
              lineHeight: 1.3,
            },
          }}
        />
      </Box>

      {/* Snackbar notifications */}
      <SnackbarAlert
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbar.message}
        severity={snackbar.severity}
        icon={snackbar.severity === "success" ? <FaCheck /> : <TbCancel />}
      />

      {/* Add / Edit Modal */}
      {modalOpen && (
        <Backdrop
          open={modalOpen}
          onClick={() => handleModalClose()}
          sx={{ zIndex: 50, p: 2 }}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex justify-between items-start p-4 sm:p-6 border-b shrink-0">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {editBrand ? "Edit Brand" : "Add New Brand"}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {editBrand
                    ? "Update the brand name and its size options."
                    : "Create a new brand and define its sizing structure."}
                </p>
              </div>
              <button
                onClick={() => handleModalClose()}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer ml-4 shrink-0"
              >
                <IoClose />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1">
              <BrandFormModal onClose={handleModalClose} editData={editBrand} />
            </div>
          </div>
        </Backdrop>
      )}

      {/* Delete Confirmation */}
      {deleteBrand && (
        <DeleteConfirmModal
          open={!!deleteBrand}
          onClose={() => setDeleteBrand(null)}
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
          title="Delete Brand"
          description={
            <>
              Are you sure you want to delete <span className="font-medium text-gray-700"> {deleteBrand?.brandSupplier} </span>
              brand? This action cannot be undone.
            </>
          }
        />
      )}
    </Box>
  );
}
