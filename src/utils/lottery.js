export const BET_TYPES = {
  '3_top': { label: '3 ตัวบน', payoutRate: 500 },
  '3_tod': { label: '3 ตัวโต๊ด', payoutRate: 120 },
  '2_top': { label: '2 ตัวบน', payoutRate: 90 },
  '2_bottom': { label: '2 ตัวล่าง', payoutRate: 90 },
  'run_top': { label: 'วิ่งบน', payoutRate: 3.2 },
  'run_bottom': { label: 'วิ่งล่าง', payoutRate: 4.2 }
};

export function formatCurrency(amount) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(amount);
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

export function validateNumber(number, betType) {
  if (betType.startsWith('3_')) {
    return /^\d{3}$/.test(number);
  } else if (betType.startsWith('2_')) {
    return /^\d{2}$/.test(number);
  } else if (betType.startsWith('run_')) {
    return /^\d{1}$/.test(number);
  }
  return false;
}
