// @ts-nocheck
"use client";

import { useState, useEffect, useMemo } from "react";

// mui
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Backdrop,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
} from "@mui/material";

// icon
import { IoClose } from "react-icons/io5";
import { Download as DownloadIcon } from "@mui/icons-material";
import SchoolIcon from "@mui/icons-material/School";
import BusinessIcon from "@mui/icons-material/Business";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

// components
import CustomButton from "@/components/ui/CustomButton";

function getSchoolOptionId(school) {
  if (!school) return "";
  return String(
    school.schoolId ??
      school.school_id ??
      school.id ??
      "",
  );
}

export default function DownloadCSVTemplateModal({ isOpen, onClose, isAdmin }) {
  const apiUrl = '';
  const apiAuthUrl = '';

  const [loadingInit, setLoadingInit] = useState(false);
  const [initError, setInitError] = useState("");

  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");

  const [userSchool, setUserSchool] = useState(null);

  const [drives, setDrives] = useState([]);
  const [loadingDrives, setLoadingDrives] = useState(false);
  const [selectedDriveId, setSelectedDriveId] = useState("");

  const [selectedLocation, setSelectedLocation] = useState("school");

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const token = () => sessionStorage.getItem("accessToken");
  const selectedSchoolOption = useMemo(
    () =>
      schools.find((school) => String(school.id) === String(selectedSchoolId)) ||
      null,
    [schools, selectedSchoolId]
  );

  useEffect(() => {
    if (!isOpen) return;
    setSelectedSchoolId("");
    setSelectedDriveId("");
    setSelectedLocation("school");
    setDrives([]);
    setDownloadError("");
    setInitError("");

    if (isAdmin) {
      fetchSchools();
    } else {
      fetchUserSchool();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isAdmin]);

  const fetchSchools = async () => {
    setLoadingInit(true);
    try {
      const accessToken = token();
      const [analyticsRes, inventoryRes] = await Promise.all([
        fetch(`/api/schools`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${apiUrl}/api/inventory/balances`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      const [analyticsJson, inventoryJson] = await Promise.all([
        analyticsRes.json(),
        inventoryRes.json(),
      ]);

      if (!analyticsRes.ok) {
        throw new Error(analyticsJson.message || "Failed to fetch schools");
      }
      if (!inventoryRes.ok) {
        throw new Error(
          inventoryJson.message || "Failed to fetch schools with inventory"
        );
      }

      const analyticsSchools = (analyticsJson.data || [])
        .map((school) => ({
          ...school,
          id: getSchoolOptionId(school),
        }))
        .filter((school) => school.id);

      const analyticsSchoolMap = new Map(
        analyticsSchools.map((school) => [String(school.id), school])
      );

      const inventorySchoolMap = new Map();
      (inventoryJson.data || []).forEach((balance) => {
        const school = balance?.itemType?.school;
        const schoolId = getSchoolOptionId(school);

        if (!schoolId || inventorySchoolMap.has(schoolId)) return;

        inventorySchoolMap.set(schoolId, {
          ...school,
          ...analyticsSchoolMap.get(schoolId),
          id: schoolId,
          schoolName:
            school?.schoolName ||
            analyticsSchoolMap.get(schoolId)?.schoolName ||
            "Unknown School",
        });
      });

      setSchools(
        Array.from(inventorySchoolMap.values()).sort((a, b) =>
          String(a.schoolName || "").localeCompare(String(b.schoolName || ""))
        )
      );
    } catch (err) {
      setInitError(err.message);
    } finally {
      setLoadingInit(false);
    }
  };

  const fetchUserSchool = async () => {
    setLoadingInit(true);
    try {
      const res = await fetch(`${apiAuthUrl}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token()}`,
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to fetch profile");

      const schoolFromProfile = json.school;
      const schoolIdFromProfile = json.schoolId ?? json.school_id ?? schoolFromProfile?.id;

      if (!schoolIdFromProfile) {
        setInitError(
          "Your account is not linked to a school. Please contact your administrator."
        );
        return;
      }

      let resolvedSchool = schoolFromProfile ?? null;

      if (!resolvedSchool) {
        const analyticsApiUrl =
          '';
        const schoolRes = await fetch(
          `${analyticsApiUrl}/api/school/${schoolIdFromProfile}/profile`,
          {
            headers: {
              Authorization: `Bearer ${token()}`,
            },
          }
        );
        const schoolJson = await schoolRes.json().catch(() => ({}));

        if (!schoolRes.ok) {
          throw new Error(
            schoolJson.message || "Failed to retrieve your school information."
          );
        }

        const schoolData = schoolJson.data || schoolJson;
        resolvedSchool = {
          id: schoolData.schoolId ?? schoolIdFromProfile,
          schoolName: schoolData.schoolName || "Your School",
        };
      }

      setUserSchool(resolvedSchool);
      fetchDrivesForSchool(resolvedSchool.id);
    } catch (err) {
      setInitError(err.message);
    } finally {
      setLoadingInit(false);
    }
  };

  const handleSchoolChange = (_event, school) => {
    const schoolId = school?.id ? String(school.id) : "";
    setSelectedSchoolId(schoolId);
    setSelectedDriveId("");
    setDrives([]);
    setDownloadError("");
    if (schoolId) fetchDrivesForSchool(schoolId);
  };

  const fetchDrivesForSchool = async (schoolId) => {
    setLoadingDrives(true);
    try {
      const res = await fetch(
        `${apiUrl}/api/donations/drives/school/${schoolId}`,
        {
          headers: { Authorization: `Bearer ${token()}` },
        }
      );
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.message || "Failed to fetch donation drives");
      const sorted = (json.data || []).sort((a, b) => {
        const now = new Date();
        const aActive = new Date(a.endDate) >= now;
        const bActive = new Date(b.endDate) >= now;
        if (aActive !== bActive) return aActive ? -1 : 1;
        return new Date(b.startDate) - new Date(a.startDate);
      });
      setDrives(sorted);
    } catch (err) {
      setInitError(err.message);
    } finally {
      setLoadingDrives(false);
    }
  };

  const downloadForLocation = async (loc) => {
    const driveId = selectedDriveId;
    const res = await fetch(
      `${apiUrl}/api/donations/drives/${driveId}/csv-template?location=${loc}`,
      {
        headers: { Authorization: `Bearer ${token()}` },
      }
    );

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.message || `Failed to download ${loc} template`);
    }

    const disposition = res.headers.get("content-disposition") || "";
    const match = disposition.match(/filename="?([^";\n]+)"?/i);
    const filename =
      match?.[1] || `donation_template_${loc}_drive_${driveId}.xlsx`;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownload = async () => {
    if (!selectedDriveId) return;
    setDownloading(true);
    setDownloadError("");
    try {
      if (selectedLocation === "both") {
        await downloadForLocation("school");
        await new Promise((resolve) => setTimeout(resolve, 500));
        await downloadForLocation("tcc");
      } else {
        await downloadForLocation(selectedLocation);
      }
    } catch (err) {
      setDownloadError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const driveIsActive = (drive) => new Date(drive.endDate) >= new Date();
  const schoolId = isAdmin ? selectedSchoolId : userSchool?.id;
  const canDownload = !!selectedDriveId && !downloading;

  const locationInfo = {
    school: {
      label: "School",
      description: "Items stored at the school",
      columns: ["For School", "For PSG Activities", "For Recycling/Disposal"],
    },
    tcc: {
      label: "TCC",
      description: "Items sent to The Circular Classroom",
      columns: ["For TCC Repurposing", "For Recycling/Disposal"],
    },
    both: {
      label: "Both Locations",
      description: "Downloads separate templates for School and TCC storage",
      columns: ["For School", "For PSG Activities", "For TCC Repurposing", "For Recycling/Disposal"],
    },
  };

  const downloadButtonLabel =
    selectedLocation === "both"
      ? "Download Both Excel"
      : "Download Excel";

  return (
    <Backdrop open={isOpen} onClick={onClose} sx={{ zIndex: 50, p: 2 }}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b flex-shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Download Donation Template
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Pre-filled with item types for the selected donation drive
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer ml-4"
          >
            <IoClose />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 flex flex-col gap-4">
          {initError && <Alert severity="error">{initError}</Alert>}

          {loadingInit && (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress size={32} sx={{ color: "var(--color-main)" }} />
            </Box>
          )}

          {!loadingInit && !initError && (
            <>
              {/* School selector (admin) */}
              {isAdmin ? (
                <Autocomplete
                  options={schools}
                  value={selectedSchoolOption}
                  onChange={handleSchoolChange}
                  disabled={schools.length === 0}
                  clearOnEscape
                  autoHighlight
                  isOptionEqualToValue={(option, value) =>
                    String(option.id) === String(value.id)
                  }
                  getOptionLabel={(option) => option?.schoolName || ""}
                  noOptionsText="No schools found"
                  slotProps={{
                    paper: {
                      sx: {
                        "& .MuiAutocomplete-listbox": {
                          py: 0.5,
                        },
                        "& .MuiAutocomplete-option": {
                          display: "block",
                          px: 1.5,
                          py: 1,
                        },
                      },
                    },
                  }}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1fr) auto",
                          alignItems: "center",
                          gap: 1,
                          width: "100%",
                          minWidth: 0,
                        }}
                      >
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{
                            minWidth: 0,
                            fontWeight: 500,
                          }}
                        >
                          {option.schoolName}
                        </Typography>
                        <Chip
                          label={
                            option.isCooperating
                              ? "Collaborating"
                              : "Not collaborating"
                          }
                          size="small"
                          sx={{
                            fontSize: "0.65rem",
                            height: 20,
                            flexShrink: 0,
                          }}
                          color={option.isCooperating ? "success" : "warning"}
                          variant="outlined"
                        />
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="School"
                      placeholder="Search school name"
                      size="small"
                      helperText="Search collaboration schools with available item types."
                    />
                  )}
                />
              ) : (
                /* Fixed school (non-admin) */
                <div className="px-3 py-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Your School
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {userSchool?.schoolName || "—"}
                  </p>
                </div>
              )}

              {/* Donation drive selector */}
              <FormControl
                fullWidth
                size="small"
                disabled={
                  !schoolId || loadingDrives || (isAdmin && !selectedSchoolId)
                }
              >
                <InputLabel id="drive-label">Donation Drive</InputLabel>
                <Select
                  labelId="drive-label"
                  label="Donation Drive"
                  value={selectedDriveId}
                  onChange={(e) => {
                    setSelectedDriveId(e.target.value);
                    setDownloadError("");
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: { maxHeight: 300 },
                    },
                  }}
                >
                  {loadingDrives && (
                    <MenuItem disabled value="">
                      <CircularProgress size={14} sx={{ mr: 1 }} /> Loading
                      drives...
                    </MenuItem>
                  )}
                  {!loadingDrives && drives.length === 0 && (
                    <MenuItem disabled value="">
                      No donation drives found
                    </MenuItem>
                  )}
                  {!loadingDrives &&
                    drives.map((d) => {
                      const active = driveIsActive(d);
                      return (
                        <MenuItem key={d.id} value={d.id}>
                          <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            width="100%"
                            gap={1}
                          >
                            <Typography variant="body2" noWrap>
                              {d.driveName}
                            </Typography>
                            <Box
                              display="flex"
                              alignItems="center"
                              gap={0.75}
                              flexShrink={0}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {new Date(d.startDate).toLocaleDateString()} –{" "}
                                {new Date(d.endDate).toLocaleDateString()}
                              </Typography>
                              <Chip
                                label={active ? "Active" : "Inactive"}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: "0.65rem",
                                  fontWeight: 600,
                                  backgroundColor: active
                                    ? "#f0fdf4"
                                    : "#fef2f2",
                                  color: active ? "#15803d" : "#b91c1c",
                                  border: `1px solid ${active ? "#86efac" : "#fca5a5"}`,
                                }}
                              />
                            </Box>
                          </Box>
                        </MenuItem>
                      );
                    })}
                </Select>
              </FormControl>

              {/* Location selector */}
              {selectedDriveId && (
                <>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#6b7280",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        mb: 1,
                        display: "block",
                      }}
                    >
                      Storage Location
                    </Typography>
                    <ToggleButtonGroup
                      value={selectedLocation}
                      exclusive
                      onChange={(_, val) => {
                        if (val) {
                          setSelectedLocation(val);
                          setDownloadError("");
                        }
                      }}
                      fullWidth
                      size="small"
                      sx={{
                        "& .MuiToggleButton-root": {
                          textTransform: "none",
                          fontWeight: 500,
                          fontSize: "0.875rem",
                          minHeight: 42,
                          whiteSpace: "nowrap",
                          py: 1.25,
                          borderColor: "#e5e7eb",
                          color: "#6b7280",
                          "&.Mui-selected": {
                            bgcolor: "var(--color-main)",
                            color: "#fff",
                            borderColor: "var(--color-main)",
                            "&:hover": {
                              bgcolor: "var(--color-darker)",
                            },
                          },
                        },
                      }}
                    >
                      <ToggleButton value="school">
                        <SchoolIcon sx={{ fontSize: 18, mr: 1 }} />
                        School
                      </ToggleButton>
                      <ToggleButton value="tcc">
                        <BusinessIcon sx={{ fontSize: 18, mr: 1 }} />
                        TCC
                      </ToggleButton>
                      <ToggleButton value="both">
                        <SwapHorizIcon sx={{ fontSize: 18, mr: 1 }} />
                        Both Locations
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  {/* Info box */}
                  <div className="h-32 overflow-y-auto px-3 py-3 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-sm font-medium text-blue-800 mb-1.5">
                      {locationInfo[selectedLocation].label} Template
                    </p>
                    <p className="text-sm text-blue-700 mb-2">
                      {locationInfo[selectedLocation].description}. Fill in the
                      quantities for each item type and status column.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {locationInfo[selectedLocation].columns.map((col) => (
                        <span
                          key={col}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-medium"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Download error */}
              {downloadError && <Alert severity="error">{downloadError}</Alert>}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center gap-3 p-4 border-t border-gray-200 flex-shrink-0">
          <CustomButton variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </CustomButton>
          <CustomButton
            onClick={handleDownload}
            disabled={!canDownload}
            icon={
              downloading ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <DownloadIcon fontSize="small" />
              )
            }
            className="flex-1"
          >
            {downloading ? "Downloading..." : downloadButtonLabel}
          </CustomButton>
        </div>
      </div>
    </Backdrop>
  );
}
