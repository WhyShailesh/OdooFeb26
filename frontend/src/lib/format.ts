/**
 * Indian localization: INR currency, DD-MM-YYYY, IST, cities, vehicle types
 */

export const INDIAN_CITIES = ['Ahmedabad', 'Mumbai', 'Delhi', 'Surat', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Jaipur'] as const;

export const VEHICLE_TYPES_INDIA = ['Bike', 'Scooter', 'Auto', 'Van', 'Truck'] as const;

/** Indian number format: ₹1,00,000 (lakh style) */
export function formatINR(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '₹0';
  const abs = Math.abs(value);
  const whole = Math.floor(abs);
  const parts: string[] = [];
  let n = whole;
  let first = true;
  while (n > 0 || first) {
    first = false;
    const chunk = n % 1000;
    n = Math.floor(n / 1000);
    parts.unshift(n > 0 ? chunk.toString().padStart(3, '0') : chunk.toString());
  }
  const str = (value < 0 ? '-' : '') + (parts.join(',') || '0');
  return `₹${str}`;
}

/** Date in Indian format DD-MM-YYYY */
export function formatDateIN(date: Date | string | null | undefined): string {
  if (date == null) return '--';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '--';
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/** Date and time in IST (DD-MM-YYYY, HH:MM) */
export function formatDateTimeIST(date: Date | string | null | undefined): string {
  if (date == null) return '--';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '--';
  const ist = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = ist.getDate().toString().padStart(2, '0');
  const month = (ist.getMonth() + 1).toString().padStart(2, '0');
  const year = ist.getFullYear();
  const h = ist.getHours().toString().padStart(2, '0');
  const m = ist.getMinutes().toString().padStart(2, '0');
  return `${day}-${month}-${year}, ${h}:${m} IST`;
}

export function toIST(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}
