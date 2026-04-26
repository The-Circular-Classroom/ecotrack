'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  Box,
  Chip as MuiChip,
  Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { MODAL, BTN, COLORS } from '@/components/ui/theme';
import {
  getStatusLabel as themeStatusLabel,
  STATUS_CHIP_SX,
} from '@/components/ui/theme';

const STATUS_BADGE_CLASSES = {
  ForSale: 'bg-yellow-50 text-yellow-700 border border-yellow-300',
  Sold: 'bg-red-50 text-red-700 border border-red-200',
  ForRepurpose: 'bg-blue-50 text-blue-700 border border-blue-200',
  Repurposed: 'bg-green-50 text-green-700 border border-green-300',
  Disposed: 'bg-gray-100 text-gray-700 border border-gray-300',
  Donated: 'bg-green-50 text-green-700 border border-green-300',
  GeneralOffice: 'bg-teal-50 text-teal-700 border border-teal-300',
};
const getStatusBadgeCls = (status) =>
  STATUS_BADGE_CLASSES[status] || 'bg-gray-50 text-gray-600 border border-gray-200';

function labelOrDash(v) {
  if (v === undefined || v === null || v === '') return '—';
  return String(v);
}

function formatDate(v) {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

function getHexFromColour(colourObj) {
  if (!colourObj) return null;
  return (
    colourObj.hexcode ||
    colourObj.hexCode ||
    colourObj.hex ||
    colourObj.colourHex ||
    colourObj.colorHex ||
    null
  );
}

function ColorSwatch({ hex, title }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: 16,
        height: 16,
        borderRadius: '50%',
        border: `1px solid ${COLORS.border}`,
        backgroundColor: hex || '#e5e7eb',
        flexShrink: 0,
      }}
      title={title}
      aria-label={title}
    />
  );
}

export default function InventoryBalancePreviewModal({ isOpen, onClose, item }) {
  if (!isOpen || !item) return null;

  const itemType = item.itemType || {};
  const category = itemType.category || {};
  const primaryColour = itemType.primaryColour || {};
  const secondaryColour = itemType.secondaryColour || {};
  const pattern = itemType.pattern || {};
  const material = itemType.material || {};
  const sizeCategory = itemType.sizeCategory || {};
  const school = itemType.school || {};
  const sizeOption = item.sizeOption || {};

  const title = `${labelOrDash(school.schoolName)} • ${labelOrDash(
    category.categoryName
  )} • ${labelOrDash(primaryColour.colourName)} • ${labelOrDash(sizeOption.sizeName)}`;

  const primaryHex = getHexFromColour(primaryColour);
  const secondaryHex = getHexFromColour(secondaryColour);

  const photoUrl =
    item.photoUrl || item.photo_url || item.imageUrl || item.image_url ||
    itemType.photoUrl || itemType.photo_url || itemType.imageUrl || itemType.image_url || null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: MODAL.paper }}
    >
      <DialogTitle sx={MODAL.title}>
        <Typography variant="h6" sx={MODAL.titleText}>Item Details</Typography>
        <IconButton size="small" onClick={onClose} sx={MODAL.closeButton}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, pt: 2 }}>
          {/* Image */}
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ color: COLORS.textSecondary, mb: 1 }}>Image</Typography>
            <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${COLORS.border}`, bgcolor: COLORS.pageBg, position: 'relative', width: '100%', height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {photoUrl ? (
                <Image src={photoUrl} alt="Item photo" fill className="object-contain" />
              ) : (
                <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                  No image for this category
                </Typography>
              )}
            </Box>
          </Box>

          {/* Details */}
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: COLORS.textPrimary }}>{title}</Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
              <span className={`px-2 py-1 rounded-md text-xs font-semibold ${getStatusBadgeCls(item.itemStatus)}`}>
                Status: {themeStatusLabel(item.itemStatus)}
              </span>
              <MuiChip label={`Stored At: ${labelOrDash(item.storedAt)}`} size="small" sx={STATUS_CHIP_SX} />
              <MuiChip label={`Qty: ${labelOrDash(item.quantity)}`} size="small" sx={STATUS_CHIP_SX} />
              <MuiChip label={`Updated: ${formatDate(item.lastUpdated)}`} size="small" sx={STATUS_CHIP_SX} />
            </Box>

            <Divider sx={{ my: 2.5 }} />

            <Typography variant="body2" fontWeight={700} sx={{ color: COLORS.textPrimary, mb: 1.5 }}>
              Item Type Details
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Row label="School" value={school.schoolName} />
              <Row label="Category" value={category.categoryName} />
              <RowCustom
                label="Primary Colour"
                right={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ColorSwatch hex={primaryHex} title={labelOrDash(primaryColour.colourName)} />
                    <Typography variant="body2" sx={{ color: COLORS.textPrimary }}>{labelOrDash(primaryColour.colourName)}</Typography>
                  </Box>
                }
              />
              <RowCustom
                label="Secondary Colour"
                right={
                  secondaryColour?.colourName ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ColorSwatch hex={secondaryHex} title={labelOrDash(secondaryColour.colourName)} />
                      <Typography variant="body2" sx={{ color: COLORS.textPrimary }}>{labelOrDash(secondaryColour.colourName)}</Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: COLORS.textPrimary }}>—</Typography>
                  )
                }
              />
              <Row label="Pattern" value={pattern.patternName} />
              <Row label="Material" value={material.materialName} />
              <Row label="Gender" value={itemType.gender} />
              <Row label="Size" value={sizeOption.sizeName} />
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 3 }}>
      <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>{label}</Typography>
      <Typography variant="body2" sx={{ color: COLORS.textPrimary, textAlign: 'right' }}>{labelOrDash(value)}</Typography>
    </Box>
  );
}

function RowCustom({ label, right }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 3 }}>
      <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>{label}</Typography>
      <Box sx={{ textAlign: 'right' }}>{right}</Box>
    </Box>
  );
}