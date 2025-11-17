import { Timestamp } from 'firebase/firestore';

export interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    phoneNumber?: string | null;
}

export interface Booking {
    id: string;
    listingId: string;
    userId: string;
    bookerName: string;
    bookerEmail: string;
    ownerId: string; // ID of the driveway owner
    ownerEmail: string; // Contact email of the driveway owner
    location: string;
    date: string;
    startTime: string;
    endTime: string;
    rate: number;
    status: 'pending' | 'confirmed' | 'denied' | 'canceled_by_user' | 'canceled_by_owner';
    createdAt?: Timestamp;
}

export interface Listing {
    id: string;
    ownerId: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    rate: number;
    date: string;
    startTime: string;
    endTime: string;
    contactEmail: string;
    description: string;
}

export type ChatRole = 'user' | 'model' | 'system';

export interface ChatMessage {
    role: ChatRole;
    content: string; // Can be a plain string or a JSON string of ParkingResults
    timestamp: string;
}

// Type for structured data from Gemini API
export interface ParkingLocation {
    name: string;
    address: string;
    details: string; // e.g., rate, availability
    listingId?: string; // ID for our marketplace listings
    website?: string; // URL for web results
}

export interface ParkingResults {
    marketplaceResults: ParkingLocation[];
    webResults: ParkingLocation[];
}

// The 'marketplace' view is removed for a more streamlined UX.
export type View = 'chat' | 'profile';