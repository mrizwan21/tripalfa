import type { MarkupRule } from '../types';

interface MarkupParams {
  hotelStars?: number;
  destinationCode?: string;
}

export function calculateStackedMarkup(
  basePrice: number,
  rules: MarkupRule[],
  params: MarkupParams
): { totalMarkup: number } {
  // Filter rules that match the hotel criteria
  const applicableRules = rules.filter(rule => {
    if (!rule.isActive) return false;
    
    // Check hotel stars match (if rule specifies)
    if (rule.hotelStars !== undefined && params.hotelStars !== undefined) {
      if (rule.hotelStars !== params.hotelStars) return false;
    }
    
    // Check destination match (if rule specifies)
    if (rule.destinationCode && params.destinationCode) {
      if (rule.destinationCode !== params.destinationCode) return false;
    }
    
    return true;
  });

  // Calculate total markup
  let totalMarkup = 0;
  for (const rule of applicableRules) {
    if (rule.valueType === 'FIXED') {
      totalMarkup += rule.value;
    } else {
      // PERCENTAGE
      totalMarkup += (basePrice * rule.value) / 100;
    }
  }

  return { totalMarkup };
}
