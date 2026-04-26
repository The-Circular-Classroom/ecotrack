

const STATUS_LABELS = {
  GeneralOffice: 'General Office',
  ForSale: 'For Sale',
  Sold: 'Sold',
  ForRepurpose: 'For Repurpose',
  Repurposed: 'Repurposed',
  Disposed: 'Disposed',
};

const LOCATION_LABELS = {
  School: 'School',
  TCC: 'TCC',
  Exited: 'Exited',
};

const TRANSACTION_TYPE_LABELS = {
  DonationIn: 'Donation In',
  Transfer: 'Transfer',
  StatusChange: 'Status Change',
  Sale: 'Sale',
  Repurposing: 'Repurposing',
  Disposal: 'Disposal',
};

const USER_ROLE_LABELS = {
  Admin: 'Admin',
  SchoolStaff: 'School Staff',
  Parent: 'Parent',
  PsgVolunteer: 'PSG Volunteer',
};

const GENDER_LABELS = {
  Unisex: 'Unisex',
  Male: 'Male',
  Female: 'Female',
};

const SIZE_TYPE_LABELS = {
  Alphabetical: 'Alphabetical',
  Numerical: 'Numerical',
  OneSize: 'One Size',
};

const SIZE_CLASS_LABELS = {
  S: 'Small',
  L: 'Large',
};

const formatEnum = (value, labelMap) => {
    if (!value) return null;
    return labelMap[value] || value;
};

module.exports = {
  STATUS_LABELS,
  LOCATION_LABELS,
  TRANSACTION_TYPE_LABELS,
  USER_ROLE_LABELS,
  GENDER_LABELS,
  SIZE_TYPE_LABELS,
  SIZE_CLASS_LABELS,
  formatEnum,
};