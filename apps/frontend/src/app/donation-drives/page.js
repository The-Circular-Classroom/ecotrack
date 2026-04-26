"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getRoleFromSession } from "@/utils/auth";

// mui
import { Backdrop, Chip, Box, Typography, Alert } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import DownloadIcon from "@mui/icons-material/Download";

// icon
import { FaPlus, FaCheck } from "react-icons/fa6";
import { FiEdit3, FiTrash2 } from "react-icons/fi";
import { TbCancel } from "react-icons/tb";
import { IoClose } from "react-icons/io5";

// components
import SnackbarAlert from "@/components/SnackbarAlert";
import DonationDriveFormModal from "@/components/DonationDriveFormModal";
import DownloadCSVTemplateModal from "@/components/DownloadCSVTemplateModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import CustomButton from "@/components/ui/CustomButton";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import CustomErrorButton from "@/components/ui/CustomErrorButton";

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

// ── Column definitions ───────────────────────────────────────────────────────
const buildColumns = (isAdmin, onEdit, onDelete) => {
  const cols = [
    {
      field: "driveName",
      headerName: "Donation Drive Name",
      flex: 1,
      minWidth: 200,
      renderCell: ({ value }) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography
            variant="body2"
            sx={{ color: "#111827", fontWeight: 500 }}
          >
            {value || "-"}
          </Typography>
        </Box>
      ),
    },

    // ── Admin-only: School Name ──────────────────────────────────────────────
    ...(isAdmin
      ? [
          {
            field: "school",
            headerName: "School",
            flex: 1,
            minWidth: 160,
            renderCell: ({ row }) => (
              <Box
                sx={{ display: "flex", alignItems: "center", height: "100%" }}
              >
                <Typography variant="body2" sx={{ color: "#111827" }}>
                  {row.school?.schoolName
                    ? row.school.schoolName
                        .toLowerCase()
                        .replace(/\b\w/g, (c) => c.toUpperCase())
                    : "-"}
                </Typography>
              </Box>
            ),
          },
        ]
      : []),
    {
      field: "startDate",
      headerName: "Start Date",
      width: 120,
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
          </Box>
        );
      },
    },
    {
      field: "endDate",
      headerName: "End Date",
      width: 120,
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
          </Box>
        );
      },
    },
    {
      field: "location",
      headerName: "Location",
      flex: 1,
      minWidth: 160,
      renderCell: ({ value }) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2" color="text.secondary">
            {value || "-"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      valueGetter: (value, row) => {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        const endStr = row.endDate?.slice(0, 10); // "YYYY-MM-DD"

        return endStr < todayStr ? "inactive" : "active";
      },
      renderCell: ({ value }) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <StatusChip status={value} />
        </Box>
      ),
    },
    {
      field: "action",
      headerName: "Action",
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            height: "100%",
            gap: 0.5,
          }}
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

  return cols;
};

