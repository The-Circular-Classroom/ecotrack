// @ts-nocheck
"use client";

import { useState, useEffect, useMemo } from "react";
import { useLayoutLoading } from "@/app/configuration/layout";

// mui
import { Backdrop, Chip, Box, Typography, TextField } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

// icons
import { FaPlus, FaCheck } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { FiEdit3, FiTrash2 } from "react-icons/fi";
import { TbCancel } from "react-icons/tb";

// components
import SnackbarAlert from "@/components/SnackbarAlert";
import CustomButton from "@/components/ui/CustomButton";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import CustomErrorButton from "@/components/ui/CustomErrorButton";
import CategoryTagFormModal from "@/components/configuration/CategoryTagFormModal";

// ── Shared helpers ────────────────────────────────────────────────────────────
const getApiUrl = () => '';
const getAuthHeader = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
});

const dataGridSx = {
  border: "none",
  "& .MuiDataGrid-columnHeaders": {
    backgroundColor: "var(--color-bg-light)",
    fontWeight: 600,
  },
  "& .MuiDataGrid-cell .MuiTypography-root": {
    lineHeight: 1.3,
  },
};

// ── Status chip ──────────────────────────────────────────────────────────────
function StatusChip({ status }) {
  const isActive = status === "active" || status === true || status === 1;
  return (
    <Chip
      label={isActive ? "Active" : "Inactive"}
      size="small"
      sx={{
        backgroundColor: isActive ? "#f0fdf4" : "#fef2f2",
        color: isActive ? "#15803d" : "#b91c1c",
        border: `1px solid ${isActive ? "#86efac" : "#fca5a5"}`,
        borderRadius: "6px",
        fontSize: "0.72rem",
        fontWeight: 600,
        height: 26,
      }}
    />
  );
}

