'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Inventory2Rounded from '@mui/icons-material/Inventory2Rounded';
import BarChartRounded from '@mui/icons-material/BarChartRounded';
import PeopleRounded from '@mui/icons-material/PeopleRounded';
import VolunteerActivismRounded from '@mui/icons-material/VolunteerActivismRounded';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import ScaleRounded from '@mui/icons-material/ScaleRounded';
import SchoolRounded from '@mui/icons-material/SchoolRounded';
import CategoryRounded from '@mui/icons-material/CategoryRounded';
import PaletteRounded from '@mui/icons-material/PaletteRounded';
import ColorCard from '@/components/ColorCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface PlatformOverview {
  totalItems: number;
  totalEstimatedWeightKg: number;
  bySchool: Array<{ schoolId: number; schoolName: string; count: number }>;
  byCategory: Array<{ categoryId: number; categoryName: string; count: number; weightKg: number }>;
  yearlyTrends: Array<{ year: number; donationsIn: number; disposed: number }>;
  driveParticipation: Array<{ driveId: number; driveName: string; totalDonations: number }>;
  repurposeMaterialByColour: Array<{ colourName: string; hexcode: string; count: number }>;
}

export default function OverviewPage() {
  const [data, setData] = useState<PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOverview() {
      try {
        const res = await fetch('/api/analytics/overview');
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || `Request failed with status ${res.status}`);
        }
        const json: PlatformOverview = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load overview data');
      } finally {
        setLoading(false);
      }
    }
    fetchOverview();
  }, []);

  return (
    <Box sx={{ position: 'relative', minHeight: '100%' }}>
      {/* Decorative gradient background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 220,
          background: 'linear-gradient(135deg, #69aa56 0%, #213c2d 100%)',
          borderRadius: '0 0 24px 24px',
          zIndex: 0,
        }}
      />

      {/* Content */}
      <Box sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        {/* Page Title */}
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: '#ffffff', pt: 1 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 3 }}>
          Welcome back! Navigate to modules or review platform statistics below.
        </Typography>

        {/* Module Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <ColorCard
              title="Inventory Management"
              description="Track and manage school inventory items, categories, and balances."
              icon={<Inventory2Rounded />}
              href="/inventory"
              variant="subtle"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <ColorCard
              title="Carbon Tracker"
              description="View analytics, collection data, and environmental impact metrics."
              icon={<BarChartRounded />}
              href="/analytics"
              variant="primary"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <ColorCard
              title="User Management"
              description="Manage users, roles, and school assignments."
              icon={<PeopleRounded />}
              href="/users"
              variant="dark"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <ColorCard
              title="Donation Drives"
              description="Create and manage donation campaigns and track participation."
              icon={<VolunteerActivismRounded />}
              href="/donations"
              variant="gradient"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <ColorCard
              title="CSV Upload"
              description="Bulk upload inventory data via CSV validation and approval."
              icon={<UploadFileRounded />}
              href="/csv-upload"
              variant="subtle"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <ColorCard
              title="Settings"
              description="Manage your profile, email, password, and account preferences."
              icon={<SettingsRounded />}
              href="/settings"
              variant="primary"
            />
          </Grid>
        </Grid>

        {/* Summary Stats Section */}
        <Typography variant="h5" fontWeight={700} mb={2}>
          Platform Summary
        </Typography>

        {loading && <LoadingSpinner label="Loading overview data..." />}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && data && (
          <>
            {/* Key Metric Cards */}
            <Grid container spacing={3} mb={4}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <StatCard
                  icon={<Inventory2Rounded sx={{ fontSize: 36, color: 'primary.main' }} />}
                  label="Total Items"
                  value={data.totalItems.toLocaleString()}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <StatCard
                  icon={<ScaleRounded sx={{ fontSize: 36, color: 'primary.main' }} />}
                  label="Estimated Weight"
                  value={`${data.totalEstimatedWeightKg.toLocaleString()} kg`}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <StatCard
                  icon={<SchoolRounded sx={{ fontSize: 36, color: 'primary.main' }} />}
                  label="Active Schools"
                  value={data.bySchool.length.toLocaleString()}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <StatCard
                  icon={<CategoryRounded sx={{ fontSize: 36, color: 'primary.main' }} />}
                  label="Categories"
                  value={data.byCategory.length.toLocaleString()}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <StatCard
                  icon={<VolunteerActivismRounded sx={{ fontSize: 36, color: 'primary.main' }} />}
                  label="Active Drives"
                  value={data.driveParticipation.length.toLocaleString()}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <StatCard
                  icon={<PaletteRounded sx={{ fontSize: 36, color: 'primary.main' }} />}
                  label="Repurpose Colours"
                  value={data.repurposeMaterialByColour.length.toLocaleString()}
                />
              </Grid>
            </Grid>

            {/* Top Schools */}
            {data.bySchool.length > 0 && (
              <>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Top Schools by Inventory
                </Typography>
                <Grid container spacing={2} mb={4}>
                  {data.bySchool.slice(0, 5).map((school) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={school.schoolId}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {school.schoolName}
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {school.count.toLocaleString()} items
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            {/* Top Categories */}
            {data.byCategory.length > 0 && (
              <>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Top Categories
                </Typography>
                <Grid container spacing={2} mb={4}>
                  {data.byCategory.slice(0, 6).map((cat) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={cat.categoryId}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {cat.categoryName}
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {cat.count.toLocaleString()} items
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ~{cat.weightKg.toLocaleString()} kg
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            {/* Yearly Trends */}
            {data.yearlyTrends.length > 0 && (
              <>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Yearly Trends
                </Typography>
                <Grid container spacing={2} mb={4}>
                  {data.yearlyTrends.map((trend) => (
                    <Grid size={{ xs: 6, sm: 4, md: 2 }} key={trend.year}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {trend.year}
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          +{trend.donationsIn.toLocaleString()} in
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          -{trend.disposed.toLocaleString()} out
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            {/* Drive Participation */}
            {data.driveParticipation.length > 0 && (
              <>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Drive Participation
                </Typography>
                <Grid container spacing={2}>
                  {data.driveParticipation.slice(0, 6).map((drive) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={drive.driveId}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {drive.driveName}
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {drive.totalDonations.toLocaleString()} donations
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </>
        )}

        {!loading && !error && !data && (
          <Alert severity="info">No overview data available.</Alert>
        )}
      </Box>
    </Box>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: '4px solid',
        borderLeftColor: 'primary.main',
      }}
    >
      {icon}
      <Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={700}>
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}
