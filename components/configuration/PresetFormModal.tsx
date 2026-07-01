// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";

// icon
import { IoClose } from "react-icons/io5";

// components
import CustomButton from "@/components/ui/CustomButton";

// ─── helpers ────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_INVENTORY_API_URL;

const getToken = () => {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("accessToken");
};

const apiFetch = (path) =>
  fetch(`${API_URL}/api/${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  }).then((res) => {
    if (!res.ok) throw new Error(`Failed to fetch ${path}`);
    return res.json().then((d) => d.data);
  });

// ─── ColorDropdown ───────────────────────────────────────────────────────────

function ColorDropdown({ label, value, onChange, colours, required }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = value ? colours.find((c) => c.id === value) : null;

  const triggerClass =
    "w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 " +
    "flex items-center justify-between cursor-pointer";

  return (
    <div className="flex flex-col" ref={ref}>
      <label className="block text-sm font-medium text-gray-900 mb-2">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={triggerClass}
        >
          {selected ? (
            <span className="flex items-center gap-2">
              <Swatch hex={selected.hexcode} />
              {selected.colourName}
            </span>
          ) : (
            <span>Select {label}</span>
          )}
          <ChevronIcon />
        </button>

        {open && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
            <li
              className="px-3 py-2 text-gray-400 cursor-pointer hover:bg-gray-50 text-sm"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              Select {label}
            </li>
            {colours.map((colour) => (
              <li
                key={colour.id}
                onClick={() => {
                  onChange(colour.id);
                  setOpen(false);
                }}
                className="flex items-center text-gray-700 gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
              >
                <Swatch hex={colour.hexcode} />
                {colour.colourName}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── TagsDropdown ────────────────────────────────────────────────────────────

function TagsDropdown({ tags, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = tags.filter((t) =>
    t.tagName.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (id) => {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
    );
  };

  const selectedTags = tags.filter((t) => value.includes(t.id));

  return (
    <div className="flex flex-col" ref={ref}>
      <label className="block text-sm font-medium text-gray-900 mb-2">
        Tags
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between cursor-pointer min-h-[38px]"
        >
          {selectedTags.length > 0 ? (
            <span className="flex flex-wrap gap-1">
              {selectedTags.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                >
                  {t.tagName}
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(t.id);
                    }}
                    className="hover:text-blue-600 cursor-pointer"
                  >
                    ×
                  </span>
                </span>
              ))}
            </span>
          ) : (
            <span>Select tags</span>
          )}
          <ChevronIcon />
        </button>

        {open && (
          <div className="absolute z-20 bottom-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg overflow-hidden max-h-56 overflow-y-auto">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tags..."
                className="w-full px-2 py-1 text-sm text-gray-400 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <ul className="max-h-44 overflow-y-auto">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-400">
                  No tags found
                </li>
              ) : (
                filtered.map((tag) => (
                  <li
                    key={tag.id}
                    onClick={() => toggle(tag.id)}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm"
                  >
                    <input
                      type="checkbox"
                      readOnly
                      checked={value.includes(tag.id)}
                      className="accent-blue-500"
                    />
                    <p className="text-gray-700">{tag.tagName}</p>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── tiny shared UI ──────────────────────────────────────────────────────────

const Swatch = ({ hex }) => (
  <span
    style={{
      width: 16,
      height: 16,
      borderRadius: "50%",
      backgroundColor: hex || "#fff",
      border: "1px solid #ccc",
      display: "inline-block",
      flexShrink: 0,
    }}
  />
);

const ChevronIcon = () => (
  <svg
    className="w-3 h-3 text-gray-500 flex-shrink-0 ml-2"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PresetForm({ onClose, editData }) {
  const isEditing = !!editData;
  const lastSecondaryColor = useRef(null);

  const [data, setData] = useState({
    itemCategories: [],
    brands: [],
    materials: [],
    patterns: [],
    colours: [],
    schools: [],
    tags: [],
  });
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    categoryId: "",
    brandId: "",
    sizeType: "",
    materialId: "",
    gender: "Male",
    primaryColor: null,
    hasSecondaryColor: false,
    secondaryColor: null,
    patternId: "",
    tags: [],
    schoolId: "",
    schoolName: "",
    image: null,
    imagePreview: null,
    removeImage: false,
  });
  const [submitting, setSubmitting] = useState(false);

  // ── handlers ────────────────────────────────────────────────────────────
  const set = (patch) => setFormData((prev) => ({ ...prev, ...patch }));

  // ── fetch all data in parallel ──────────────────────────────────────────
  useEffect(() => {
    const endpoints = [
      "category",
      "brand",
      "material",
      "pattern",
      "colour",
      "school",
      "tag",
    ];
    const keys = [
      "itemCategories",
      "brands",
      "materials",
      "patterns",
      "colours",
      "schools",
      "tags",
    ];

    Promise.allSettled(endpoints.map(apiFetch)).then((results) => {
      const updates = {};
      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          updates[keys[i]] = result.value;
        } else {
          console.error(`Failed to fetch ${endpoints[i]}:`, result.reason);
        }
      });
      setData((prev) => ({ ...prev, ...updates }));
      setLoadingData(false);
    });
  }, []);

  useEffect(() => {
    if (!isEditing || loadingData) return;

    apiFetch(`item-type/preset/${editData.item_type_id}`)
      .then((d) => {
        const secondaryColor = d.secondaryColourId ?? null;
        lastSecondaryColor.current = secondaryColor;
        set({
          schoolId: String(d.schoolId),
          schoolName: d.schoolName,
          categoryId: String(d.categoryId),
          brandId: String(d.brandSupplierId),
          sizeType: d.sizeType ?? "",
          materialId: d.materialId ? String(d.materialId) : "",
          gender: d.gender,
          primaryColor: d.primaryColourId ?? null,
          hasSecondaryColor: !!d.secondaryColourId,
          secondaryColor,
          patternId: d.patternId ? String(d.patternId) : "",
          tags: d.tags,
          imagePreview: d.imageUrl ?? null,
        });
      })
      .catch(console.error);
  }, [isEditing, loadingData]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (formData.imagePreview && formData.imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(formData.imagePreview);
    }

    set({
      image: file,
      imagePreview: URL.createObjectURL(file),
      removeImage: false,
    });
  };

  const handleRemoveImage = () => {
    if (formData.image && formData.imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    set({ image: null, imagePreview: null, removeImage: true });
  };

  useEffect(() => {
    return () => {
      if (formData.imagePreview && formData.imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(formData.imagePreview);
      }
    };
  }, [formData.imagePreview]);

  const handleSecondaryColorToggle = (checked) => {
    if (checked) {
      // Restore the last saved secondary color
      set({
        hasSecondaryColor: true,
        secondaryColor: lastSecondaryColor.current,
      });
    } else {
      // Save current value to ref, clear from state
      lastSecondaryColor.current = formData.secondaryColor;
      set({ hasSecondaryColor: false, secondaryColor: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = new FormData();

    // Image file
    if (formData.image) payload.append("image", formData.image);

    // Required fields
    payload.append("schoolId", formData.schoolId);
    payload.append("schoolName", formData.schoolName);
    payload.append("categoryId", formData.categoryId);
    payload.append("primaryColourId", formData.primaryColor);
    payload.append("brandSupplierId", formData.brandId);
    payload.append("sizeType", formData.sizeType);
    payload.append("gender", formData.gender);

    // Optional fields
    if (formData.materialId) payload.append("materialId", formData.materialId);
    if (formData.hasSecondaryColor && formData.secondaryColor) {
      payload.append("secondaryColourId", formData.secondaryColor);
    } else {
      payload.append("secondaryColourId", "null");
    }
    if (formData.patternId) payload.append("patternId", formData.patternId);
    if (formData.tags?.length > 0)
      formData.tags.forEach((tagId) => payload.append("tags[]", tagId));
    if (formData.removeImage && !formData.image)
      payload.append("removeImage", "true");

    try {
      const response = await fetch(
        isEditing
          ? `${API_URL}/api/item-type/preset/${editData.item_type_id}`
          : `${API_URL}/api/item-type/preset`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
          },
          body: payload,
        },
      );

      const result = await response.json();

      if (!response.ok) {
        onClose({
          success: false,
          message: isEditing
            ? result.message || "Failed to update preset"
            : result.message || "Failed to create preset",
        });
        return;
      }

      onClose({
        success: true,
        message: isEditing
          ? "Preset updated successfully"
          : "Preset created successfully",
      });
    } catch (err) {
      console.error("Error submitting preset:", err);
      onClose({ success: false, message: "Something went wrong" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── class helpers ────────────────────────────────────────────────────────
  const selectClass =
    "px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm text-gray-900 bg-white " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none " +
    "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMS41TDYgNi41TDExIDEuNSIgc3Ryb2tlPSIjNkI3MjgwIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] " +
    "bg-no-repeat bg-[center_right_0.75rem]";

  const disabledSelectClass =
    selectClass + " opacity-50 cursor-not-allowed bg-gray-100";

  // ── form validation ──────────────────────────────────────────────────────
  const isFormValid =
    formData.categoryId &&
    formData.brandId &&
    formData.sizeType &&
    formData.gender &&
    formData.primaryColor &&
    formData.schoolId;

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        {/* ── Left: Image Upload ───────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <label className="block text-sm font-medium text-gray-900">
            Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="imageUpload"
          />
          <label
            htmlFor="imageUpload"
            className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center bg-gray-50 min-h-[300px] flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-100 transition-colors"
          >
            {formData.imagePreview ? (
              <img
                src={formData.imagePreview}
                alt="Preview"
                className="max-w-full max-h-[300px] object-contain rounded"
              />
            ) : (
              <span className="text-gray-500 text-sm">
                Click to upload image
              </span>
            )}
          </label>

          {formData.image ? (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📷</div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {formData.image.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.round(formData.image.size / 1024)}kb
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-gray-500 hover:bg-gray-200 hover:text-gray-900 p-1 rounded cursor-pointer"
              >
                <IoClose />
              </button>
            </div>
          ) : (
            formData.imagePreview && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🖼️</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Current image
                    </div>
                    <div className="text-xs text-gray-500">
                      Saved image from database
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-gray-500 hover:bg-gray-200 hover:text-gray-900 p-1 rounded cursor-pointer"
                >
                  <IoClose />
                </button>
              </div>
            )
          )}
        </div>

        {/* ── Right: Form Fields ───────────────────────────────── */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {/* Category + Brand */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Item Category<span className="text-red-500 ml-0.5">*</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => set({ categoryId: e.target.value })}
                className={selectClass}
                required
              >
                <option value="">Select Item Category</option>
                {data.itemCategories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.categoryName} ({c.weightKg} KG)
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Brand<span className="text-red-500 ml-0.5">*</span>
              </label>
              <select
                value={formData.brandId}
                onChange={(e) => set({ brandId: e.target.value, sizeType: "" })}
                className={selectClass}
                required
              >
                <option value="">Select Brand</option>
                {data.brands.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.brandSupplier}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Size + Material */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Size Category<span className="text-red-500 ml-0.5">*</span>
              </label>
              <select
                value={formData.sizeType}
                onChange={(e) => set({ sizeType: e.target.value })}
                className={
                  !formData.brandId ? disabledSelectClass : selectClass
                }
                disabled={!formData.brandId}
                required
              >
                <option value="">
                  {formData.brandId
                    ? "Select Size Category"
                    : "Select a Brand first"}
                </option>
                {["Alphabetical", "Numerical", "OneSize"]
                  .filter((t) =>
                    (
                      data.brands.find((b) => b.id === Number(formData.brandId))
                        ?.sizeCategories ?? []
                    ).some((sc) => sc.sizeType === t),
                  )
                  .map((sizeType) => (
                    <option key={sizeType} value={sizeType}>
                      {sizeType === "OneSize" ? "One Size" : sizeType}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Material
              </label>
              <select
                value={formData.materialId}
                onChange={(e) => set({ materialId: e.target.value })}
                className={selectClass}
              >
                <option value="">Select Material</option>
                {data.materials.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.materialName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Gender */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Gender<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["Male", "Female", "Unisex"].map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`px-3 py-2 border rounded-md text-sm font-medium transition-all cursor-pointer ${
                    formData.gender === g
                      ? "bg-[var(--color-main)] text-white border-[var(--color-main)]"
                      : "bg-white text-gray-500 border-gray-300 hover:border-gray-400"
                  }`}
                  onClick={() => set({ gender: g })}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Color + Pattern */}
          <div
            className={`grid grid-cols-1 ${formData.hasSecondaryColor ? "md:grid-cols-3" : "md:grid-cols-2"} gap-4`}
          >
            <div className="flex flex-col gap-3">
              {/* Primary color */}
              <ColorDropdown
                label="Primary Color"
                value={formData.primaryColor}
                onChange={(v) => set({ primaryColor: v })}
                colours={data.colours}
                required
              />

              {/* Secondary color toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                <input
                  type="checkbox"
                  checked={formData.hasSecondaryColor}
                  onChange={(e) => handleSecondaryColorToggle(e.target.checked)}
                  className="accent-blue-500 w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-600">
                  Add secondary color
                </span>
              </label>
            </div>

            {/* Secondary color dropdown — shown only when toggled */}
            {formData.hasSecondaryColor && (
              <div className="flex flex-col">
                <ColorDropdown
                  label="Secondary Color"
                  value={formData.secondaryColor}
                  onChange={(v) => {
                    lastSecondaryColor.current = v;
                    set({ secondaryColor: v });
                  }}
                  colours={data.colours.filter(
                    (c) => c.id !== formData.primaryColor,
                  )}
                />
              </div>
            )}

            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Pattern
              </label>
              <select
                value={formData.patternId}
                onChange={(e) => set({ patternId: e.target.value })}
                className={selectClass}
              >
                <option value="">Select Pattern</option>
                {data.patterns.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.patternName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <TagsDropdown
            tags={data.tags}
            value={formData.tags}
            onChange={(v) => set({ tags: v })}
          />

          {/* School */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              School<span className="text-red-500 ml-0.5">*</span>
            </label>
            <select
              value={formData.schoolId}
              onChange={(e) => {
                const selected = data.schools.find(
                  (s) => String(s.id) === e.target.value,
                );
                set({
                  schoolId: e.target.value,
                  schoolName: selected?.schoolName ?? "",
                });
              }}
              className={selectClass}
            >
              <option value="">Select School</option>
              {data.schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.schoolName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center p-4 border-t border-gray-200 gap-3">
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
          disabled={!isFormValid || submitting}
          className="flex-1"
        >
          {submitting
            ? isEditing
              ? "Updating..."
              : "Adding..."
            : isEditing
              ? "Update Preset"
              : "Add New Preset"}
        </CustomButton>
      </div>
    </form>
  );
}
