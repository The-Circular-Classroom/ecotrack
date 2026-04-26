'use client';

import { Select, MenuItem, TextField } from '@mui/material';
import { FiTrash2 } from 'react-icons/fi';
import CustomButton from '@/components/ui/CustomButton';

const SIZE_CLASS_OPTIONS = ['', 'S', 'L'];

export default function RecipeIngredientRow({ row, itemTypes, onChange, onRemove }) {
  return (
    <div className="grid grid-cols-12 gap-3 items-center">
      <div className="col-span-6">
        <Select
          fullWidth
          size="small"
          value={row.itemTypeId}
          displayEmpty
          onChange={(e) => onChange({ ...row, itemTypeId: e.target.value })}
        >
          <MenuItem value="" disabled>
            <em>Select ingredient item type</em>
          </MenuItem>
          {itemTypes.map((it) => (
            <MenuItem key={it.id} value={it.id}>
              {it.category?.categoryName ?? `ItemType ${it.id}`} (ID: {it.id})
            </MenuItem>
          ))}
        </Select>
      </div>

      <div className="col-span-3">
        <TextField
          fullWidth
          size="small"
          label="Qty required"
          type="number"
          value={row.quantityRequired}
          onChange={(e) => onChange({ ...row, quantityRequired: e.target.value })}
          inputProps={{ min: 0.1, step: 0.1 }}
        />
      </div>

      <div className="col-span-2">
        <Select
          fullWidth
          size="small"
          value={row.sizeClass}
          displayEmpty
          onChange={(e) => onChange({ ...row, sizeClass: e.target.value })}
        >
          <MenuItem value="">All sizes</MenuItem>
          {SIZE_CLASS_OPTIONS.filter((value) => value).map((value) => (
            <MenuItem key={value} value={value}>{value}</MenuItem>
          ))}
        </Select>
      </div>

      <div className="col-span-1 flex justify-end">
        <CustomButton iconOnly variant="iconDanger" icon={<FiTrash2 size={14} />} onClick={onRemove} />
      </div>
    </div>
  );
}
