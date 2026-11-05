export function formatNPR(amount: number | null | undefined, symbol: string = 'रु'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Price on request';
  }
  // Nepali / South Asian numbering format: 1,00,000
  const parts = Math.round(amount).toString();
  let lastThree = parts.substring(parts.length - 3);
  const otherNumbers = parts.substring(0, parts.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return `${symbol} ${formatted}`;
}

export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
