'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Inventory2Rounded from '@mui/icons-material/Inventory2Rounded';
import ScaleRounded from '@mui/icons-material/ScaleRounded';
import SchoolRounded from '@mui/icons-material/SchoolRounded';
import CategoryRounded from '@mui/icons-material/CategoryRounded';
import VolunteerActivismRounded from '@mui/icons-material/VolunteerActivismRounded';
import PaletteRounded from '@mui/icons-material/PaletteRounded';

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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box p={3}>
        <Alert severity="info">No overview data available.</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Platform Overview
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Summary statistics across all schools and programs.
      </Typography>

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

      {/* Top Categories */}
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
