"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getRoleFromSession } from "@/utils/auth";

// mui
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
} from "@mui/material";

// icon
import { FaPlus, FaCheck } from "react-icons/fa6";
import { TbCancel } from "react-icons/tb";

// components
import InventoryOverviewCard from "@/components/InventoryOverviewCard";
import InventoryTable from "@/components/InventoryTable";
import SchoolCard from "@/components/SchoolCard";
import ItemTypeCard from "@/components/ItemTypeCard";
import ColorCard from "@/components/ColorCard";
import ItemDetailsModal from "@/components/ItemDetailsModal";
import AddMethodModal from "@/components/AddMethodModal";
import InventoryBalancePreviewModal from "@/components/InventoryBalancePreviewModal";
import UploadCSVModal from "@/components/UploadCSVModal";
import SnackbarAlert from "@/components/SnackbarAlert";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import CustomButton from "@/components/ui/CustomButton";
import CustomErrorButton from "@/components/ui/CustomErrorButton";
import InventoryBreakdownCard from "@/components/InventoryBreakdownCard";
import InventorySection from "@/components/InventorySection";

const CARDS_PER_PAGE = 12;

function getSchoolMainLevelValue(school) {
  if (!school) return "";

  const rawValue =
    school.mainLevel ||
    school.mainlevelCode ||
    school.mainlevel_code ||
    school.main_level ||
    "";

  if (typeof rawValue === "string") {
    return rawValue.trim();
  }

  if (typeof rawValue === "object") {
    return (
      rawValue.code ||
      rawValue.mainlevelCode ||
      rawValue.mainlevel_code ||
      rawValue.label ||
      rawValue.name ||
      ""
    );
  }

  return String(rawValue || "").trim();
}

