export function isEmail(v?:string) {
  if (!v) return false;
  const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  return re.test(v);
}

export function isCardNumber(v?:string) {
  if (!v) return false;
  return /^[0-9]{13,19}$/.test(v);
}

export function isCVV(v?:string) {
  if (!v) return false;
  return /^[0-9]{3,4}$/.test(v);
}
