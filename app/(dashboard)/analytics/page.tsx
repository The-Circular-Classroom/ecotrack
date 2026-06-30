'use client';

import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Inventory2Rounded from '@mui/icons-material/Inventory2Rounded';
import ScaleRounded from '@mui/icons-material/ScaleRounded';
import SchoolRounded from '@mui/icons-material/SchoolRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import BuildRounded from '@mui/icons-material/BuildRounded';
import PaletteRounded from '@mui/icons-material/PaletteRounded';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// ─── Types matching API responses ─────────────────────────────────────────────

interface PlatformOverview {
  totalItems: number;
  totalEstimatedWeightKg: number;
  bySchool: Array<{ schoolId: number; schoolName: string; count: number }>;
  byCategory: Array<{ categoryId: number; categoryName: string; count: number; weightKg: number }>;
  yearlyTrends: Array<{ year: number; donationsIn: number; disposed: number }>;
  driveParticipation: Array<{ driveId: number; driveName: string; totalDonations: number }>;
  repurposeMaterialByColour: Array<{ colourName: string; hexcode: string; count: number }>;
}

interface CollectionAnalyticsResult {
  filters: {
    year: number;
    startMonth?: number;
    endMonth?: number;
    schoolId?: number;
  };
  schools: Array<{
    schoolId: number;
    schoolName: string;
    totalQuantity: number;
    totalEstimatedWeightKg: number;
    categories: Array<{
      categoryId: number;
      categoryName: string;
      totalQuantity: number;
      totalEstimatedWeightKg: number;
    }>;
    drives: Array<{
      driveId: number;
      driveName: string;
      totalQuantity: number;
    }>;
  }>;
}

interface RepurposeProjection {
  productStyleId: number;
  productName: string;
  styleName: string;
  schoolId: number | null;
  schoolName: string | null;
  maxProducible: number;
  ingredients: Array<{
    itemTypeId: number;
    categoryName: string;
    quantityRequired: number;
    sizeClass: string | null;
    availableStock: number;
    maxUnitsSupported: number;
  }>;
}

interface AssemblyData {
  projections: RepurposeProjection[];
}

// ─── Chart colour palette ─────────────────────────────────────────────────────

