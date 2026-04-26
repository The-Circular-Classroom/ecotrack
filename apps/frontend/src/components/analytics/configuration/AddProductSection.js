'use client';

import {
  Paper,
  Typography,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function AddProductSection({
  schoolGroups,
  newProductSchoolId,
  onNewProductSchoolChange,
  newProductName,
  onNewProductNameChange,
  newProductTypeMode,
  onNewProductTypeModeChange,
  newProductTypeId,
  onNewProductTypeChange,
  newProductTypeName,
  onNewProductTypeNameChange,
  productTypeOptions,
  loadingProductOptions,
  newProductStyleMode,
  onNewProductStyleModeChange,
  newProductStyleId,
  onNewProductStyleIdChange,
  styleOptions,
  newStyleName,
  onNewStyleNameChange,
  creatingProduct,
  loadingCatalog,
  onCreateProduct,
}) {
  return (
    <Paper elevation={0} className="rounded-lg p-5 space-y-4" sx={{ boxShadow: 1, borderRadius: 2, bgcolor: '#fff' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Add new product</Typography>
      <p className="text-sm text-gray-500">
        Create a new product with its initial style so recipes can be configured immediately.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Select
          size="small"
          value={newProductSchoolId}
          displayEmpty
          onChange={(e) => onNewProductSchoolChange(e.target.value)}
        >
          <MenuItem value="" disabled><em>Select school</em></MenuItem>
          {schoolGroups.map((group) => (
            <MenuItem key={group.school.id} value={String(group.school.id)}>
              {group.school.schoolName}
            </MenuItem>
          ))}
        </Select>

        <TextField
          size="small"
          label="Product name"
          value={newProductName}
          onChange={(e) => onNewProductNameChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Typography variant="body2" sx={{ color: '#4b5563', fontWeight: 600 }}>Product type</Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            size="small"
            value={newProductTypeMode}
            onChange={(e) => onNewProductTypeModeChange(e.target.value)}
          >
            <MenuItem value="existing">Use existing product type</MenuItem>
            <MenuItem value="new">Create new product type</MenuItem>
          </Select>

          {newProductTypeMode === 'existing' ? (
            <Select
              size="small"
              value={newProductTypeId}
              displayEmpty
              onChange={(e) => onNewProductTypeChange(e.target.value)}
              disabled={loadingProductOptions}
            >
              <MenuItem value="" disabled><em>Select product type</em></MenuItem>
              {productTypeOptions.map((option) => (
                <MenuItem key={option.id} value={String(option.id)}>
                  {option.typeName}
                </MenuItem>
              ))}
            </Select>
          ) : (
            <TextField
              size="small"
              label="New product type"
              value={newProductTypeName}
              onChange={(e) => onNewProductTypeNameChange(e.target.value)}
            />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Typography variant="body2" sx={{ color: '#4b5563', fontWeight: 600 }}>Style</Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            size="small"
            value={newProductStyleMode}
            onChange={(e) => onNewProductStyleModeChange(e.target.value)}
          >
            <MenuItem value="existing">Use existing style</MenuItem>
            <MenuItem value="new">Create new style</MenuItem>
          </Select>

          {newProductStyleMode === 'existing' ? (
            <Select
              size="small"
              value={newProductStyleId}
              displayEmpty
              onChange={(e) => onNewProductStyleIdChange(e.target.value)}
              disabled={loadingProductOptions}
            >
              <MenuItem value="" disabled><em>Select initial style</em></MenuItem>
              {styleOptions.map((option) => (
                <MenuItem key={option.id} value={String(option.id)}>
                  {option.styleName}
                </MenuItem>
              ))}
            </Select>
          ) : (
            <TextField
              size="small"
              label="New style name"
              value={newStyleName}
              onChange={(e) => onNewStyleNameChange(e.target.value)}
            />
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Product type classifies the product category (from your product type master list) and is required by backend schema.
      </p>

      <div className="flex items-center justify-end pt-1">
        <Button
          variant="contained"
          onClick={onCreateProduct}
          disabled={creatingProduct || loadingCatalog || loadingProductOptions}
          startIcon={creatingProduct ? <CircularProgress size={14} color="inherit" /> : <AddIcon />}
          sx={{
            textTransform: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            backgroundColor: '#69aa56',
            '&:hover': { backgroundColor: '#55923e' },
          }}
        >
          {creatingProduct ? 'Creating...' : 'Create product'}
        </Button>
      </div>

    </Paper>
  );
}