// ── Edit Category modal ───────────────────────────────────────────────────────
function EditCategoryModal({
  open,
  onClose,
  onSubmit,
  form,
  onChange,
  loading,
}) {
  return (
    <Backdrop open={open} onClick={onClose} sx={{ zIndex: 50, p: 2 }}>
      <div
        className="bg-white rounded-lg shadow-xl flex flex-col"
        style={{ width: 640, maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Edit Category</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer"
          >
            <IoClose />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="border border-gray-200 rounded-lg p-5 space-y-6">
            <div className="flex gap-3">
              <TextField
                label="Category Name"
                value={form.categoryName}
                onChange={(e) => onChange("categoryName", e.target.value)}
                fullWidth
                size="small"
                autoFocus
              />
              <TextField
                label="Weight (kg)"
                type="number"
                value={form.weightKg}
                onChange={(e) => onChange("weightKg", e.target.value)}
                fullWidth
                size="small"
                inputProps={{ step: "0.01" }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-8 py-5 border-t shrink-0">
          <CustomButton variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </CustomButton>
          <CustomButton
            onClick={onSubmit}
            disabled={
              !form.categoryName.trim() || form.weightKg === "" || loading
            }
            className="flex-1"
          >
            {loading ? "Updating..." : "Update"}
          </CustomButton>
        </div>
      </div>
    </Backdrop>
  );
}

// ── Edit Tag modal ────────────────────────────────────────────────────────────
function EditTagModal({ open, onClose, onSubmit, form, onChange, loading }) {
  return (
    <Backdrop open={open} onClick={onClose} sx={{ zIndex: 50, p: 2 }}>
      <div
        className="bg-white rounded-lg shadow-xl flex flex-col"
        style={{ width: 640, maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Edit Tag</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer"
          >
            <IoClose />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="flex flex-col gap-3 border border-gray-200 rounded-lg p-5">
            <TextField
              label="Tag Name"
              value={form.tagName}
              onChange={(e) => onChange("tagName", e.target.value)}
              fullWidth
              size="small"
              autoFocus
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Active:
              </Typography>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => onChange("isActive", e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
            </Box>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-8 py-5 border-t shrink-0">
          <CustomButton variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </CustomButton>
          <CustomButton
            onClick={onSubmit}
            disabled={!form.tagName.trim() || loading}
            className="flex-1"
          >
            {loading ? "Updating..." : "Update"}
          </CustomButton>
        </div>
      </div>
    </Backdrop>
  );
}

// ── Column definitions ────────────────────────────────────────────────────────
const buildCategoryColumns = (onEdit, onDelete) => [
  {
    field: "categoryName",
    headerName: "Category Name",
    flex: 1,
    minWidth: 150,
    renderCell: ({ value }) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        <Typography variant="body2" sx={{ color: "#111827" }}>
          {value || "-"}
        </Typography>
      </Box>
    ),
  },
  {
    field: "weightKg",
    headerName: "Weight (kg)",
    width: 120,
    renderCell: ({ value }) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        <Typography variant="body2" sx={{ color: "#111827" }}>
          {value !== undefined && value !== null ? value : "-"}
        </Typography>
      </Box>
    ),
  },
  {
    field: "action",
    headerName: "Action",
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

const buildTagColumns = (onEdit, onDelete) => [
  {
    field: "tagName",
    headerName: "Tag Name",
    flex: 1,
    minWidth: 150,
    renderCell: ({ value }) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        <Typography variant="body2" sx={{ color: "#111827" }}>
          {value || "-"}
        </Typography>
      </Box>
    ),
  },
  {
    field: "createdDate",
    headerName: "Created Date",
    width: 160,
    type: "dateTime",
    valueGetter: (value) => (value ? new Date(value) : null),
    renderCell: ({ value }) => {
      if (!value) return "-";
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            height: "100%",
            gap: 0,
          }}
        >
          <Typography variant="body2" sx={{ lineHeight: 1.1 }}>
            {value.toLocaleDateString("en-SG", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ lineHeight: 1.1 }}
          >
            {value.toLocaleTimeString("en-SG", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </Typography>
        </Box>
      );
    },
  },
  {
    field: "isActive",
    headerName: "Status",
    width: 100,
    renderCell: ({ value }) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        <StatusChip status={value} />
      </Box>
    ),
  },
  {
    field: "action",
    headerName: "Action",
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

// ── Main component ────────────────────────────────────────────────────────────
export default function CategoryTagPage() {
  const { setLoading } = useLayoutLoading();

  // ── Data ──────────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // ── Add New modal ─────────────────────────────────────────────────────────
  const [addModalOpen, setAddModalOpen] = useState(false);

  // ── Edit modals ───────────────────────────────────────────────────────────
  const [editCategory, setEditCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    categoryName: "",
    weightKg: "",
  });
  const [categoryEditLoading, setCategoryEditLoading] = useState(false);

  const [editTag, setEditTag] = useState(null);
  const [tagForm, setTagForm] = useState({
    tagName: "",
    isActive: true,
  });
  const [tagEditLoading, setTagEditLoading] = useState(false);

  // ── Delete modals ─────────────────────────────────────────────────────────
  const [categoryDeleteRow, setCategoryDeleteRow] = useState(null);
  const [categoryDeleteLoading, setCategoryDeleteLoading] = useState(false);
  const [tagDeleteRow, setTagDeleteRow] = useState(null);
  const [tagDeleteLoading, setTagDeleteLoading] = useState(false);

  // ── Shared ────────────────────────────────────────────────────────────────
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });
  const closeSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // ── Fetch all ─────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    try {
      setLoading(true);
      const base = getApiUrl();
      const headers = getAuthHeader();
      const [catRes, tagRes] = await Promise.all([
        fetch(`${base}/api/category`, { headers }),
        fetch(`${base}/api/tag`, { headers }),
      ]);
      if (!catRes.ok || !tagRes.ok)
        throw new Error("Failed to fetch configuration data");
      const [catData, tagData] = await Promise.all([
        catRes.json(),
        tagRes.json(),
      ]);
      setCategories(catData.data || []);
      setTags(tagData.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch user profile ────────────────────────────────────────────────────
  useEffect(() => {
    const apiUrl = '';
    fetch(`${apiUrl}/api/users/me`, {
      headers: getAuthHeader(),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json?.userId) setUserId(json.userId);
      })
      .catch((err) => {
        console.error("Failed to fetch user profile:", err);
      })
      .finally(() => setProfileLoading(false));
  }, []);

  useEffect(() => {
    if (profileLoading) return;
    fetchAll();
  }, [profileLoading]);

  // ── Add New success callback ───────────────────────────────────────────────
  const handleAddSuccess = (succeeded, failed, type) => {
    if (failed === 0) {
      showSnackbar(
        `${succeeded} ${type}${succeeded > 1 ? "s" : ""} added successfully`,
        "success",
      );
    } else if (succeeded > 0) {
      showSnackbar(`${succeeded} added, ${failed} failed`, "warning");
    } else {
      showSnackbar("Failed to add entries", "error");
    }
    fetchAll();
  };

  // ── Edit Category ─────────────────────────────────────────────────────────
  const openEditCategory = (row) => {
    setCategoryForm({
      categoryName: row.categoryName,
      weightKg: row.weightKg || "",
    });
    setEditCategory(row);
  };
  const closeEditCategory = () => setEditCategory(null);

  const handleCategoryEdit = async () => {
    setCategoryEditLoading(true);
    try {
      const res = await fetch(
        `${getApiUrl()}/api/category/${editCategory.id}`,
        {
          method: "PATCH",
          headers: { ...getAuthHeader(), "Content-Type": "application/json" },
          body: JSON.stringify({
            category_name: categoryForm.categoryName,
            weight_kg: parseFloat(categoryForm.weightKg) || 0,
          }),
        },
      );
      const data = await res.json();
      showSnackbar(
        data.message || "Category updated",
        res.ok ? "success" : "error",
      );
      if (res.ok) {
        closeEditCategory();
        fetchAll();
      }
    } catch {
      showSnackbar("Something went wrong", "error");
    } finally {
      setCategoryEditLoading(false);
    }
  };

  const handleCategoryDelete = async () => {
    setCategoryDeleteLoading(true);
    try {
      const res = await fetch(
        `${getApiUrl()}/api/category/${categoryDeleteRow.id}`,
        { method: "DELETE", headers: getAuthHeader() },
      );
      const data = await res.json();
      showSnackbar(
        data.message || "Category deleted",
        res.ok ? "success" : "error",
      );
      if (res.ok) fetchAll();
    } catch {
      showSnackbar("Something went wrong", "error");
    } finally {
      setCategoryDeleteLoading(false);
      setCategoryDeleteRow(null);
    }
  };

  // ── Edit Tag ──────────────────────────────────────────────────────────────
  const openEditTag = (row) => {
    setTagForm({
      tagName: row.tagName,
      isActive: Boolean(row.isActive),
    });
    setEditTag(row);
  };
  const closeEditTag = () => setEditTag(null);

  const handleTagEdit = async () => {
    setTagEditLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/tag/${editTag.id}`, {
        method: "PATCH",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({
          tag_name: tagForm.tagName,
          is_active: tagForm.isActive,
        }),
      });
      const data = await res.json();
      showSnackbar(data.message || "Tag updated", res.ok ? "success" : "error");
      if (res.ok) {
        closeEditTag();
        fetchAll();
      }
    } catch {
      showSnackbar("Something went wrong", "error");
    } finally {
      setTagEditLoading(false);
    }
  };

  const handleTagDelete = async () => {
    setTagDeleteLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/tag/${tagDeleteRow.id}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      const data = await res.json();
      showSnackbar(data.message || "Tag deleted", res.ok ? "success" : "error");
      if (res.ok) fetchAll();
    } catch {
      showSnackbar("Something went wrong", "error");
    } finally {
      setTagDeleteLoading(false);
      setTagDeleteRow(null);
    }
  };

  // ── Memoised columns ──────────────────────────────────────────────────────
  const categoryColumns = useMemo(
    () => buildCategoryColumns(openEditCategory, setCategoryDeleteRow),
    [],
  );
  const tagColumns = useMemo(
    () => buildTagColumns(openEditTag, setTagDeleteRow),
    [],
  );

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <CustomErrorButton
        title="Error Loading Configuration Page"
        message={error}
        onRetry={fetchAll}
      />
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* Page header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ color: "var(--color-darker)" }}
          >
            Category & Tag
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage categories and tags for your inventory items
          </Typography>
        </Box>
        <CustomButton icon={<FaPlus />} onClick={() => setAddModalOpen(true)}>
          Add New Item
        </CustomButton>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "flex-start",
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        {/* Categories */}
        <Box sx={{ flex: 1, minWidth: 0, width: { xs: "100%", md: "auto" } }}>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              color: "var(--color-darker)",
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            Categories
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 400 }}
            >
              ({categories.length} total categories)
            </Typography>
          </Typography>
          <Box
            sx={{
              height: 400,
              backgroundColor: "#fff",
              borderRadius: 2,
              boxShadow: 1,
              overflow: "hidden",
            }}
          >
            <DataGrid
              rows={categories}
              columns={categoryColumns}
              getRowId={(row) => row.id}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              disableRowSelectionOnClick
              density="comfortable"
              sx={dataGridSx}
            />
          </Box>
        </Box>

        {/* Tags */}
        <Box sx={{ flex: 1, minWidth: 0, width: { xs: "100%", md: "auto" } }}>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              color: "var(--color-darker)",
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            Tags
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 400 }}
            >
              ({tags.length} total tags)
            </Typography>
          </Typography>
          <Box
            sx={{
              height: 400,
              backgroundColor: "#fff",
              borderRadius: 2,
              boxShadow: 1,
              overflow: "hidden",
            }}
          >
            <DataGrid
              rows={tags}
              columns={tagColumns}
              getRowId={(row) => row.id}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              disableRowSelectionOnClick
              density="comfortable"
              sx={dataGridSx}
            />
          </Box>
        </Box>
      </Box>

      {/* ── Add New modal ─────────────────────────────────────────────── */}
      <CategoryTagFormModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleAddSuccess}
        loggedInUserId={userId}
      />

      {/* ── Edit modals ───────────────────────────────────────────────── */}
      <EditCategoryModal
        open={!!editCategory}
        onClose={closeEditCategory}
        onSubmit={handleCategoryEdit}
        form={categoryForm}
        onChange={(field, val) =>
          setCategoryForm((prev) => ({ ...prev, [field]: val }))
        }
        loading={categoryEditLoading}
      />
      <EditTagModal
        open={!!editTag}
        onClose={closeEditTag}
        onSubmit={handleTagEdit}
        form={tagForm}
        onChange={(field, val) =>
          setTagForm((prev) => ({ ...prev, [field]: val }))
        }
        loading={tagEditLoading}
      />

      {/* ── Delete confirmations ──────────────────────────────────────── */}
      {categoryDeleteRow && (
        <DeleteConfirmModal
          open={!!categoryDeleteRow}
          onClose={() => setCategoryDeleteRow(null)}
          onConfirm={handleCategoryDelete}
          loading={categoryDeleteLoading}
          title="Delete Category"
          description={
            <>
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-700">
                {" "}
                {categoryDeleteRow.categoryName}{" "}
              </span>
              category? This action cannot be undone.
            </>
          }
        />
      )}
      {tagDeleteRow && (
        <DeleteConfirmModal
          open={!!tagDeleteRow}
          onClose={() => setTagDeleteRow(null)}
          onConfirm={handleTagDelete}
          loading={tagDeleteLoading}
          title="Delete Tag"
          description={
            <>
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-700">
                {" "}
                {tagDeleteRow.tagName}{" "}
              </span>
              tag? This action cannot be undone.
            </>
          }
        />
      )}

      {/* ── Snackbar ──────────────────────────────────────────────────── */}
      <SnackbarAlert
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={closeSnackbar}
        message={snackbar.message}
        severity={snackbar.severity}
        icon={snackbar.severity === "success" ? <FaCheck /> : <TbCancel />}
      />
    </Box>
  );
}
