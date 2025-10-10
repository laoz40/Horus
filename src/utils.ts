// Date and string utilities
export const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Turn a Date into a short, friendly string like "20 Sep, 2025".
export const formatDisplayDate = (d: Date) => {
  const dd = String(d.getDate());
  const mon = monthsShort[d.getMonth()];
  const yyyy = d.getFullYear();
  return `${dd} ${mon}, ${yyyy}`;
};

// Make text safe to insert into innerHTML (prevents broken HTML and XSS).
export const esc = (s: string) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');
