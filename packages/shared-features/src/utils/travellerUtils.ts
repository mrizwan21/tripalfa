import type { TravellerProfile } from '../types';

export function filterTravellers(
  travellers: TravellerProfile[],
  searchTerm: string,
  filterType?: 'Adult' | 'Child' | 'Infant'
): TravellerProfile[] {
  return travellers.filter(traveller => {
    // Filter by type if specified
    if (filterType && traveller.type !== filterType) {
      return false;
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const fullName = `${traveller.firstName} ${traveller.lastName}`.toLowerCase();
      const passport = traveller.passportNumber?.toLowerCase() || '';
      const email = traveller.email?.toLowerCase() || '';

      return fullName.includes(term) || passport.includes(term) || email.includes(term);
    }

    return true;
  });
}