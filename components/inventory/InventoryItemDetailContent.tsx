// @ts-nocheck
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRoleFromSession } from "@/utils/auth";
import { resolveSchool, toSlug, slugToLabel, colorSlugToLabel } from "@/utils/inventoryNav";

import { Box, Typography } from "@mui/material";
import { FaPlus, FaCheck } from "react-icons/fa6";
import { FaChevronLeft } from "react-icons/fa";
import { TbCancel } from "react-icons/tb";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import CustomErrorButton from "@/components/ui/CustomErrorButton";
import CustomButton from "@/components/ui/CustomButton";
import ItemsDetailView from "@/components/inventory/ItemsDetailView";
import AddMethodModal from "@/components/AddMethodModal";
import ItemDetailsModal from "@/components/ItemDetailsModal";
import UploadCSVModal from "@/components/UploadCSVModal";
import SnackbarAlert from "@/components/SnackbarAlert";

/**
 * Admin items view — /inventory/items/school/[category]/[color]
 * Breadcrumb: Schools / School Name / Category
 */
export default function SchoolCategoryColorContent() {
  const { category: categorySlug, color: colorSlug } = useParams();
  const router = useRouter();

  const [role, setRole] = useState("UNKNOWN");
  const isAdmin = role === "TCC_ADMIN";

  const [school, setSchool] = useState(null);
  const [items, setItems] = useState([]);
  const [colorCount, setColorCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [itemDetailsModalOpen, setItemDetailsModalOpen] = useState(false);
  const [uploadCSVModalOpen, setUploadCSVModalOpen] = useState(false);
  const [psgItems, setPsgItems] = useState([]);
  const [donationDrives, setDonationDrives] = useState([]);
  const [itemDetailsSubmitting, setItemDetailsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const apiUrl = '';
  const categoryLabel = useMemo(() => slugToLabel(categorySlug), [categorySlug]);
  const colorLabel = useMemo(() => colorSlugToLabel(colorSlug), [colorSlug]);

  useEffect(() => { setRole(getRoleFromSession()); }, []);

  useEffect(() => {
    if (role === "UNKNOWN") return;
    resolveSchool(apiUrl, role === "TCC_ADMIN")
      .then(setSchool)
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [role, apiUrl]);

  const fetchData = useCallback(async () => {
    if (!school?.id) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/inventory/balance?schoolId=${school.id}`
      );
      if (!res.ok) throw new Error("Failed to fetch balances");
      const result = await res.json();
      const catRows = (result.balances || result.data || []).filter(
        (row) => toSlug(row?.itemType?.category?.categoryName || "") === categorySlug
      );
      const distinctColors = new Set(
        catRows.map((row) => toSlug(row?.itemType?.primaryColour?.colourName || ""))
      ).size;
      setColorCount(distinctColors);

      const rows = catRows.filter(
        (row) => toSlug(row?.itemType?.primaryColour?.colourName || "") === colorSlug
      );
      setItems(rows);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [school, categorySlug, colorSlug]);

  const fetchPresetData = useCallback(async (schoolId) => {
    try {
      const url = `/api/inventory/item-types?schoolId=${schoolId}&pageSize=100`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch item type data");
      const result = await res.json();
      setPsgItems(result.itemTypes || result.data || []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchDonationDrives = useCallback(async (schoolId) => {
    if (!schoolId) return;
    try {
      const res = await fetch(`/api/donation-drive/school/${schoolId}`);
      if (!res.ok) throw new Error("Failed to fetch donation drives");
      const result = await res.json();
      setDonationDrives(result.data || result || []);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    if (school?.id) {
      fetchData();
      fetchPresetData(school.id);
      fetchDonationDrives(school.id);
    }
  }, [school, fetchData, fetchPresetData, fetchDonationDrives]);

  // Add modal handlers
  const closeAddModal = () => { setAddModalOpen(false); setItemDetailsModalOpen(false); };
  const chooseAddManually = () => { setAddModalOpen(false); setItemDetailsModalOpen(true); };
  const chooseUploadExcel = () => { setAddModalOpen(false); setUploadCSVModalOpen(true); };

  const handleAddNewItemSubmit = useCallback(async (formData) => {
    setItemDetailsSubmitting(true);
    try {
      const res = await fetch("/api/donation-drive/donate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category_name: formData.category_name,
          primary_colour: formData.primary_colour,
          primary_colour_hex: formData.primary_colour_hex,
          secondary_colour: formData.secondary_colour,
          secondary_colour_hex: formData.secondary_colour_hex,
          size_name: formData.size_name,
          quantity: formData.quantity,
          to_status: formData.to_status,
          item_type_id: formData.item_type_id,
          school_id: formData.school_id,
          donation_drive_id: formData.donation_drive_id,
          transaction_type: "DonationIn",
          to_stored_at: formData.to_stored_at,
          remarks: "Manual donation",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setSnackbar({ open: true, message: errData.message || "Failed to add new piece", severity: "error" });
        throw new Error(errData.message || "Failed to add new piece");
      }

      setSnackbar({ open: true, message: "Items added successfully", severity: "success" });
      setItemDetailsModalOpen(false);
      fetchData();
      if (school?.id) fetchPresetData(school.id);
    } catch (err) {
      setSnackbar({ open: true, message: err?.message || "Failed to add new piece", severity: "error" });
    } finally {
      setItemDetailsSubmitting(false);
    }
  }, [school, fetchData, fetchPresetData]);

  const canOpenAdd = !!school?.id && (isAdmin || psgItems.length > 0);
  const schoolName = school?.schoolName || "";

  if (loading) return <LoadingSpinner />;
  if (error)
    return (
      <Box sx={{ p: 4 }}>
        <CustomErrorButton onClick={fetchData} />
        <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>
      </Box>
    );

  return (
    <Box sx={{ p: { xs: 2, sm: 4 } }}>
      {/* ── Page title + Add button ── */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
        <Typography variant="h4" fontWeight={700} sx={{ color: "var(--color-darker)" }}>
          Inventory by Items
        </Typography>

        {canOpenAdd && (
          <CustomButton
            onClick={() => setAddModalOpen(true)}
            icon={<FaPlus />}
            className="w-full sm:w-auto"
          >
            Add New Piece
          </CustomButton>
        )}
      </Box>

      {/* ── Breadcrumb: Schools / School Name / Category ── */}
      <div className="mb-4 overflow-x-auto">
        <nav className="flex items-center gap-2 text-sm whitespace-nowrap">
          <button type="button" onClick={() => router.push("/inventory/items")}
            className="cursor-pointer text-[var(--color-main)] hover:underline">
            Schools
          </button>
          <span className="text-gray-400">/</span>
          <button type="button" onClick={() => router.push("/inventory/items/school")}
            className="cursor-pointer text-[var(--color-main)] hover:underline">
            {schoolName}
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-semibold">{categoryLabel}</span>
        </nav>
      </div>

      {colorCount > 1 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => router.push(`/inventory/items/school/${categorySlug}`)}
            className="inline-flex items-center gap-1 text-sm text-[var(--color-main)] hover:underline cursor-pointer"
          >
            <FaChevronLeft />
            View all colours
          </button>
        </div>
      )}

      <ItemsDetailView items={items} isAdmin={isAdmin} schoolLogoUrl={school?.logoUrl} />

      {/* ── Modals ── */}
      <SnackbarAlert
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={(e, reason) => { if (reason !== "clickaway") setSnackbar((p) => ({ ...p, open: false })); }}
        message={snackbar.message}
        icon={snackbar.severity === "success" ? <FaCheck /> : <TbCancel />}
        severity={snackbar.severity}
      />

      <AddMethodModal
        isOpen={addModalOpen}
        onClose={closeAddModal}
        onAddManually={chooseAddManually}
        onUploadExcel={chooseUploadExcel}
        showManual={isAdmin}
      />

      <ItemDetailsModal
        isOpen={itemDetailsModalOpen}
        onClose={() => setItemDetailsModalOpen(false)}
        psgItems={psgItems}
        selectedSchool={school}
        donationDrives={donationDrives}
        onSubmit={handleAddNewItemSubmit}
        submitting={itemDetailsSubmitting}
        isAdmin={isAdmin}
        schools={[]}
        selectedItemType={null}
        selectedColor={null}
        onSchoolChange={() => { }}
      />

      <UploadCSVModal
        isOpen={uploadCSVModalOpen}
        onClose={() => setUploadCSVModalOpen(false)}
        selectedSchool={school}
      />
    </Box>
  );
}
