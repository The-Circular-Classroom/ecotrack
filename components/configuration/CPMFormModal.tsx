// @ts-nocheck
"use client";

import { useState } from "react";

// mui
import { Backdrop, Box, TextField } from "@mui/material";

// icons
import { FaPlus } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { FiTrash2 } from "react-icons/fi";

// components
import CustomButton from "@/components/ui/CustomButton";

// ── constants ─────────────────────────────────────────────────────────────────
const TYPES = ["Colour", "Pattern", "Material"];
const emptyColourRow = () => ({ name: "", hexcode: "#" });
const emptyNameRow = () => ({ name: "" });

const getApiUrl = () => '';
const getAuthHeader = () => ({});
const isValidHex = (hex) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);

// ── CPMFormModal ──────────────────────────────────────────────────────────────
export default function CPMFormModal({ open, onClose, onSuccess }) {
  const [type, setType] = useState("Colour");
  const [rows, setRows] = useState([emptyColourRow()]);
  const [loading, setLoading] = useState(false);

  const handleTypeChange = (t) => {
    setType(t);
    setRows([t === "Colour" ? emptyColourRow() : emptyNameRow()]);
  };

  const updateRow = (idx, field, value) =>
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
    );

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      type === "Colour" ? emptyColourRow() : emptyNameRow(),
    ]);

  const removeRow = (idx) =>
    setRows((prev) => prev.filter((_, i) => i !== idx));

  const canSubmit = rows.every((r) =>
    type === "Colour" ? r.name.trim() && r.hexcode.trim() : r.name.trim(),
  );

  const handleClose = () => {
    setType("Colour");
    setRows([emptyColourRow()]);
    onClose();
  };

  const handleSubmit = async () => {
    setLoading(true);
    const base = getApiUrl();
    const headers = { ...getAuthHeader(), "Content-Type": "application/json" };

    const endpoint =
      type === "Colour"
        ? "colour"
        : type === "Pattern"
          ? "pattern"
          : "material";

    const payloads = rows.map((r) =>
      type === "Colour"
        ? { colour_name: r.name.trim(), hexcode: r.hexcode.trim() }
        : type === "Pattern"
          ? { pattern_name: r.name.trim() }
          : { material_name: r.name.trim() },
    );

    const results = await Promise.allSettled(
      payloads.map((body) =>
        fetch(`${base}/api/${endpoint}`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        }).then((r) => r.json().then((d) => ({ ok: r.ok, ...d }))),
      ),
    );

    const failed = results.filter(
      (r) => r.status === "rejected" || !r.value?.success,
    );
    const succeeded = results.length - failed.length;
    setLoading(false);
    if (succeeded > 0) handleClose();
    onSuccess(succeeded, failed.length, type);
  };

  return (
    <Backdrop open={open} onClick={handleClose} sx={{ zIndex: 50, p: 2 }}>
      <div
        className="bg-white rounded-lg shadow-xl flex flex-col"
        style={{ width: 640, maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Add New Item</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer"
          >
            <IoClose />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Type<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`px-3 py-2 border rounded-md text-sm font-medium transition-all cursor-pointer ${
                    type === t
                      ? "bg-[var(--color-main)] text-white border-[var(--color-main)]"
                      : "bg-white text-gray-500 border-gray-300 hover:border-gray-400"
                  }`}
                  onClick={() => handleTypeChange(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Entry rows */}
          <div className="space-y-5">
            {rows.map((row, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    #{idx + 1}
                  </span>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="text-red-400 hover:text-red-600 cursor-pointer transition-colors"
                      title="Remove entry"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>

                {type === "Colour" ? (
                  <div className="flex gap-3">
                    <TextField
                      label="Colour Name"
                      value={row.name}
                      onChange={(e) => updateRow(idx, "name", e.target.value)}
                      fullWidth
                      size="small"
                    />

                    <div className="flex gap-3 items-center">
                      <TextField
                        label="Hex Code"
                        value={row.hexcode}
                        onChange={(e) => {
                          let value = e.target.value;
                          // Prevent deleting the "#"
                          if (!value.startsWith("#")) {
                            value = "#" + value.replace(/#/g, "");
                          }
                          if (value === "") value = "#"; // fallback
                          updateRow(idx, "hexcode", value);
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
                          backgroundColor: isValidHex(row.hexcode)
                            ? row.hexcode
                            : "#cccccc",
                          border: "1px solid #ccc",
                          flexShrink: 0,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <TextField
                    label={`${type} Name`}
                    value={row.name}
                    onChange={(e) => updateRow(idx, "name", e.target.value)}
                    fullWidth
                    size="small"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Add more */}
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 text-sm text-[var(--color-main)] hover:text-[var(--color-main-hover)] font-medium cursor-pointer transition-colors"
          >
            <FaPlus size={12} />
            Add more
          </button>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-8 py-5 border-t shrink-0">
          <CustomButton
            variant="ghost"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </CustomButton>
          <CustomButton
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="flex-1"
          >
            {loading
              ? "Adding..."
              : `Add New ${type}${rows.length > 1 ? ` (${rows.length})` : ""}`}
          </CustomButton>
        </div>
      </div>
    </Backdrop>
  );
}
