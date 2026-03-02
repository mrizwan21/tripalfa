/**
 * Duffel Seat Maps API v2 Types
 *
 * Based on Duffel API documentation:
 * https://duffel.com/docs/api/v2/seat-maps/get-seat-maps
 *
 * A seat map includes the data for rendering seats in the relevant cabins,
 * along with their total cost and other information such as disclosures.
 */

// ============================================================================
// SEAT SERVICE TYPES
// ============================================================================

/**
 * A bookable seat is a special kind of service.
 * Only one seat can be booked per passenger, per segment.
 */
export interface DuffelSeatService {
  /** Duffel's unique identifier for the seat service */
  id: string;
  /** The passenger that this seat is for */
  passenger_id: string;
  /** The total price of the seat, including taxes */
  total_amount: string;
  /** The currency of the total_amount (ISO 4217) */
  total_currency: string;
}

// ============================================================================
// CABIN ROW SECTION ELEMENT TYPES
// ============================================================================

/** Element type union */
export type DuffelElementType =
  | "seat"
  | "empty"
  | "bassinet"
  | "exit_row"
  | "lavatory"
  | "galley"
  | "closet"
  | "stairs"
  | "restricted_seat_general";

/**
 * Base element interface
 */
export interface DuffelBaseElement {
  type: DuffelElementType;
}

/**
 * A seat for a passenger.
 * If the available_services list is empty ([]), the seat is unavailable.
 *
 * Display: All seats should be displayed with the same static width.
 */
export interface DuffelSeatElement extends DuffelBaseElement {
  type: "seat";
  /** The designator used to uniquely identify the seat (e.g., "14B") */
  designator: string;
  /** A name describing the type of seat (e.g., "Exit row seat") */
  name: string | null;
  /** Terms, conditions or restrictions for this seat */
  disclosures: string[];
  /**
   * Seats are considered a special kind of service.
   * There will be at most one service per seat per passenger.
   * A seat can only be booked for one passenger.
   * If empty ([]), the seat is unavailable.
   */
  available_services: DuffelSeatService[];
}

/**
 * A bassinet is a child's cradle.
 * This element will be aligned with the corresponding seat in the following row.
 *
 * Display: Should have the same width as a seat for proper alignment.
 */
export interface DuffelBassinetElement extends DuffelBaseElement {
  type: "bassinet";
}

/**
 * An empty space used for padding in some non-standard seat arrangements.
 *
 * Display: Should have the same dimensions as a seat for proper alignment.
 */
export interface DuffelEmptyElement extends DuffelBaseElement {
  type: "empty";
}

/**
 * An exit row represents the extra wide space used to reach aircraft exits,
 * and indicates the existence of an exit door.
 *
 * Display: Should ideally fill or shrink to available space in a row section.
 * Displaying it with the same width as seat is also reasonable.
 */
export interface DuffelExitRowElement extends DuffelBaseElement {
  type: "exit_row";
}

/**
 * A lavatory for use by passengers.
 *
 * Display: Should ideally fill or shrink to available space in a row section.
 */
export interface DuffelLavatoryElement extends DuffelBaseElement {
  type: "lavatory";
}

/**
 * A galley is the compartment where food is cooked or prepared.
 * Conventionally marked with a teacup symbol.
 *
 * Display: Should ideally fill or shrink to available space in a row section.
 */
export interface DuffelGalleyElement extends DuffelBaseElement {
  type: "galley";
}

/**
 * A closet used for storage.
 * Conventionally marked with a clothes hanger symbol.
 *
 * Display: Should ideally fill or shrink to available space in a row section.
 */
export interface DuffelClosetElement extends DuffelBaseElement {
  type: "closet";
}

/**
 * A set of stairs to another deck.
 *
 * Display: Should ideally fill or shrink to available space in a row section.
 */
export interface DuffelStairsElement extends DuffelBaseElement {
  type: "stairs";
}

/**
 * A seat with restrictions on who can book it.
 *
 * Display: Should ideally fill or shrink to available space in a row section.
 */
export interface DuffelRestrictedSeatElement extends DuffelBaseElement {
  type: "restricted_seat_general";
}

/**
 * Union type for all cabin row section elements
 */
export type DuffelCabinRowSectionElement =
  | DuffelSeatElement
  | DuffelBassinetElement
  | DuffelEmptyElement
  | DuffelExitRowElement
  | DuffelLavatoryElement
  | DuffelGalleyElement
  | DuffelClosetElement
  | DuffelStairsElement
  | DuffelRestrictedSeatElement;

// ============================================================================
// CABIN ROW TYPES
// ============================================================================

/**
 * A section within a row that contains a list of row elements.
 * This corresponds to a left, middle, or right lengthwise section of the aircraft.
 */
export interface DuffelCabinRowSection {
  /** The elements that make up this section */
  elements: DuffelCabinRowSectionElement[];
}

/**
 * A cabin row has one or more sections, each made up of elements.
 * An element is something that takes up physical space such as a seat or an empty area.
 */
