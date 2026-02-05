export function roomTotal(original:number, tax:number, commission:number, nights:number, qty:number) {
  const perNight = original + (tax || 0) + (commission || 0);
  return perNight * nights * qty;
}

export function formatMoney(amount:number, currency='USD') {
  return currency + ' ' + amount.toFixed(2);
}
