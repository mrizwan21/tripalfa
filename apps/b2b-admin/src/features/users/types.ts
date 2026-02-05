export type UserType = 'staff' | 'b2c' | 'b2b_subagent';

export interface Address {
    street: string;
    country: string;
    state: string;
    city: string;
    suburb?: string;
    postCode: string;
}

export interface EmergencyContact {
    name: string;
    relation: string;
    phone: string;
    mobile: string;
    email: string;
}

export interface PassportDetail {
    id: string;
    passportNo: string;
    dob: string;
    nationality: string;
    issuingCountry: string;
    placeOfIssue: string;
    expiry: string;
    isPrimary: boolean;
    status: 'ACTIVE' | 'EXPIRED' | 'ABOUT_TO_EXPIRE';
}

export interface VisaDetail {
    id: string;
    visaNo: string;
    country: string;
    type: string;
    dateOfIssue: string;
    dateOfExpiry: string;
    remarks?: string;
}

export interface LoyaltyProgram {
    id: string;
    provider: string; // Airline name or Hotel chain
    type: 'AIRLINE' | 'HOTEL' | 'CAR';
    membershipNumber: string;
    expiryDate?: string;
}

export interface TravelPreferences {
    flight: {
        seatPreference: 'AISLE' | 'WINDOW' | 'NONE';
        mealPreference?: string;
        classPreference: 'ECONOMY' | 'BUSINESS' | 'FIRST' | 'PREMIUM_ECONOMY';
        preferredAirlines: string[];
        tsaPrecheck?: string;
    };
    hotel: {
        roomPreference: 'KING' | 'QUEEN' | 'DOUBLE' | 'TWIN' | 'SINGLE';
        smokingPreference: 'SMOKING' | 'NON_SMOKING';
        starRating: number;
        facilities: string[];
    };
    car: {
        carType?: string;
        preferredCompany?: string;
    };
}

export interface UserDocument {
    id: string;
    title: string;
    fileUrl: string;
    uploadDate: string;
    fileType: string;
}

export interface PaymentCard {
    id: string;
    cardName: string;
    type: 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER';
    nameOnCard: string;
    cardNumberMasked: string;
    expiry: string;
}

export interface Dependent {
    id: string;
    firstName: string;
    lastName: string;
    relation: string;
    gender: 'MALE' | 'FEMALE' | 'NON_BINARY';
    dob: string;
    email?: string;
    phone?: string;
    status: 'ACTIVE' | 'INACTIVE';
    passportNo?: string;
}

export interface AssociatedClient {
    id: string;
    name: string;
    email: string;
    status: 'ACTIVE' | 'INACTIVE';
    relation: string;
    associatedDate: string;
}

export interface UserProfile {
    id: string;
    userType: UserType;
    email: string;
    phone: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    preferredName?: string;
    gender: 'MALE' | 'FEMALE' | 'NON_BINARY';
    dob: string;
    avatar?: string;
    status: 'active' | 'inactive' | 'pending';
    createdAt: string;

    homeAddress?: Address;
    businessAddress?: Address;
    deliveryAddress?: Address;
    emergencyContact?: EmergencyContact;

    passports: PassportDetail[];
    visas: VisaDetail[];
    loyaltyPrograms: LoyaltyProgram[];
    paymentCards: PaymentCard[];
    preferences: TravelPreferences;
    documents: UserDocument[];
    dependents?: Dependent[];
    associatedClients?: AssociatedClient[];
    feedbacks?: any[];
}