export interface DuffelCabinRow {
  /**
   * A list of sections.
   * Each row is divided into sections by one or more aisles.
   */
  sections: DuffelCabinRowSection[];
}

// ============================================================================
// WING POSITION TYPES
// ============================================================================

/**
 * Where the wings of the aircraft are in relation to rows in the cabin.
 * The numbers correspond to the indices of the first and the last row which are overwing.
 */
export interface DuffelWingPosition {
  /** The index of the first row which is overwing, starting from the front of the aircraft */
  first_row_index: number;
  /** The index of the last row which is overwing, starting from the front of the aircraft */
  last_row_index: number;
}

// ============================================================================
// CABIN TYPES
// ============================================================================

/** Cabin class enum */
export type DuffelCabinClass =
  | "first"
  | "business"
  | "premium_economy"
  | "economy";

/**
 * A cabin is a physical section of an aircraft that passengers travel in.
 * The cabin that a passenger travels in will depend on the fare they paid
 * (for example an economy cabin versus a business class cabin).
 */
export interface DuffelCabin {
  /**
   * The number of aisles in this cabin.
   * If 1, each row is split into two sections.
   * If 2, each row is split into three sections.
   */
  aisles: 1 | 2;
  /** The cabin class that the passenger will travel in on this segment */
  cabin_class: DuffelCabinClass | null;
  /**
   * Level 0 is the main deck and level 1 is the upper deck above that,
   * which is found on some large aircraft.
   */
  deck: 0 | 1;
  /**
   * A list of rows in this cabin.
   * Row sections are broken up by aisles.
   * Rows are ordered from front to back of the aircraft.
   */
  rows: DuffelCabinRow[];
  /**
   * Where the wings of the aircraft are in relation to rows in the cabin.
   * Null when no rows of the cabin are overwing.
   */
  wings?: DuffelWingPosition | null;
}

// ============================================================================
// SEAT MAP TYPES
// ============================================================================

/**
 * A seat map for a specific segment.
 * Each seat map is for a specific segment.
 */
export interface DuffelSeatMap {
  /** Duffel's unique identifier for the seat map */
  id: string;
  /** Duffel's unique identifier for the slice */
  slice_id: string;
  /** Duffel's unique identifier for the segment */
  segment_id: string;
  /**
   * The list of cabins in this seat map.
   * Cabins are ordered by deck from lowest to highest, and then within
   * each deck from the front to back of the aircraft.
   */
  cabins: DuffelCabin[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Response from GET /air/seat_maps
 */
export interface DuffelGetSeatMapsResponse {
  /** List of seat maps, one per segment */
  data: DuffelSeatMap[];
}

// ============================================================================
// HELPER TYPES FOR UI RENDERING
// ============================================================================

/**
 * Flattened seat for UI rendering
 */
export interface FlattenedSeat {
  /** Seat designator (e.g., "14B") */
  designator: string;
  /** Whether the seat is available */
  available: boolean;
  /** Price amount (if available) */
  price: number | null;
  /** Currency (if available) */
  currency: string | null;
  /** Service ID for booking (if available) */
  serviceId: string | null;
  /** Passenger ID this seat is available for */
  passengerId: string | null;
  /** Seat name/type (e.g., "Exit row seat") */
  name: string | null;
  /** Disclosures/restrictions */
  disclosures: string[];
  /** Whether this is an exit row */
  isExitRow: boolean;
  /** Whether this seat is over the wing */
  isOverWing: boolean;
  /** Row number */
  rowNumber: number;
  /** Column letter */
  columnLetter: string;
  /** Section index (0 = left, 1 = middle, 2 = right) */
  sectionIndex: number;
  /** Element index within section */
  elementIndex: number;
}

/**
 * Processed seat map for UI rendering
 */
export interface ProcessedSeatMap {
  /** Original Duffel seat map */
  raw: DuffelSeatMap;
  /** Segment ID */
  segmentId: string;
  /** Slice ID */
  sliceId: string;
  /** Flattened seats for easy rendering */
  seats: FlattenedSeat[];
  /** Cabin class */
  cabinClass: DuffelCabinClass | null;
  /** Number of aisles */
  aisles: number;
  /** Deck number */
  deck: number;
  /** Total rows */
  totalRows: number;
  /** Wing position info */
  wings: DuffelWingPosition | null;
}

// ============================================================================
// SEAT SELECTION TYPES
// ============================================================================

/**
 * Selected seat for booking
 */
export interface SelectedSeatForBooking {
  /** Seat designator */
  designator: string;
  /** Passenger ID */
  passengerId: string;
  /** Segment ID */
  segmentId: string;
  /** Service ID from available_services */
  serviceId: string;
  /** Price */
  price: number;
  /** Currency */
  currency: string;
}

/**
 * Seat selection request payload
 */
export interface SeatSelectionPayload {
  /** Offer ID */
  offer_id: string;
  /** Selected seats */
  seats: SelectedSeatForBooking[];
  /** Passengers (for context) */
  passengers?: Array<{
    id: string;
    given_name: string;
    family_name: string;
  }>;
}
