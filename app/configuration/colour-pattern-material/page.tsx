// @ts-nocheck
"use client";

import { useState, useEffect, useMemo } from "react";
import { useLayoutLoading } from "@/app/configuration/layout";

// mui
import { Backdrop, Box, Typography, TextField } from "@mui/material";
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
import CPMFormModal from "@/components/configuration/CPMFormModal";

// ── Shared helpers ────────────────────────────────────────────────────────────
const getApiUrl = () => '';
const getAuthHeader = () => ({});
const isValidHex = (hex) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);

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

// ── Edit Colour modal ─────────────────────────────────────────────────────────
function EditColourModal({ open, onClose, onSubmit, form, onChange, loading }) {
  return (
    <Backdrop open={open} onClick={onClose} sx={{ zIndex: 50, p: 2 }}>
      <div
        className="bg-white rounded-lg shadow-xl flex flex-col"
        style={{ width: 640, maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Edit Colour</h2>
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
                label="Colour Name"
                value={form.colourName}
                onChange={(e) => onChange("colourName", e.target.value)}
                fullWidth
                size="small"
                autoFocus
              />
              <div className="flex gap-3 items-center">
                <TextField
                  label="Hex Code"
                  value={form.hexcode}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (!value.startsWith("#")) {
                      value = "#" + value.replace(/#/g, "");
                    }
                    if (value === "") value = "#"; // fallback
                    onChange("hexcode", value);
                  }}
                  fullWidth
                  size="small"
                  placeholder="#000000"
                />
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    backgroundColor: isValidHex(form.hexcode)
                      ? form.hexcode
                      : "#cccccc",
                    border: "1px solid #ccc",
                    flexShrink: 0,
                  }}
                />
              </div>
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
              !form.colourName.trim() || !form.hexcode.trim() || loading
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

// ── Edit Name-only modal (pattern / material) ─────────────────────────────────
function EditNameModal({
  open,
  onClose,
  onSubmit,
  label,
  value,
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
          <h2 className="text-lg font-semibold text-gray-900">Edit {label}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer"
          >
            <IoClose />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="border border-gray-200 rounded-lg p-5">
            <TextField
              label="Name"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              fullWidth
              size="small"
              autoFocus
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-8 py-5 border-t shrink-0">
          <CustomButton variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </CustomButton>
          <CustomButton
            onClick={onSubmit}
            disabled={!value.trim() || loading}
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
const buildColourColumns = (onEdit, onDelete) => [
  {
    field: "colourName",
    headerName: "Name",
    flex: 1,
    minWidth: 150,
    valueGetter: (value, row) => row.colourName || "",
    renderCell: ({ row }) => (
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1, height: "100%" }}
      >
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor: row.hexcode,
            border: "1px solid #ccc",
            flexShrink: 0,
          }}
        />
        <Typography variant="body2" sx={{ color: "#111827" }}>
          {row.colourName || "-"}
        </Typography>
      </Box>
    ),
  },
  {
    field: "hexcode",
    headerName: "Hex Code",
    width: 100,
    renderCell: ({ value }) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        <Typography variant="body2" sx={{ color: "#111827" }}>
          {value || "-"}
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

const buildPatternColumns = (onEdit, onDelete) => [
  {
    field: "patternName",
    headerName: "Name",
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

const buildMaterialColumns = (onEdit, onDelete) => [
  {
    field: "materialName",
    headerName: "Name",
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
export default function ColourPatternMaterialPage() {
  const { setLoading } = useLayoutLoading();

  // ── Data ──────────────────────────────────────────────────────────────────
  const [colours, setColours] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState(null);

  // ── Add New modal ─────────────────────────────────────────────────────────
  const [addModalOpen, setAddModalOpen] = useState(false);

  // ── Edit modals ───────────────────────────────────────────────────────────
  const [editColour, setEditColour] = useState(null);
  const [colourForm, setColourForm] = useState({
    colourName: "",
    hexcode: "#",
  });
  const [colourEditLoading, setColourEditLoading] = useState(false);

  const [editPattern, setEditPattern] = useState(null);
  const [patternName, setPatternName] = useState("");
  const [patternEditLoading, setPatternEditLoading] = useState(false);

  const [editMaterial, setEditMaterial] = useState(null);
  const [materialName, setMaterialName] = useState("");
  const [materialEditLoading, setMaterialEditLoading] = useState(false);

  // ── Delete modals ─────────────────────────────────────────────────────────
  const [colourDeleteRow, setColourDeleteRow] = useState(null);
  const [colourDeleteLoading, setColourDeleteLoading] = useState(false);
  const [patternDeleteRow, setPatternDeleteRow] = useState(null);
  const [patternDeleteLoading, setPatternDeleteLoading] = useState(false);
  const [materialDeleteRow, setMaterialDeleteRow] = useState(null);
  const [materialDeleteLoading, setMaterialDeleteLoading] = useState(false);

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
      const [cRes, pRes, mRes] = await Promise.all([
        fetch(`${base}/api/inventory/colours`, { headers }),
        fetch(`${base}/api/inventory/patterns`, { headers }),
        fetch(`${base}/api/inventory/materials`, { headers }),
      ]);
      if (!cRes.ok || !pRes.ok || !mRes.ok)
        throw new Error("Failed to fetch configuration data");
      const [cData, pData, mData] = await Promise.all([
        cRes.json(),
        pRes.json(),
        mRes.json(),
      ]);
      setColours(cData.data || []);
      setPatterns(pData.data || []);
      setMaterials(mData.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

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

  // ── Edit Colour ───────────────────────────────────────────────────────────
  const openEditColour = (row) => {
    setColourForm({ colourName: row.colourName, hexcode: row.hexcode });
    setEditColour(row);
  };
  const closeEditColour = () => setEditColour(null);

  const handleColourEdit = async () => {
    setColourEditLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/inventory/colours/${editColour.id}`, {
        method: "PATCH",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({
          colour_name: colourForm.colourName,
          hexcode: colourForm.hexcode,
        }),
      });
      const data = await res.json();
      showSnackbar(
        data.message || "Colour updated",
        res.ok ? "success" : "error",
      );
      if (res.ok) {
        closeEditColour();
        fetchAll();
      }
    } catch {
      showSnackbar("Something went wrong", "error");
    } finally {
      setColourEditLoading(false);
    }
  };

  const handleColourDelete = async () => {
    setColourDeleteLoading(true);
    try {
      const res = await fetch(
        `${getApiUrl()}/api/inventory/colours/${colourDeleteRow.id}`,
        { method: "DELETE", headers: getAuthHeader() },
      );
      const data = await res.json();
      showSnackbar(
        data.message || "Colour deleted",
        res.ok ? "success" : "error",
      );
      if (res.ok) fetchAll();
    } catch {
      showSnackbar("Something went wrong", "error");
    } finally {
      setColourDeleteLoading(false);
      setColourDeleteRow(null);
    }
  };

  // ── Edit Pattern ──────────────────────────────────────────────────────────
  const openEditPattern = (row) => {
    setPatternName(row.patternName);
    setEditPattern(row);
  };
  const closeEditPattern = () => setEditPattern(null);

  const handlePatternEdit = async () => {
    setPatternEditLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/inventory/patterns/${editPattern.id}`, {
        method: "PATCH",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ pattern_name: patternName }),
      });
      const data = await res.json();
      showSnackbar(
        data.message || "Pattern updated",
        res.ok ? "success" : "error",
      );
      if (res.ok) {
        closeEditPattern();
        fetchAll();
      }
    } catch {
      showSnackbar("Something went wrong", "error");
    } finally {
      setPatternEditLoading(false);
    }
  };

  const handlePatternDelete = async () => {
    setPatternDeleteLoading(true);
    try {
      const res = await fetch(
        `${getApiUrl()}/api/inventory/patterns/${patternDeleteRow.id}`,
        { method: "DELETE", headers: getAuthHeader() },
      );
      const data = await res.json();
      showSnackbar(
        data.message || "Pattern deleted",
        res.ok ? "success" : "error",
      );
      if (res.ok) fetchAll();
    } catch {
      showSnackbar("Something went wrong", "error");
    } finally {
      setPatternDeleteLoading(false);
      setPatternDeleteRow(null);
    }
  };

  // ── Edit Material ─────────────────────────────────────────────────────────
  const openEditMaterial = (row) => {
    setMaterialName(row.materialName);
    setEditMaterial(row);
  };
  const closeEditMaterial = () => setEditMaterial(null);

  const handleMaterialEdit = async () => {
    setMaterialEditLoading(true);
    try {
      const res = await fetch(
        `${getApiUrl()}/api/inventory/materials/${editMaterial.id}`,
        {
          method: "PATCH",
          headers: { ...getAuthHeader(), "Content-Type": "application/json" },
          body: JSON.stringify({ material_name: materialName }),
        },
      );
      const data = await res.json();
      showSnackbar(
        data.message || "Material updated",
        res.ok ? "success" : "error",
      );
      if (res.ok) {
        closeEditMaterial();
        fetchAll();
      }
    } catch {
      showSnackbar("Something went wrong", "error");
    } finally {
      setMaterialEditLoading(false);
    }
  };

  const handleMaterialDelete = async () => {
    setMaterialDeleteLoading(true);
    try {
      const res = await fetch(
        `${getApiUrl()}/api/inventory/materials/${materialDeleteRow.id}`,
        { method: "DELETE", headers: getAuthHeader() },
      );
      const data = await res.json();
      showSnackbar(
        data.message || "Material deleted",
        res.ok ? "success" : "error",
      );
      if (res.ok) fetchAll();
    } catch {
      showSnackbar("Something went wrong", "error");
    } finally {
      setMaterialDeleteLoading(false);
      setMaterialDeleteRow(null);
    }
  };

  // ── Memoised columns ──────────────────────────────────────────────────────
  const colourColumns = useMemo(
    () => buildColourColumns(openEditColour, setColourDeleteRow),
    [],
  );
  const patternColumns = useMemo(
    () => buildPatternColumns(openEditPattern, setPatternDeleteRow),
    [],
  );
  const materialColumns = useMemo(
    () => buildMaterialColumns(openEditMaterial, setMaterialDeleteRow),
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
            Colour, Pattern & Material
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage core attributes for your inventory management system
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
        {/* Colours */}
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
            Colours
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 400 }}
            >
              ({colours.length} total colours)
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
              rows={colours}
              columns={colourColumns}
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

        {/* Patterns */}
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
            Patterns
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 400 }}
            >
              ({patterns.length} total patterns)
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
              rows={patterns}
              columns={patternColumns}
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

        {/* Materials */}
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
            Materials
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 400 }}
            >
              ({materials.length} total materials)
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
              rows={materials}
              columns={materialColumns}
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
      <CPMFormModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* ── Edit modals ───────────────────────────────────────────────── */}
      <EditColourModal
        open={!!editColour}
        onClose={closeEditColour}
        onSubmit={handleColourEdit}
        form={colourForm}
        onChange={(field, val) =>
          setColourForm((prev) => ({ ...prev, [field]: val }))
        }
        loading={colourEditLoading}
      />
      <EditNameModal
        open={!!editPattern}
        onClose={closeEditPattern}
        onSubmit={handlePatternEdit}
        label="Pattern"
        value={patternName}
        onChange={setPatternName}
        loading={patternEditLoading}
      />
      <EditNameModal
        open={!!editMaterial}
        onClose={closeEditMaterial}
        onSubmit={handleMaterialEdit}
        label="Material"
        value={materialName}
        onChange={setMaterialName}
        loading={materialEditLoading}
      />

      {/* ── Delete confirmations ──────────────────────────────────────── */}
      {colourDeleteRow && (
        <DeleteConfirmModal
          open={!!colourDeleteRow}
          onClose={() => setColourDeleteRow(null)}
          onConfirm={handleColourDelete}
          loading={colourDeleteLoading}
          title="Delete Colour"
          description={
            <>
              Are you sure you want to delete <span className="font-medium text-gray-700"> {colourDeleteRow.colourName} </span>
              colour? This action cannot be undone.
            </>
          }
        />
      )}
      {patternDeleteRow && (
        <DeleteConfirmModal
          open={!!patternDeleteRow}
          onClose={() => setPatternDeleteRow(null)}
          onConfirm={handlePatternDelete}
          loading={patternDeleteLoading}
          title="Delete Pattern"
          description={
            <>
              Are you sure you want to delete <span className="font-medium text-gray-700"> {patternDeleteRow.patternName} </span>
              pattern? This action cannot be undone.
            </>
          }
        />
      )}
      {materialDeleteRow && (
        <DeleteConfirmModal
          open={!!materialDeleteRow}
          onClose={() => setMaterialDeleteRow(null)}
          onConfirm={handleMaterialDelete}
          loading={materialDeleteLoading}
          title="Delete Material"
          description={
            <>
              Are you sure you want to delete <span className="font-medium text-gray-700"> {materialDeleteRow.materialName} </span>
              material? This action cannot be undone.
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