const CHART_COLORS = [
  '#69aa56', // brand primary green
  '#213c2d', // brand dark green
  '#b9ff9b', // brand subtle green
  '#4caf50', // material green
  '#2e7d32', // deep green
  '#81c784', // light green
  '#388e3c', // green accent
  '#a5d6a7', // pale green
  '#1b5e20', // dark green
  '#66bb6a', // medium green
];

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [collection, setCollection] = useState<CollectionAnalyticsResult | null>(null);
  const [assembly, setAssembly] = useState<AssemblyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [startMonth, setStartMonth] = useState<number | ''>('');
  const [endMonth, setEndMonth] = useState<number | ''>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build collection query params
      const collectionParams = new URLSearchParams({ year: String(year) });
      if (startMonth !== '') collectionParams.set('startMonth', String(startMonth));
      if (endMonth !== '') collectionParams.set('endMonth', String(endMonth));

      const [overviewRes, collectionRes, assemblyRes] = await Promise.all([
        fetch('/api/analytics/overview'),
        fetch(`/api/analytics/collection?${collectionParams.toString()}`),
        fetch('/api/analytics/assembly'),
      ]);

      if (!overviewRes.ok) {
        const body = await overviewRes.json().catch(() => ({}));
        throw new Error(body.message || `Overview request failed (${overviewRes.status})`);
      }
      if (!collectionRes.ok) {
        const body = await collectionRes.json().catch(() => ({}));
        throw new Error(body.message || `Collection request failed (${collectionRes.status})`);
      }
      if (!assemblyRes.ok) {
        const body = await assemblyRes.json().catch(() => ({}));
        throw new Error(body.message || `Assembly request failed (${assemblyRes.status})`);
      }

      const [overviewData, collectionData, assemblyData] = await Promise.all([
        overviewRes.json() as Promise<PlatformOverview>,
        collectionRes.json() as Promise<CollectionAnalyticsResult>,
        assemblyRes.json() as Promise<AssemblyData>,
      ]);

      setOverview(overviewData);
      setCollection(collectionData);
      setAssembly(assemblyData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [year, startMonth, endMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  if (!overview) {
    return (
      <Box p={3}>
        <Alert severity="info">No analytics data available.</Alert>
      </Box>
    );
  }

  // Prepare chart data
  const schoolBarData = overview.bySchool.slice(0, 8).map((s) => ({
    name: s.schoolName.length > 15 ? s.schoolName.slice(0, 15) + '…' : s.schoolName,
    items: s.count,
  }));

  const categoryBarData = overview.byCategory.slice(0, 8).map((c) => ({
    name: c.categoryName.length > 15 ? c.categoryName.slice(0, 15) + '…' : c.categoryName,
    items: c.count,
    weight: c.weightKg,
  }));

  const colourPieData = overview.repurposeMaterialByColour.slice(0, 8).map((c) => ({
    name: c.colourName,
    value: c.count,
    fill: c.hexcode,
  }));

  const trendLineData = overview.yearlyTrends.map((t) => ({
    year: String(t.year),
    donationsIn: t.donationsIn,
    disposed: t.disposed,
  }));

  // Collection data for bar chart (donations by school for selected year)
  const collectionBySchool = collection?.schools.slice(0, 8).map((s) => ({
    name: s.schoolName.length > 15 ? s.schoolName.slice(0, 15) + '…' : s.schoolName,
    quantity: s.totalQuantity,
    weight: s.totalEstimatedWeightKg,
  })) ?? [];

  // Assembly projections for bar chart
  const assemblyBarData = (assembly?.projections ?? []).slice(0, 8).map((p) => ({
    name: p.productName.length > 12 ? p.productName.slice(0, 12) + '…' : p.productName,
    maxProducible: p.maxProducible,
  }));

  // Year options for filter
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const monthOptions = [
    { value: '', label: 'All' },
    { value: 1, label: 'Jan' },
    { value: 2, label: 'Feb' },
    { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' },
    { value: 5, label: 'May' },
    { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' },
    { value: 8, label: 'Aug' },
    { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' },
    { value: 11, label: 'Nov' },
    { value: 12, label: 'Dec' },
  ];

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Analytics
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Collection analytics, assembly projections, and school performance insights.
      </Typography>

      {/* Summary Stat Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            icon={<Inventory2Rounded sx={{ fontSize: 36, color: 'primary.main' }} />}
            label="Total Items"
            value={overview.totalItems.toLocaleString()}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            icon={<ScaleRounded sx={{ fontSize: 36, color: 'primary.main' }} />}
            label="Estimated Weight"
            value={`${overview.totalEstimatedWeightKg.toLocaleString()} kg`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            icon={<SchoolRounded sx={{ fontSize: 36, color: 'primary.main' }} />}
            label="Active Schools"
            value={overview.bySchool.length.toLocaleString()}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            icon={<TrendingUpRounded sx={{ fontSize: 36, color: 'primary.main' }} />}
            label="Total Drives"
            value={overview.driveParticipation.length.toLocaleString()}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            icon={<PaletteRounded sx={{ fontSize: 36, color: 'primary.main' }} />}
            label="Repurpose Colours"
            value={overview.repurposeMaterialByColour.length.toLocaleString()}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            icon={<BuildRounded sx={{ fontSize: 36, color: 'primary.main' }} />}
            label="Assembly Products"
            value={(assembly?.projections.length ?? 0).toLocaleString()}
          />
        </Grid>
      </Grid>

      {/* Filter Controls */}
      <Paper variant="outlined" sx={{ p: 2, mb: 4 }}>
        <Typography variant="subtitle2" color="text.secondary" mb={1}>
          Collection Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Start Month"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value === '' ? '' : Number(e.target.value))}
            >
              {monthOptions.map((m) => (
                <MenuItem key={m.label} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="End Month"
              value={endMonth}
              onChange={(e) => setEndMonth(e.target.value === '' ? '' : Number(e.target.value))}
            >
              {monthOptions.map((m) => (
                <MenuItem key={m.label} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Yearly Trends - Line Chart */}
      {trendLineData.length > 0 && (
        <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Yearly Trends
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendLineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="donationsIn"
                stroke="#69aa56"
                strokeWidth={2}
                name="Donations In"
                dot={{ fill: '#69aa56' }}
              />
              <Line
                type="monotone"
                dataKey="disposed"
                stroke="#213c2d"
                strokeWidth={2}
                name="Disposed"
                dot={{ fill: '#213c2d' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Inventory by School - Bar Chart */}
      {schoolBarData.length > 0 && (
        <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Inventory by School
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={schoolBarData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="items" fill="#69aa56" name="Items" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Inventory by Category - Bar Chart */}
      {categoryBarData.length > 0 && (
        <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Inventory by Category
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryBarData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="items" fill="#69aa56" name="Items" radius={[4, 4, 0, 0]} />
              <Bar dataKey="weight" fill="#213c2d" name="Weight (kg)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Repurpose Material by Colour - Pie Chart */}
      {colourPieData.length > 0 && (
        <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Repurpose Material by Colour
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={colourPieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                nameKey="name"
                label={(entry) => entry.name}
              >
                {colourPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill || CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Collection by School (filtered) - Bar Chart */}
      {collectionBySchool.length > 0 && (
        <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Collection by School ({year})
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={collectionBySchool} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantity" fill="#b9ff9b" name="Quantity" radius={[4, 4, 0, 0]} />
              <Bar dataKey="weight" fill="#69aa56" name="Weight (kg)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Assembly Projections - Bar Chart */}
      {assemblyBarData.length > 0 && (
        <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Assembly Projections
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={assemblyBarData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="maxProducible" fill="#4caf50" name="Max Producible" radius={[4, 4, 0, 0]}>
                {assemblyBarData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}
    </Box>
  );
}

// ─── StatCard Component ───────────────────────────────────────────────────────

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