export default function InventoryPage() {
  const [role, setRole] = useState("UNKNOWN");
  const isAdmin = role === "TCC_ADMIN";

  const [schools, setSchools] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [colors, setColors] = useState([]);

  // base (unfiltered) data for items view, so breakdown stays stable
  const [baseInventoryData, setBaseInventoryData] = useState([]);

  // inventoryData = filtered list used for rendering items
  const [inventoryData, setInventoryData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [addMethod, setAddMethod] = useState(null);

  // For PSG/SchoolStaff, we will start at itemTypes (no schools view)
  const [viewLevel, setViewLevel] = useState("schools");
  const [selectedSchool, setSelectedSchool] = useState(null);

  /**
   * IMPORTANT CHANGE (same as admin):
   * selectedItemType now represents a "category-grouped item type card"
   * (one card per category), not a raw itemTypeId.
   * selectedItemType.id === categoryId
   */
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [itemDetailsModalOpen, setItemDetailsModalOpen] = useState(false);
  const [uploadCSVModalOpen, setUploadCSVModalOpen] = useState(false);

  // Admin-only: mainlevel_code filter for schools view
  const [mainlevelFilter, setMainlevelFilter] = useState("All");

  // donation flow states
  const [psgItems, setPsgItems] = useState([]);
  const [donationDrives, setDonationDrives] = useState([]);
  const [itemDetailsSubmitting, setItemDetailsSubmitting] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [filters, setFilters] = useState({
    storedAt: "",
    itemStatus: "",
    schoolId: "",
  });

  const pageTitle = viewLevel === "schools" ? "Detailed Inventory by School" : "Inventory by Items";
  const pageSubtitle = viewLevel === "schools" ? "Browse inventory across all schools" : `Browse inventory items for ${selectedSchool?.schoolName || "your school"}`;

  const [search, setSearch] = useState("");

  // Preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  // Pagination state for card views
  const [schoolsPage, setSchoolsPage] = useState(1);
  const [itemTypesPage, setItemTypesPage] = useState(1);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const authUrl = process.env.NEXT_PUBLIC_AUTH_API_URL;
  const analyticsUrl = process.env.NEXT_PUBLIC_API_URL;

  // single-color shortcut flag (used for breadcrumb behavior)
  const isSingleColor = useMemo(() => (colors || []).length === 1, [colors]);

  // Determine role once on mount (client-only)
  useEffect(() => {
    setRole(getRoleFromSession());
  }, []);

  const openPreview = useCallback((item) => {
    setPreviewItem(item);
    setPreviewOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewOpen(false);
    setPreviewItem(null);
  }, []);

  const shouldIgnorePreviewClick = (e) => {
    return !!e?.target?.closest?.(
      "[data-ignore-preview],a,input,select,textarea,label",
    );
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  /**
   * For PSG/SchoolStaff:
   * - Call /api/users/me to ensure user profile exists (and names)
   * - Then call inventory/balances without schoolId. Backend will scope to user school.
   * - Deduce the school object from returned data and set selectedSchool.
   * - Jump viewLevel to itemTypes.
   */
  const initNonAdminSchool = useCallback(async () => {
    try {
      const accessToken = sessionStorage.getItem("accessToken");
      if (!accessToken) return;

      // 1) Get profile (your "Get Profile" flow)
      try {
        await fetch(`${authUrl}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } catch {
        // ignore
      }

      // 2) Fetch balances (backend enforces school)
      const response = await fetch(`${apiUrl}/api/inventory/balances`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to fetch inventory data");
      }

      const result = await response.json();
      const items = result.data || [];

      // Deduce school from first itemType.school
      const school = items?.[0]?.itemType?.school || null;
      console.log(school);

      if (!school?.id) {
        setSelectedSchool(null);
        setViewLevel("itemTypes");
        return;
      }

      // Preserve logoUrl (and any other future fields) for UI
      setSelectedSchool({
        id: school.id,
        schoolName: school.schoolName,
        logoUrl: school.logoUrl,
      });
      // Notify Header (and any other listeners) of the active school
      window.dispatchEvent(
        new CustomEvent("school-changed", {
          detail: { logoUrl: school.logoUrl, schoolName: school.schoolName },
        }),
      );
      setViewLevel("itemTypes");
      setError(null);
    } catch (err) {
      console.error("Error initializing school scope:", err);
      setError(err?.message || "Failed to initialize school scope");
    }
  }, [apiUrl, authUrl]);

  const fetchSchools = useCallback(async () => {
    try {
      setLoading(true);
      const accessToken = sessionStorage.getItem("accessToken");

      const response = await fetch(`${apiUrl}/api/inventory/balances`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch inventory data");

      const result = await response.json();
      const items = result.data || [];

      const schoolMap = new Map();
      items.forEach((item) => {
        if (item.itemType?.school) {
          const school = item.itemType.school;
          if (!schoolMap.has(school.id)) {
            schoolMap.set(school.id, {
              ...school,
              itemTypeCount: new Set(),
              totalQuantity: 0,
            });
          }
          const schoolData = schoolMap.get(school.id);
          schoolData.itemTypeCount.add(item.itemTypeId);
          schoolData.totalQuantity += item.quantity;
        }
      });

      const schoolsArray = Array.from(schoolMap.values()).map((school) => ({
        ...school,
        itemTypeCount: school.itemTypeCount.size,
      }));

      if (isAdmin && analyticsUrl && accessToken && schoolsArray.length > 0) {
        const profiles = await Promise.allSettled(
          schoolsArray.map(async (school) => {
            const profileResponse = await fetch(
              `${analyticsUrl}/api/school/${school.id}/profile`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              },
            );

            if (!profileResponse.ok) {
              throw new Error(`Failed to fetch school profile ${school.id}`);
            }

            const profileResult = await profileResponse.json();
            const profile = profileResult?.data ?? profileResult;

            return {
              id: school.id,
              mainlevelCode:
                profile?.mainlevelCode ??
                profile?.mainlevel_code ??
                profile?.mainLevel ??
                "",
            };
          }),
        );

        const profileMap = new Map(
          profiles
            .filter((result) => result.status === "fulfilled")
            .map((result) => [result.value.id, result.value.mainlevelCode]),
        );

        setSchools(
          schoolsArray.map((school) => {
            const mainlevelCode = profileMap.get(school.id) || "";
            return {
              ...school,
              mainlevelCode,
              mainLevel: mainlevelCode,
            };
          }),
        );
      } else {
        setSchools(schoolsArray);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching schools:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, analyticsUrl, isAdmin]);

  /**
   * Group into 1 card per CATEGORY, and attach all unique colors to that card.
   */
  const fetchItemTypes = useCallback(
    async (schoolId) => {
      try {
        setLoading(true);

        const response = await fetch(
          `${apiUrl}/api/inventory/balances?schoolId=${schoolId}`,
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
            },
          },
        );
        if (!response.ok) throw new Error("Failed to fetch item types");

        const result = await response.json();
        const items = result.data || [];

        const categoryMap = new Map();

        items.forEach((row) => {
          const category = row?.itemType?.category;
          const categoryId = category?.id ?? row?.itemType?.categoryId;
          if (!categoryId) return;

          if (!categoryMap.has(categoryId)) {
            categoryMap.set(categoryId, {
              id: categoryId,
              category,

              schoolStock: 0,
              psgActivities: 0,
              forRepurposing: 0,
              recyclingDisposal : 0,
              items: [],
              itemTypeIds: new Set(),
              colors: new Map(),
            });
          }

          const entry = categoryMap.get(categoryId);
         

          if (row.itemStatus === "GeneralOffice" && row.storedAt === "School")
            entry.schoolStock += row.quantity;
          if (row.itemStatus === "ForSale" && row.storedAt === "School")
            entry.psgActivities += row.quantity;
          if (row.itemStatus === "ForRepurpose" && row.storedAt === "TCC")
            entry.forRepurposing += row.quantity;
          if (row.itemStatus === "Disposed" && row.storedAt === "Exited")
            entry.recyclingDisposal  += row.quantity;

          entry.items.push(row);

          if (row.itemTypeId) entry.itemTypeIds.add(row.itemTypeId);

          const colorName = row?.itemType?.primaryColour?.colourName;
          const colorHex =
            row?.itemType?.primaryColour?.hexcode ||
            row?.itemType?.primaryColour?.hexCode ||
            row?.itemType?.primaryColour?.colourHex ||
            row?.itemType?.primaryColour?.hex;

          if (colorName && !entry.colors.has(colorName)) {
            entry.colors.set(colorName, { colorName, colorHex });
          }
        });

        const grouped = Array.from(categoryMap.values()).map((g) => ({
          ...g,
          totalQuantity: g.schoolStock + g.psgActivities + g.forRepurposing + g.recyclingDisposal ,
          colorOptions: Array.from(g.colors.values()),
          colorCount: g.colors.size,
          imageUrl: g.items[0]?.itemType?.imageUrl || null,
        }));

        setItemTypes(grouped);
        setError(null);
      } catch (err) {
        console.error("Error fetching item types:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [apiUrl],
  );

  /**
   * fetchColors filters rows by CATEGORY (selectedItemType.id)
   */
  const fetchColors = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${apiUrl}/api/inventory/balances?schoolId=${selectedSchool.id}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch colors");

      const result = await response.json();
      const items = result.data || [];

      const itemsOfType = items.filter((row) => {
        const categoryId =
          row?.itemType?.category?.id ?? row?.itemType?.categoryId;
        return String(categoryId) === String(selectedItemType.id);
      });

      const colorMap = new Map();
      itemsOfType.forEach((item) => {
        const colorName = item.itemType?.primaryColour?.colourName;
        if (colorName) {
          if (!colorMap.has(colorName)) {
            colorMap.set(colorName, {
              colorName,
              colorHex:
                item.itemType?.primaryColour?.hexcode ||
                item.itemType?.primaryColour?.hexCode ||
                item.itemType?.primaryColour?.colourHex ||
                item.itemType?.primaryColour?.hex ||
                null,
              totalQuantity: 0,
              items: [],
            });
          }
          const colorData = colorMap.get(colorName);
          colorData.totalQuantity += item.quantity;
          colorData.items.push(item);
        }
      });

      const colorsArr = Array.from(colorMap.values());
      setColors(colorsArr);
      setError(null);

      // if only 1 color, skip colors view and go straight to items view
      if (colorsArr.length === 1) {
        const onlyColor = colorsArr[0];
        setSelectedColor(onlyColor);
        setSearch("");
        setViewLevel("items");
      }
    } catch (err) {
      console.error("Error fetching colors:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, selectedSchool, selectedItemType]);

  /**
   * constrain base inventory by CATEGORY (selectedItemType.id), not itemTypeId
   */
  const fetchInventoryData = useCallback(async () => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams();
      if (selectedSchool?.id) queryParams.append("schoolId", selectedSchool.id);

      const response = await fetch(
        `${apiUrl}/api/inventory/balances?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch inventory data");

      const result = await response.json();
      const items = result.data || [];

      let baseItems = items;

      if (selectedItemType?.id) {
        baseItems = baseItems.filter((row) => {
          const categoryId =
            row?.itemType?.category?.id ?? row?.itemType?.categoryId;
          return String(categoryId) === String(selectedItemType.id);
        });
      }

      if (selectedColor?.colorName) {
        baseItems = baseItems.filter(
          (item) =>
            item.itemType?.primaryColour?.colourName ===
            selectedColor.colorName,
        );
      }
      console.log("baseItems genders:", [...new Set(baseItems.map(r => r.itemType?.gender))]);
      setBaseInventoryData(baseItems);
      setError(null);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, selectedSchool, selectedItemType, selectedColor]);

  // apply filters locally to baseInventoryData for list rendering
  const filteredInventoryData = useMemo(() => {
    let rows = baseInventoryData;

    if (filters.storedAt)
      rows = rows.filter((r) => r.storedAt === filters.storedAt);
    if (filters.itemStatus)
      rows = rows.filter((r) => r.itemStatus === filters.itemStatus);

    return rows;
  }, [baseInventoryData, filters.storedAt, filters.itemStatus]);

  useEffect(() => {
    setInventoryData(filteredInventoryData);
  }, [filteredInventoryData]);

  /**
   * Fetches preset items:
   * - TCC_ADMIN: uses /api/item-type/admin/items?schoolId=...
   * - PSG/SchoolStaff: uses /api/item-type/psg/items
   */
  const fetchPresetData = useCallback(
    async (schoolId) => {
      try {
        const url = isAdmin
          ? `${apiUrl}/api/item-type/admin/items?schoolId=${schoolId}`
          : `${apiUrl}/api/item-type/psg/items`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
          },
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to fetch item type data");
        }

        const result = await response.json();
        setPsgItems(result.data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching preset data:", err);
        setError(err.message);
      }
    },
    [apiUrl, isAdmin],
  );

  const fetchDonationDrivesForSchool = useCallback(
    async (schoolId) => {
      if (!schoolId) return;
      try {
        const response = await fetch(
          `${apiUrl}/api/donation-drive/school/${schoolId}`,
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
            },
          },
        );
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to fetch donation drives");
        }
        const result = await response.json();
        setDonationDrives(result.data || result || []);
      } catch (err) {
        console.error("Error fetching donation drives:", err);
      }
    },
    [apiUrl],
  );

  const handleAddNewItemSubmit = useCallback(
    async (formData) => {
      setItemDetailsSubmitting(true);
      try {
        const response = await fetch(`${apiUrl}/api/donation-drive/donate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
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

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          setSnackbar({
            open: true,
            message: errData.message || "Failed to add new item",
            severity: "error",
          });
          throw new Error(errData.message || "Failed to add new item");
        }

        setSnackbar({
          open: true,
          message: "Items added successfully",
          severity: "success",
        });

        setItemDetailsModalOpen(false);

        if (selectedSchool?.id) {
          await fetchPresetData(selectedSchool.id);
        }
        if (viewLevel === "items") {
          await fetchInventoryData();
        }
      } catch (err) {
        setSnackbar({
          open: true,
          message: err?.message || "Failed to add new item",
          severity: "error",
        });
      } finally {
        setItemDetailsSubmitting(false);
      }
    },
    [apiUrl, selectedSchool, viewLevel, fetchPresetData, fetchInventoryData],
  );

  // MAIN loader flow
  useEffect(() => {
    if (role === "UNKNOWN") return; // wait for role to be determined

    if (!isAdmin && viewLevel === "schools") {
      // Non-admin: auto-scope to their school, skip schools listing
      initNonAdminSchool().finally(() => setLoading(false));
      return;
    }

    if (viewLevel === "schools") {
      fetchSchools();
    } else if (viewLevel === "itemTypes") {
      if (selectedSchool?.id) fetchItemTypes(selectedSchool.id);
      else setLoading(false);
    } else if (viewLevel === "colors") {
      if (selectedItemType?.id && selectedSchool?.id) fetchColors();
      else setLoading(false);
    } else if (viewLevel === "items") {
      if (
        selectedColor?.colorName &&
        selectedItemType?.id &&
        selectedSchool?.id
      )
        fetchInventoryData();
      else setLoading(false);
    }
  }, [
    role,
    isAdmin,
    viewLevel,
    selectedSchool,
    selectedItemType,
    selectedColor,
    fetchSchools,
    fetchItemTypes,
    fetchColors,
    fetchInventoryData,
    initNonAdminSchool,
  ]);

  // When a school is selected, fetch preset items + donation drives
  useEffect(() => {
    if (!selectedSchool?.id || role === "UNKNOWN") return;
    (async () => {
      try {
        await Promise.all([
          fetchPresetData(selectedSchool.id),
          fetchDonationDrivesForSchool(selectedSchool.id),
        ]);
      } catch (err) {
        console.error(err);
        setSnackbar({
          open: true,
          message: err?.message || "Failed to load preset data",
          severity: "error",
        });
      }
    })();
  }, [selectedSchool, role, fetchPresetData, fetchDonationDrivesForSchool]);

  // Navigation handlers
  const handleSchoolClick = (school) => {
    setSelectedSchool(school);
    setSelectedItemType(null);
    setSelectedColor(null);
    setSearch("");
    setViewLevel("itemTypes");
  };

  const handleBackToSchools = () => {
    if (!isAdmin) return;
    setSelectedSchool(null);
    setSelectedItemType(null);
    setSelectedColor(null);
    setSearch("");
    setViewLevel("schools");
  };

  const handleBackToItemTypes = () => {
    setSelectedItemType(null);
    setSelectedColor(null);
    setColors([]);
    setBaseInventoryData([]);
    setSearch("");
    setViewLevel("itemTypes");
  };

  const handleBackToColors = () => {
    setSelectedColor(null);
    setBaseInventoryData([]);
    setSearch("");
    setViewLevel("colors");
  };

  const handleModalSchoolChange = useCallback(
    async (schoolId) => {
      if (!schoolId) return;
      await Promise.all([
        fetchPresetData(schoolId),
        fetchDonationDrivesForSchool(schoolId),
      ]);
    },
    [fetchPresetData, fetchDonationDrivesForSchool],
  );

  const closeAddModal = () => {
    setAddModalOpen(false);
    setAddMethod(null);
  };

  const chooseAddManually = () => {
    setAddMethod("manual");
    setAddModalOpen(false);
    setItemDetailsModalOpen(true);
  };

  const chooseUploadExcel = () => {
    setAddMethod("upload");
    setAddModalOpen(false);
    setUploadCSVModalOpen(true);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      storedAt: "",
      itemStatus: "",
      schoolId: "",
    });
  };

  const canOpenAdd =
    viewLevel !== "schools" &&
    ((isAdmin && !!selectedSchool?.id) ||
      (!isAdmin && !!selectedSchool?.id && psgItems.length > 0));

  // Admin-only: mainlevel options
  const mainlevelOptions = useMemo(() => {
    const values = new Set();
    (schools || []).forEach((s) => {
      const code = getSchoolMainLevelValue(s);
      if (code) values.add(code);
    });
    return Array.from(values).sort((a, b) =>
      String(a).localeCompare(String(b)),
    );
  }, [schools]);

  const filteredSchools = useMemo(() => {
    if (viewLevel !== "schools") return schools;

    const q = search.trim().toLowerCase();

    const filtered = (schools || []).filter((s) => {
      const code = getSchoolMainLevelValue(s);
      const matchesSearch =
        !q ||
        String(s?.schoolName || "")
          .toLowerCase()
          .includes(q);
      const matchesMainlevel =
        mainlevelFilter === "All" ||
        String(code || "") === String(mainlevelFilter);
      return matchesSearch && matchesMainlevel;
    });

    return filtered.sort((a, b) =>
      String(a?.schoolName || "").localeCompare(String(b?.schoolName || "")),
    );
  }, [schools, search, viewLevel, mainlevelFilter]);

  const filteredItemTypes = useMemo(() => {
    if (viewLevel !== "itemTypes") return itemTypes;
    const q = search.trim().toLowerCase();
    if (!q) return itemTypes;
    return itemTypes.filter((t) =>
      String(t?.category?.categoryName || "")
        .toLowerCase()
        .includes(q),
    );
  }, [itemTypes, search, viewLevel]);

  const filteredColors = useMemo(() => {
    if (viewLevel !== "colors") return colors;
    const q = search.trim().toLowerCase();
    if (!q) return colors;
    return colors.filter((c) =>
      String(c?.colorName || "")
        .toLowerCase()
        .includes(q),
    );
  }, [colors, search, viewLevel]);

  // Reset card pages when filters/search change
  useEffect(() => {
    setSchoolsPage(1);
  }, [search, mainlevelFilter]);
  useEffect(() => {
    setItemTypesPage(1);
  }, [search, viewLevel]);

  const schoolsTotalPages = Math.max(
    1,
    Math.ceil(filteredSchools.length / CARDS_PER_PAGE),
  );
  const paginatedSchools = filteredSchools.slice(
    (schoolsPage - 1) * CARDS_PER_PAGE,
    schoolsPage * CARDS_PER_PAGE,
  );

  const itemTypesTotalPages = Math.max(
    1,
    Math.ceil(filteredItemTypes.length / CARDS_PER_PAGE),
  );
  const paginatedItemTypes = filteredItemTypes.slice(
    (itemTypesPage - 1) * CARDS_PER_PAGE,
    itemTypesPage * CARDS_PER_PAGE,
  );

  // UPDATED: add "All • Disposed" and keep same size breakdown headings
  const breakdownBySize = useMemo(() => {
    const map = new Map();

    for (const row of baseInventoryData) {
      const sizeName = row.sizeOption?.sizeName || "Unknown";
      if (!map.has(sizeName)) {
        map.set(sizeName, {
          sizeName,
          total: 0,
          schoolGeneralOffice: 0,
          schoolForSale: 0,
          sponsorForSale: 0,
          schoolForRepurpose: 0,
          sponsorForRepurpose: 0,
          allSold: 0,
          allDisposed: 0,
          allRepurposed: 0,
        });
      }

      const entry = map.get(sizeName);
      entry.total += row.quantity;

      if (row.storedAt === "School" && row.itemStatus === "ForSale")
        entry.schoolForSale += row.quantity;
      if (row.storedAt === "TCC" && row.itemStatus === "ForSale")
        entry.sponsorForSale += row.quantity;
      if (row.storedAt === "School" && row.itemStatus === "ForRepurpose")
        entry.schoolForRepurpose += row.quantity;
      if (row.storedAt === "TCC" && row.itemStatus === "ForRepurpose")
        entry.sponsorForRepurpose += row.quantity;
      if (row.storedAt === "Exited" && row.itemStatus === "Sold")
        entry.allSold += row.quantity;

      if (row.itemStatus === "Disposed") entry.allDisposed += row.quantity;
      if (row.itemStatus === "Repurposed") entry.allRepurposed += row.quantity;
    }

    return Array.from(map.values());
  }, [baseInventoryData]);

  const searchPlaceholder = useMemo(() => {
    if (viewLevel === "schools") return "Search schools...";
    if (viewLevel === "itemTypes") return "Search item types...";
    if (viewLevel === "colors") return "Search colors...";
    return "";
  }, [viewLevel]);

  if (loading) {
    return <LoadingSpinner message="Loading items..." />;
  }

  if (error) {
    return (
      <CustomErrorButton
        title="Error Loading Inventory"
        message={error}
        onRetry={() => {
          setError(null);
          setLoading(true);
          if (!isAdmin) initNonAdminSchool().finally(() => setLoading(false));
          else fetchSchools();
        }}
      />
    );
  }

  return (
    <Box sx={{ p: 4 }}>
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
            {pageTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {pageSubtitle}
          </Typography>
        </Box>

        {canOpenAdd && (
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <CustomButton
              onClick={() => setAddModalOpen(true)}
              disabled={!canOpenAdd}
              icon={<FaPlus />}
              className="w-full sm:w-auto"
            >
              Add New Item
            </CustomButton>
          </Box>
        )}

      </Box>

      <div className="flex justify-between items-center">
        {/* Breadcrumb Navigation */}
        <div className="mb-4 overflow-x-auto">
          <nav className="flex items-center gap-2 text-sm whitespace-nowrap">
            {/* Root breadcrumb: admin sees "Schools", non-admin sees their school name */}
            {!isAdmin ? (
              <button
                type="button"
                onClick={handleBackToItemTypes}
                className={`cursor-pointer ${
                  viewLevel === "itemTypes"
                    ? "text-gray-900 font-semibold"
                    : "text-[var(--color-main)] hover:underline"
                }`}
              >
                {selectedSchool?.schoolName || "My School"}
              </button>
            ) : (
              <button
                onClick={handleBackToSchools}
                className={`cursor-pointer ${
                  viewLevel === "schools"
                    ? "text-gray-900 font-semibold"
                    : "text-[var(--color-main)] hover:underline"
                }`}
              >
                Schools
              </button>
            )}

            {/* Show selected school in breadcrumb only for admin, when past schools view */}
            {isAdmin && viewLevel !== "schools" && (
              <>
                <span className="text-gray-400">/</span>
                <button
                  onClick={handleBackToItemTypes}
                  className={`cursor-pointer ${
                    viewLevel === "itemTypes"
                      ? "text-gray-900 font-semibold"
                      : "text-[var(--color-main)] hover:underline"
                  }`}
                >
                  {selectedSchool?.schoolName}
                </button>
              </>
            )}

            {(viewLevel === "colors" || viewLevel === "items") && (
              <>
                <span className="text-gray-400">/</span>

                {viewLevel === "items" && isSingleColor ? (
                  <span className="text-gray-900 font-semibold">
                    {`${selectedColor?.colorName || ""} ${selectedItemType?.category?.categoryName || ""}`.trim()}
                  </span>
                ) : (
                  <button
                    onClick={handleBackToColors}
                    className={`cursor-pointer ${
                      viewLevel === "colors"
                        ? "text-gray-900 font-semibold"
                        : "text-[var(--color-main)] hover:underline"
                    }`}
                  >
                    {selectedItemType?.category?.categoryName}
                  </button>
                )}
              </>
            )}

            {viewLevel === "items" && !isSingleColor && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-semibold">
                  {selectedColor?.colorName}
                </span>
              </>
            )}
          </nav>
        </div>

        {/* Search / filter row — schools / itemTypes / colors */}
        {(viewLevel === "schools" ||
          viewLevel === "itemTypes" ||
          viewLevel === "colors") && (
          <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:items-center">
            {/* Admin-only: mainlevel filter at schools view */}
            {isAdmin && viewLevel === "schools" && (
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel id="mainlevel-label">Main Level</InputLabel>
                <Select
                  labelId="mainlevel-label"
                  label="Main Level"
                  value={mainlevelFilter}
                  onChange={(e) => setMainlevelFilter(e.target.value)}
                >
                  <MenuItem value="All">
                    <em>All</em>
                  </MenuItem>
                  {mainlevelOptions.map((v) => (
                    <MenuItem key={v} value={v}>
                      {v}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <div className="w-full sm:w-[320px]">
              <TextField
                size="small"
                fullWidth
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
              />
            </div>
          </div>
        )}
      </div>
      {viewLevel === "items" && (
        <>
          {/* Overview card – shared metadata for all items in this view */}
          {/* <InventoryOverviewCard
            items={baseInventoryData}
            selectedItemType={selectedItemType}
            selectedColor={selectedColor}
            isAdmin={isAdmin}
          /> */}

          {/* DataGrid overview table – commented out
          {baseInventoryData.length > 0 && (
            <Paper sx={{ mb: 3, overflowX: 'auto' }}>
              <div style={{ width: '100%' }}>
                <DataGrid
                  autoHeight
                  disableRowSelectionOnClick
                  hideFooterSelectedRowCount
                  rows={breakdownBySize.map((r, idx) => ({
                    id: r.sizeName ?? idx,
                    ...r,
                  }))}
                  columns={[
                    { field: 'sizeName', headerName: 'Size', flex: 1, minWidth: 80 },
                    { field: 'total', headerName: 'Total', type: 'number', width: 80 },
                    { field: 'schoolGeneralOffice', headerName: 'School • General Office', 'number', width: 160 },
                    { field: 'schoolForSale', headerName: 'School • For Sale', type: 'number', width: 160 },
                    { field: 'sponsorForSale', headerName: 'Sponsor • For Sale', type: 'number', width: 170 },
                    { field: 'schoolForRepurpose', headerName: 'School • For Repurpose', type: 'number', width: 190 },
                    { field: 'sponsorForRepurpose', headerName: 'Sponsor • For Repurpose', type: 'number', width: 200 },
                    { field: 'allSold', headerName: 'All • Sold', type: 'number', width: 120 },
                    { field: 'allRepurposed', headerName: 'All • Repurposed', type: 'number', width: 150 },
                    { field: 'allDisposed', headerName: 'All • Disposed', type: 'number', width: 140 },
                  ]}
                  initialState={{
                    pagination: {
                      paginationModel: { page: 0, pageSize: 5 },
                    },
                  }}
                  pageSizeOptions={[5, 10, 20, 50]}
                />
              </div>
            </Paper>
          )}
          */}
        </>
      )}

      {/* Schools view: admin only */}
      {viewLevel === "schools" && isAdmin && filteredSchools.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {paginatedSchools.map((school) => (
              <SchoolCard
                key={school.id}
                school={school}
                onClick={() => handleSchoolClick(school)}
              />
            ))}
          </div>
          <Pagination
            currentPage={schoolsPage}
            totalPages={schoolsTotalPages}
            onPageChange={setSchoolsPage}
          />
        </>
      )}

      {viewLevel === "itemTypes" && filteredItemTypes.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {paginatedItemTypes.map((itemType, index) => (
              <ItemTypeCard
                key={itemType.id || index}
                itemType={itemType}
                isAdmin={isAdmin}
                onClick={() => {
                  setSelectedItemType(itemType);
                  setSelectedColor(null);
                  setColors([]);
                  setBaseInventoryData([]);
                  setSearch("");
                  setViewLevel("colors");
                }}
              />
            ))}
          </div>
          <Pagination
            currentPage={itemTypesPage}
            totalPages={itemTypesTotalPages}
            onPageChange={setItemTypesPage}
          />
        </>
      )}

      {viewLevel === "colors" && filteredColors.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredColors.map((color, index) => (
            <ColorCard
              key={index}
              color={color}
              onClick={() => {
                setSelectedColor(color);
                setBaseInventoryData([]);
                setSearch("");
                setViewLevel("items");
              }}
            />
          ))}
        </div>
      )}

      {viewLevel === "items" && (
        <>
          <InventoryOverviewCard
            items={baseInventoryData}
            selectedItemType={selectedItemType}
            selectedColor={selectedColor}
          />
          <InventoryBreakdownCard
            items={baseInventoryData}
            isAdmin={isAdmin}
          />


          <InventorySection
            title="Available for School Stock"
            items={baseInventoryData.filter((r) => r.itemStatus === "GeneralOffice" && r.storedAt === "School")}
            onRowClick={(item) => openPreview(item)}
          />

          <InventorySection
            title="Reserved for PSG Activities"
            items={baseInventoryData.filter((r) => r.itemStatus === "ForSale" && r.storedAt === "School")}
            onRowClick={(item) => openPreview(item)}
          />

          {isAdmin && (
            <>
              <InventorySection
                title="For Repurposing"
                items={baseInventoryData.filter((r) => r.itemStatus === "ForRepurpose" && r.storedAt === "TCC")}
                onRowClick={(item) => openPreview(item)}
              />
              <InventorySection
                title="For Recycling/Disposal"
                items={baseInventoryData.filter((r) => r.itemStatus === "Disposed" && r.storedAt === "Exited")}
                onRowClick={(item) => openPreview(item)}
              />
            </>
          )}
        </>
      )}

      <SnackbarAlert
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbar.message}
        icon={snackbar.severity === "success" ? <FaCheck /> : <TbCancel />}
        severity={snackbar.severity}
      />

      <AddMethodModal
        isOpen={addModalOpen}
        onClose={closeAddModal}
        onAddManually={chooseAddManually}
        onUploadExcel={chooseUploadExcel}
        showManual={isAdmin} // admin can add manually; PSG/staff use upload only
      />

      <ItemDetailsModal
        isOpen={itemDetailsModalOpen}
        onClose={() => setItemDetailsModalOpen(false)}
        psgItems={psgItems}
        selectedSchool={selectedSchool}
        donationDrives={donationDrives}
        onSubmit={handleAddNewItemSubmit}
        submitting={itemDetailsSubmitting}
        isAdmin={isAdmin}
        schools={schools}
        selectedItemType={selectedItemType}
        selectedColor={selectedColor}
        onSchoolChange={handleModalSchoolChange}
      />

      <InventoryBalancePreviewModal
        isOpen={previewOpen}
        onClose={closePreview}
        item={previewItem}
      />

      <UploadCSVModal
        isOpen={uploadCSVModalOpen}
        onClose={() => setUploadCSVModalOpen(false)}
        selectedSchool={selectedSchool}
      />
    </Box>
  );
}
