// @ts-nocheck
'use client';

import {
  Paper,
  Typography,
  Select,
  MenuItem,
  Button,
  TextField,
  Divider,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import RecipeIngredientRow from './RecipeIngredientRow';
import CustomButton from '@/components/ui/CustomButton';
import { FiEdit3, FiTrash2 } from 'react-icons/fi';

export default function ManageRecipesSection({
  schoolGroups,
  selectedSchoolId,
  onSchoolChange,
  products,
  selectedProductId,
  onProductChange,
  styles,
  selectedStyleId,
  onStyleChange,
  recipes,
  onBeginEdit,
  onDeleteRecipe,
  mode,
  onCancelEdit,
  recipeName,
  onRecipeNameChange,
  onAddIngredient,
  loadingItemTypes,
  itemTypesError,
  ingredientRows,
  itemTypes,
  onIngredientChange,
  onIngredientRemove,
  saving,
  onSaveRecipe,
}) {
  return (
    <>
      <Paper elevation={0} className="rounded-lg p-5 space-y-4" sx={{ boxShadow: 1, borderRadius: 2, bgcolor: '#fff' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Select target product style</Typography>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select size="small" value={selectedSchoolId} displayEmpty onChange={(e) => onSchoolChange(e.target.value)}>
            <MenuItem value="" disabled><em>Select school</em></MenuItem>
            {schoolGroups.map((group) => (
              <MenuItem key={group.school.id} value={String(group.school.id)}>
                {group.school.schoolName}
              </MenuItem>
            ))}
          </Select>

          <Select
            size="small"
            value={selectedProductId}
            displayEmpty
            disabled={!selectedSchoolId}
            onChange={(e) => onProductChange(e.target.value)}
          >
            <MenuItem value="" disabled><em>Select product</em></MenuItem>
            {products.map((product) => (
              <MenuItem key={product.id} value={String(product.id)}>{product.productName}</MenuItem>
            ))}
          </Select>

          <Select
            size="small"
            value={selectedStyleId}
            displayEmpty
            disabled={!selectedProductId}
            onChange={(e) => onStyleChange(e.target.value)}
          >
            <MenuItem value="" disabled><em>Select style</em></MenuItem>
            {styles.map((style) => (
              <MenuItem key={style.id} value={String(style.id)}>
                {style.style?.styleName ?? `Style ${style.id}`}
              </MenuItem>
            ))}
          </Select>
        </div>
      </Paper>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Paper elevation={0} className="rounded-lg p-5 space-y-4" sx={{ boxShadow: 1, borderRadius: 2, bgcolor: '#fff' }}>
          <div className="flex items-center justify-between">
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Existing recipes{selectedStyleId ? ` (${recipes.length})` : ''}
            </Typography>
          </div>

          {!selectedStyleId && (
            <p className="text-sm text-gray-500">Select a school, product, and style to view recipes.</p>
          )}

          {selectedStyleId && recipes.length === 0 && (
            <p className="text-sm text-gray-500">No recipes yet for this style.</p>
          )}

          {selectedStyleId && recipes.length > 0 && (
            <div className="space-y-3">
              {recipes.map((recipe) => (
                <div key={recipe.id} className="border border-gray-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{recipe.recipeName}</p>
                    <div className="flex items-center gap-1">
                      <CustomButton
                        iconOnly
                        icon={<FiEdit3 size={14} />}
                        onClick={() => onBeginEdit(recipe)}
                        disabled={saving}
                      />
                      <CustomButton
                        iconOnly
                        variant="iconDanger"
                        icon={<FiTrash2 size={14} />}
                        onClick={() => onDeleteRecipe(recipe.id)}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    {recipe.recipeIngredients?.map((ing) => (
                      <div key={ing.id} className="text-xs text-gray-600 flex items-center justify-between gap-2">
                        <span>
                          {ing.itemType?.category?.categoryName ?? `ItemType ${ing.itemTypeId}`} (ID: {ing.itemTypeId})
                        </span>
                        <span className="font-medium text-gray-700">
                          {ing.quantityRequired} {ing.sizeClass ? `• ${ing.sizeClass}` : '• all sizes'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Paper>

        <Paper elevation={0} className="rounded-lg p-5 space-y-4" sx={{ boxShadow: 1, borderRadius: 2, bgcolor: '#fff' }}>
          <div className="flex items-center justify-between gap-3">
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {mode === 'edit' ? 'Edit Recipe' : 'Create Recipe'}
            </Typography>
            {mode === 'edit' && (
              <Button
                size="small"
                startIcon={<CancelOutlinedIcon />}
                onClick={onCancelEdit}
                sx={{ textTransform: 'none' }}
              >
                Cancel edit
              </Button>
            )}
          </div>

          <TextField
            fullWidth
            size="small"
            label="Recipe Name"
            value={recipeName}
            onChange={(e) => onRecipeNameChange(e.target.value)}
            disabled={!selectedStyleId}
          />

          <Divider />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Typography variant="body2" sx={{ color: '#4b5563', fontWeight: 600 }}>Ingredients</Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={onAddIngredient}
                disabled={!selectedStyleId}
                sx={{ textTransform: 'none' }}
              >
                Add ingredient
              </Button>
            </div>

            {loadingItemTypes && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CircularProgress size={14} /> Loading item types...
              </div>
            )}

            {itemTypesError && (
              <p className="text-sm text-amber-600">{itemTypesError}</p>
            )}

            <div className="space-y-2">
              {ingredientRows.map((row, index) => (
                <RecipeIngredientRow
                  key={row.rowId ?? `${row.itemTypeId || 'item'}_${row.sizeClass || 'all'}_${index}`}
                  row={row}
                  itemTypes={itemTypes}
                  onChange={(updated) => onIngredientChange(row.rowId, updated)}
                  onRemove={() => onIngredientRemove(row.rowId)}
                />
              ))}
            </div>
          </div>

          <div>
            <CustomButton
              icon={!saving ? <SaveOutlinedIcon /> : undefined}
              onClick={onSaveRecipe}
              disabled={!selectedStyleId || saving}
            >
              {saving ? 'Saving...' : mode === 'edit' ? 'Update Recipe' : 'Create Recipe'}
            </CustomButton>
          </div>
        </Paper>
      </div>
    </>
  );
}
