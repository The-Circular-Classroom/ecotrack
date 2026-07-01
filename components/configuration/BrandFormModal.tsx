// @ts-nocheck
"use client";

import { useState, useRef } from "react";

// icons
import { FiTrash2 } from "react-icons/fi";
import { MdDragIndicator, MdOutlineInfo } from "react-icons/md";
import { IoClose } from "react-icons/io5";

// components
import CustomButton from "@/components/ui/CustomButton";

// ─── constants ───────────────────────────────────────────────────────────────

const API_URL = '';

const SIZE_TYPE_OPTIONS = [
  { value: "Alphabetical", label: "Alphabetical" },
  { value: "Numerical", label: "Numerical" },
  { value: "OneSize", label: "One Size" },
];



// ─── helpers ───────────────────────────────────────────────────────────────

function buildInitialCatData(editData) {
  if (!editData?.sizeCategories?.length) {
    return {
      Alphabetical: {
        catId: null,
        options: [{ id: null, name: "", sizeClass: "S" }],
        deletedOptionIds: [],
      },
    };
  }
  const data = {};
  for (const cat of editData.sizeCategories) {
    data[cat.sizeType] = {
      catId: cat.id,
      options: (cat.sizeOptions ?? [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((o) => ({
          id: o.id,
          name: o.sizeName,
          sizeClass: o.sizeClass ?? "S",
        })),
      deletedOptionIds: [],
    };
  }
  return data;
}

// ─── SizeOptionsSection ─────────────────────────────────────────────────────

function SizeOptionsSection({ sizeType, catData, setCatData }) {
  const data = catData[sizeType] ?? {
    catId: null,
    options: [{ id: null, name: "", sizeClass: "S" }],
    deletedOptionIds: [],
  };
  const { options } = data;

  const [draggingIdx, setDraggingIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const dragIdxRef = useRef(null);

  const updateCat = (patch) =>
    setCatData((prev) => ({
      ...prev,
      [sizeType]: { ...prev[sizeType], ...patch },
    }));

  const addOption = () =>
    updateCat({
      options: [...options, { id: null, name: "", sizeClass: "S" }],
    });

  const removeOption = (idx) => {
    const opt = options[idx];
    const newDeletedIds = opt.id
      ? [...data.deletedOptionIds, opt.id]
      : data.deletedOptionIds;
    updateCat({
      options: options.filter((_, i) => i !== idx),
      deletedOptionIds: newDeletedIds,
    });
  };

  const updateOptionName = (idx, name) =>
    updateCat({
      options: options.map((o, i) => (i === idx ? { ...o, name } : o)),
    });

  const updateOptionSizeClass = (idx, sizeClass) =>
    updateCat({
      options: options.map((o, i) => (i === idx ? { ...o, sizeClass } : o)),
    });

  const handleDragStart = (idx) => {
    dragIdxRef.current = idx;
    setDraggingIdx(idx);
  };
  const handleDragOver = (e, idx) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleDrop = (targetIdx) => {
    const from = dragIdxRef.current;
    if (from === null || from === targetIdx) return;
    const next = [...options];
    const [moved] = next.splice(from, 1);
    next.splice(targetIdx, 0, moved);
    updateCat({ options: next });
    dragIdxRef.current = null;
    setDraggingIdx(null);
    setDragOverIdx(null);
  };
  const handleDragEnd = () => {
    dragIdxRef.current = null;
    setDraggingIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="flex flex-col gap-2">
      {options.map((opt, idx) => (
        <div
          key={idx}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={() => handleDrop(idx)}
          onDragEnd={handleDragEnd}
          className={`flex items-center gap-2 rounded-md px-1 transition-colors ${
            draggingIdx === idx
              ? "opacity-40"
              : dragOverIdx === idx
                ? "bg-blue-50 ring-1 ring-blue-300"
                : ""
          }`}
        >
          <span className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing shrink-0 p-0.5 rounded hover:bg-gray-100 transition-colors">
            <MdDragIndicator size={20} />
          </span>
          <input
            type="text"
            value={opt.name}
            onChange={(e) => updateOptionName(idx, e.target.value)}
            placeholder="Size name..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
          />
          <div className="flex shrink-0">
            {["S", "L"].map((sc) => (
              <button
                key={sc}
                type="button"
                onClick={() => updateOptionSizeClass(idx, sc)}
                className={`w-8 h-9 border text-sm font-medium transition-all cursor-pointer first:rounded-l-md last:rounded-r-md ${
                  opt.sizeClass === sc
                    ? "bg-(--color-main) text-white border-(--color-main) z-10"
                    : "bg-white text-gray-500 border-gray-300 hover:border-gray-400 -ml-px"
                }`}
              >
                {sc}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => removeOption(idx)}
            disabled={options.length === 1}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addOption}
        className="mt-1 flex items-center gap-1 text-sm font-medium text-(--color-main) hover:opacity-80 cursor-pointer w-fit"
      >
        + Add More
      </button>
    </div>
  );
}

export default function BrandFormModal({ onClose, editData }) {
  const isEditing = !!editData;

  // Fixed at mount — used for diffing on submit and for Revert
  const originalTypes = editData?.sizeCategories?.map((c) => c.sizeType) ?? [];

  const [brandName, setBrandName] = useState(editData?.brandSupplier ?? "");
  const [selectedTypes, setSelectedTypes] = useState(
    editData?.sizeCategories?.map((c) => c.sizeType) ?? ["Alphabetical"],
  );
  const [catData, setCatData] = useState(() => buildInitialCatData(editData));
  const [submitting, setSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState(null);

  // Snapshot of original catData at mount — used for change detection
  const originalCatData = useRef(buildInitialCatData(editData));

  const headers = {
    "Content-Type": "application/json",
  };

  const showInlineError = (msg) => {
    setInlineError(msg);
    setTimeout(() => setInlineError(null), 5000);
  };

  // ─── size type toggle ──────────────────────────────────────────────────────
  const handleTypeToggle = (type) => {
    const isSelected = selectedTypes.includes(type);

    if (isSelected) {
      if (selectedTypes.length === 1) {
        showInlineError("At least one size type must be selected.");
        return;
      }
      // Keep catData[type] so the submit handler can still read catId for deletion
      setSelectedTypes((prev) => prev.filter((t) => t !== type));
    } else {
      setSelectedTypes((prev) => [...prev, type]);
      // Only initialise catData entry if it doesn't already exist
      if (!catData[type]) {
        setCatData((prev) => ({
          ...prev,
          [type]: {
            catId: null,
            options:
              type === "OneSize"
                ? []
                : [{ id: null, name: "", sizeClass: "S" }],
            deletedOptionIds: [],
          },
        }));
      }
    }
  };

  const clearAll = () => {
    setBrandName("");
    setSelectedTypes(["Alphabetical"]);
    setCatData({
      Alphabetical: {
        catId: null,
        options: [{ id: null, name: "", sizeClass: "S" }],
        deletedOptionIds: [],
      },
    });
  };

  const revertToOriginal = () => {
    setBrandName(editData?.brandSupplier ?? "");
    setSelectedTypes(originalTypes);
    setCatData(buildInitialCatData(editData));
    setInlineError(null);
  };

  // ─── submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditing) {
        // 1. Update brand name if changed
        if (brandName.trim() !== editData.brandSupplier) {
          const res = await fetch(`${API_URL}/api/inventory/brands/${editData.id}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ brand_supplier: brandName.trim() }),
          });
          if (!res.ok) {
            const d = await res.json();
            onClose({
              success: false,
              message: d.message || "Failed to update brand name",
            });
            return;
          }
        }

        // 2. Delete size categories that were removed
        const removedTypes = originalTypes.filter(
          (t) => !selectedTypes.includes(t),
        );
        for (const type of removedTypes) {
          const catId = catData[type]?.catId;
          if (catId) {
            const res = await fetch(`${API_URL}/api/inventory/sizes/category/${catId}`, {
              method: "DELETE",
              headers,
            });
            if (!res.ok) {
              const d = await res.json();
              setInlineError(
                d.message ||
                  "Cannot remove a size type that is used by item type presets.",
              );
              return; // stay in modal so user can see the error
            }
          }
        }

        // 3. Process each currently selected type
        const addedTypes = selectedTypes.filter(
          (t) => !originalTypes.includes(t),
        );
        for (const type of selectedTypes) {
          const cat = catData[type];
          if (!cat) continue;

          if (addedTypes.includes(type)) {
            // Newly added type: create the category then its options
            const catRes = await fetch(`${API_URL}/api/inventory/sizes`, {
              method: "POST",
              headers,
              body: JSON.stringify({
                brand_supplier_id: editData.id,
                size_type: type,
              }),
            });
            const catResData = await catRes.json();
            if (!catRes.ok) {
              onClose({
                success: false,
                message: catResData.message || "Failed to create size category",
              });
              return;
            }
            const newCatId = catResData.data.id;
            if (type === "OneSize") continue;
            const nonEmpty = cat.options.filter((o) => o.name.trim());
            for (let i = 0; i < nonEmpty.length; i++) {
              await fetch(`${API_URL}/api/inventory/sizes`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                  size_category_id: newCatId,
                  size_name: nonEmpty[i].name.trim(),
                  size_class: nonEmpty[i].sizeClass,
                  sort_order: i,
                }),
              });
            }
          } else {
            // Existing type: delete removed options then patch/create the rest
            await Promise.all(
              cat.deletedOptionIds.map((id) =>
                fetch(`${API_URL}/api/inventory/sizes/option/${id}`, {
                  method: "DELETE",
                  headers,
                }),
              ),
            );
            if (type === "OneSize") continue;
            const nonEmpty = cat.options.filter((o) => o.name.trim());
            let catId = cat.catId;
            for (let i = 0; i < nonEmpty.length; i++) {
              const opt = nonEmpty[i];
              if (opt.id) {
                await fetch(`${API_URL}/api/inventory/sizes/option/${opt.id}`, {
                  method: "PATCH",
                  headers,
                  body: JSON.stringify({
                    size_name: opt.name.trim(),
                    size_class: opt.sizeClass,
                    sort_order: i,
                  }),
                });
              } else {
                if (!catId) {
                  const catRes = await fetch(`${API_URL}/api/inventory/sizes`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                      brand_supplier_id: editData.id,
                      size_type: type,
                    }),
                  });
                  const catResData = await catRes.json();
                  catId = catResData.data?.id;
                }
                await fetch(`${API_URL}/api/inventory/sizes`, {
                  method: "POST",
                  headers,
                  body: JSON.stringify({
                    size_category_id: catId,
                    size_name: opt.name.trim(),
                    size_class: opt.sizeClass,
                    sort_order: i,
                  }),
                });
              }
            }
          }
        }

        onClose({ success: true, message: "Brand updated successfully" });
      } else {
        // 1. Create brand
        const brandRes = await fetch(`${API_URL}/api/inventory/brands`, {
          method: "POST",
          headers,
          body: JSON.stringify({ brand_supplier: brandName.trim() }),
        });
        const brandData = await brandRes.json();
        if (!brandRes.ok) {
          onClose({
            success: false,
            message: brandData.message || "Failed to create brand",
          });
          return;
        }
        const newBrandId = brandData.data.id;

        // 2. For each selected type: create category then options
        for (const type of selectedTypes) {
          const catRes = await fetch(`${API_URL}/api/inventory/sizes`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              brand_supplier_id: newBrandId,
              size_type: type,
            }),
          });
          const catResData = await catRes.json();
          if (!catRes.ok) {
            onClose({
              success: false,
              message: catResData.message || "Failed to create size category",
            });
            return;
          }
          const catId = catResData.data.id;

          if (type === "OneSize") continue;

          const nonEmpty = (catData[type]?.options ?? []).filter((o) =>
            o.name.trim(),
          );
          for (let i = 0; i < nonEmpty.length; i++) {
            await fetch(`${API_URL}/api/inventory/sizes`, {
              method: "POST",
              headers,
              body: JSON.stringify({
                size_category_id: catId,
                size_name: nonEmpty[i].name.trim(),
                size_class: nonEmpty[i].sizeClass,
                sort_order: i,
              }),
            });
          }
        }

        onClose({ success: true, message: "Brand created successfully" });
      }
    } catch (err) {
      console.error("Error submitting brand:", err);
      onClose({ success: false, message: "Something went wrong" });
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid =
    brandName.trim() &&
    selectedTypes.length > 0 &&
    selectedTypes.every(
      (type) =>
        type === "OneSize" ||
        (catData[type]?.options ?? []).some((o) => o.name.trim()),
    );

  // Always show Alphabetical before Numerical regardless of selection order
  const nonOneSizeTypes = ["Alphabetical", "Numerical"].filter((t) =>
    selectedTypes.includes(t),
  );

  const hasChanges = (() => {
    if (!isEditing) {
      // Add mode: any deviation from the blank default
      return (
        brandName.trim() !== "" ||
        selectedTypes.length !== 1 ||
        !selectedTypes.includes("Alphabetical") ||
        (catData["Alphabetical"]?.options?.length ?? 0) !== 1 ||
        (catData["Alphabetical"]?.options?.[0]?.name ?? "") !== "" ||
        (catData["Alphabetical"]?.options?.[0]?.sizeClass ?? "S") !== "S"
      );
    }
    // Edit mode: any deviation from original editData
    if (brandName.trim() !== (editData?.brandSupplier ?? "")) return true;
    if (selectedTypes.length !== originalTypes.length) return true;
    if (selectedTypes.some((t) => !originalTypes.includes(t))) return true;
    if (originalTypes.some((t) => !selectedTypes.includes(t))) return true;
    for (const type of originalTypes) {
      const origOpts = originalCatData.current[type]?.options ?? [];
      const currOpts = catData[type]?.options ?? [];
      if (origOpts.length !== currOpts.length) return true;
      for (let i = 0; i < origOpts.length; i++) {
        if (origOpts[i].name !== currOpts[i].name) return true;
        if (origOpts[i].sizeClass !== currOpts[i].sizeClass) return true;
      }
    }
    return false;
  })();

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-6 flex flex-col gap-5">
        {/* Inline error banner */}
        {inlineError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <IoClose className="text-red-500 shrink-0 mt-0.5" size={16} />
            <p className="text-sm text-red-600">{inlineError}</p>
          </div>
        )}

        {/* Brand Name */}
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Brand Name<span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="e.g. Nike, Zara, Patagonia"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
            required
          />
        </div>

        {/* Size Type multi-select chips */}
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Size Type<span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {SIZE_TYPE_OPTIONS.map(({ value, label }) => {
              const isSelected = selectedTypes.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleTypeToggle(value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-(--color-main) text-white border-(--color-main)"
                      : "bg-white text-gray-500 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {isEditing && (
            <p className="text-xs text-gray-400 mt-1.5">
              Size type changes are applied when you click Update Brand.
              Removing a type that has references will fail.
            </p>
          )}
        </div>

        {/* Size Options one section per non-OneSize type */}
        {nonOneSizeTypes.length > 0 && (
          <div
            className={`grid gap-6 ${nonOneSizeTypes.length > 1 ? "md:grid-cols-2 grid-cols-1" : "grid-cols-1"}`}
          >
            {nonOneSizeTypes.map((type) => (
              <div key={type} className="flex flex-col min-w-0">
                <div className="flex justify-between items-center mb-2 mr-5">
                  <label className="block text-sm font-medium text-gray-700">
                    {type} Size Options
                  </label>
                  <div className="flex items-center gap-1 shrink-0">
                    <label className="block text-sm font-medium text-gray-700">
                      Size class
                    </label>
                    <div className="relative group">
                      <MdOutlineInfo className="cursor-pointer text-gray-500" />
                      <div className="absolute right-0 z-99 hidden group-hover:block w-56 sm:w-64 p-2 text-xs text-white bg-gray-800 rounded shadow-lg">
                        {`"S" is for regular sizes, while "L" is for larger sizes. This is used for item type presets that differentiate between standard and plus sizes.`}
                      </div>
                    </div>
                  </div>
                </div>
                <SizeOptionsSection
                  sizeType={type}
                  catData={catData}
                  setCatData={setCatData}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center p-4 border-t border-gray-200 gap-10">
        {!isEditing ? (
          <button
            type="button"
            onClick={clearAll}
            disabled={!hasChanges}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear All
          </button>
        ) : (
          <button
            type="button"
            onClick={revertToOriginal}
            disabled={!hasChanges}
            className="text-sm font-medium text-red-500 hover:text-red-700 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Revert Changes
          </button>
        )}
        <div className="flex-1 flex justify-end gap-2">
          <CustomButton
            type="button"
            variant="ghost"
            onClick={() => onClose()}
            className="flex-1"
          >
            Cancel
          </CustomButton>
          <CustomButton
            type="submit"
            disabled={!isFormValid || submitting || !hasChanges}
            className="flex-1"
          >
            {submitting
              ? isEditing
                ? "Updating..."
                : "Adding..."
              : isEditing
                ? "Update Brand"
                : "Add New Brand"}
          </CustomButton>
        </div>
      </div>
    </form>
  );
}
