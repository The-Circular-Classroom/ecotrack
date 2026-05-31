export const CORE_GROUP_STATUSES = ['ForSale', 'GeneralOffice', 'ForRepurpose', 'Disposed'];

export function mapToCoreCategoryGroup(itemStatus) {
  switch (itemStatus) {
    case 'GeneralOffice':
      return 'schoolStock';
    case 'ForSale':
      return 'psg';
    case 'ForRepurpose':
      return 'repurposing';
    case 'Disposed':
      return 'waste';
    default:
      return null;
  }
}

export function emptyCoreGroups() {
  return { schoolStock: 0, psg: 0, repurposing: 0, waste: 0 };
}

export function parsePositiveInteger(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
}

export function decimalToNumber(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

export function parseDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}