// ── Main component ───────────────────────────────────────────────────────────
export default function DonationDrivePage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [donationDrives, setDonationDrives] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [deleteRow, setDeleteRow] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [schoolId, setSchoolId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const token = () => sessionStorage.getItem("accessToken");
  
  // Determine role and resolve school ID / user ID from /api/users/me
  useEffect(() => {
    const role = getRoleFromSession();
    const accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) {
      setError("You must be logged in to view this page.");
      setProfileLoading(false);
      router.push("/");
      return;
    }
    const admin = role === "TCC_ADMIN";
    if (admin) setIsAdmin(true);

    const apiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL;

    fetch(`${apiUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json?.userId) setUserId(json.userId);
        if (!admin) {
          if (json?.schoolId) {
            setSchoolId(json.schoolId);
          } else {
            setError("Your account is not linked to a school.");
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch user profile:", err);
        if (!admin) setError("Failed to retrieve school information.");
      })
      .finally(() => setProfileLoading(false));
  }, [router]);

  useEffect(() => {
    if (profileLoading) return;
    fetchAllDonationDrives();
  }, [profileLoading, isAdmin, schoolId]);

  const fetchAllDonationDrives = async () => {
    try {
      setLoading(true);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      // Admins fetch all drives; non-admins fetch only their school's
      const url = isAdmin
        ? `${apiUrl}/api/donation-drive`
        : `${apiUrl}/api/donation-drive/school/${schoolId}`;

      if (!isAdmin && !schoolId) {
        setError("No school linked to your account.");
        return;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch donation drives");

      const result = await response.json();

      const sortedData = (result.data || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );

      setDonationDrives(sortedData);
      setError(null);
    } catch (err) {
      console.error("Error fetching donation drives:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row) => {
    setEditRow(row);
    setModalOpen(true);
  };

  const handleDelete = (row) => setDeleteRow(row);

  const handleDeleteConfirm = async () => {
    if (!deleteRow) return;
    setDeleteLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${apiUrl}/api/donation-drive/${deleteRow.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
          },
        },
      );

      const result = await response.json();
      setSnackbar({
        open: true,
        message: response.ok
          ? "Donation drive deleted successfully"
          : result.message || "Failed to delete donation drive",
        severity: response.ok ? "success" : "error",
      });

      if (response.ok) fetchAllDonationDrives();
    } catch (err) {
      console.error("Error deleting donation drive:", err);
      setSnackbar({
        open: true,
        message: "Something went wrong",
        severity: "error",
      });
    } finally {
      setDeleteLoading(false);
      setDeleteRow(null);
    }
  };

  const handleClose = (result) => {
    setModalOpen(false);
    setEditRow(null);
    if (result) {
      setSnackbar({
        open: true,
        message: result.message,
        severity: result.success ? "success" : "error",
      });
      fetchAllDonationDrives();
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const columns = useMemo(
    () => buildColumns(isAdmin, handleEdit, handleDelete),
    [isAdmin],
  );

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: 4 }}>
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
            Donation Drives
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {donationDrives.length} total drive
            {donationDrives.length !== 1 ? "s" : ""} — manage and track your
            donation drive campaigns
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <CustomButton
            variant="outline"
            onClick={() => setTemplateModalOpen(true)}
            icon={<DownloadIcon sx={{ fontSize: 18 }} />}
          >
            Download Template
          </CustomButton>
          <CustomButton onClick={() => setModalOpen(true)} icon={<FaPlus />}>
            Add New Drive
          </CustomButton>
        </Box>
      </Box>

      {/* Loading */}
      {loading && <LoadingSpinner message="Loading donation drives..." />}

      {/* Error */}
      {!loading && error && (
        <Alert
          severity="error"
          action={
            <CustomErrorButton onClick={() => fetchAllDonationDrives()}>
              Retry
            </CustomErrorButton>
          }
        >
          {error}
        </Alert>
      )}

      {/* DataGrid */}
      {!loading && !error && (
        <Box
          sx={{
            height: "max-content",
            width: "100%",
            backgroundColor: "#fff",
            borderRadius: 2,
            boxShadow: 1,
            overflow: "hidden",
          }}
        >
          <DataGrid
            rows={donationDrives}
            columns={columns}
            getRowId={(row) => row.id}
            loading={loading}
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
            }}
          />
        </Box>
      )}

      {/* Snackbar */}
      <SnackbarAlert
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbar.message}
        severity={snackbar.severity}
        icon={snackbar.severity === "success" ? <FaCheck /> : <TbCancel />}
      />

      {/* Download CSV Template Modal */}
      <DownloadCSVTemplateModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        isAdmin={isAdmin}
      />

      {/* Edit Modal */}
      {modalOpen && (
        <Backdrop
          open={modalOpen}
          onClick={() => {
            setModalOpen(false);
            setEditRow(null);
          }}
          sx={{ zIndex: 50, p: 2 }}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 sm:p-6 border-b">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {editRow ? "Edit Donation Drive" : "Create New Donation Drive"}
              </h2>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setEditRow(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer"
              >
                <IoClose />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-73px)]">
              <DonationDriveFormModal
                isAdmin={isAdmin}
                onClose={handleClose}
                editData={editRow}
                loggedInUserId={userId}
                loggedInSchoolId={schoolId}
              />
            </div>
          </div>
        </Backdrop>
      )}

      {/* Delete Confirmation */}
      {deleteRow && (
        <DeleteConfirmModal
          open={!!deleteRow}
          onClose={() => setDeleteRow(null)}
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
          title="Delete Donation Drive"
          description={
            <>
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-700">
                {deleteRow?.driveName}
              </span>
              ? This action cannot be undone.
            </>
          }
        />
      )}
    </Box>
  );
}
