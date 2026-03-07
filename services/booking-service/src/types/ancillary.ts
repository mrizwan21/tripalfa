export type ServiceType =
    | "baggage"
    | "meal"
    | "seat"
    | "special_request"
    | "lounge"
    | "insurance";

export interface Service {
    id: string;
    type: ServiceType;
    productName: string;
    description: string;
    baseAmount: string;
    currency: string;
    segmentIds: string[];
    passengerIds: string[];
    maximumQuantity: number;
    restrictions?: {
        minQuantity: number;
        maxQuantity: number;
        passengers?: string[];
        segments?: string[];
    };
}

export interface ServiceCategory {
    type: ServiceType;
    name: string;
    description: string;
    icon?: string;
    applicableSegments: "all" | "outbound" | "return" | "specific";
    applicablePassengers: "all" | "specific";
    maxQuantityPerPassenger: number;
}
