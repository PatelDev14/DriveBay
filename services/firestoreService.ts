import {
    getDocs,
    collection,
    query,
    where,
    addDoc,
    Timestamp,
    orderBy,
    deleteDoc,
    doc,
    updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Listing, Booking } from '../types';

// Helper to convert Firestore doc to our Listing type
const docToListing = (doc: any): Listing => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
    } as Listing;
};

// Helper to convert Firestore doc to our Booking type
const docToBooking = (doc: any): Booking => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
    } as Booking;
};

export const getMarketplaceListings = async (): Promise<Listing[]> => {
    try {
        const listingsCol = collection(db, 'listings');
        // Order by date to show newest first
        const q = query(listingsCol, orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(docToListing);
    } catch (error) {
        console.error("Error fetching listings:", error);
        return [];
    }
};

export const getUserBookings = async (userId: string): Promise<Booking[]> => {
    try {
        const bookingsCol = collection(db, 'bookings');
        const q = query(bookingsCol, where('userId', '==', userId), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(docToBooking);
    } catch (error) {
        console.error("Error fetching user bookings:", error);
        return [];
    }
};

export const getBookingRequestsForOwner = async (ownerId: string): Promise<Booking[]> => {
    try {
        const bookingsCol = collection(db, 'bookings');
        // This query avoids needing a composite index by fetching and then sorting on the client.
        const q = query(bookingsCol, where('ownerId', '==', ownerId), where('status', '==', 'pending'));
        const querySnapshot = await getDocs(q);
        const requests = querySnapshot.docs.map(docToBooking);

        // Sort by creation time client-side
        requests.sort((a, b) => {
            const timeA = a.createdAt?.toMillis() || 0;
            const timeB = b.createdAt?.toMillis() || 0;
            return timeA - timeB; // Ascending (oldest first)
        });

        return requests;
    } catch (error) {
        console.error("Error fetching booking requests for owner:", error);
        return [];
    }
};

export const getExistingBookingsForListing = async (listingId: string, date: string): Promise<Booking[]> => {
     try {
        const bookingsCol = collection(db, 'bookings');
        const q = query(
            bookingsCol,
            where('listingId', '==', listingId),
            where('date', '==', date)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(docToBooking);
    } catch (error) {
        console.error("Error fetching existing bookings:", error);
        return [];
    }
};

// New function to check for duplicate listings
export const checkForExistingListing = async (listingData: Omit<Listing, 'id'>): Promise<Listing[]> => {
    try {
        const listingsCol = collection(db, 'listings');
        const q = query(
            listingsCol,
            where('address', '==', listingData.address),
            where('city', '==', listingData.city),
            where('zipCode', '==', listingData.zipCode),
            where('date', '==', listingData.date)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(docToListing);
    } catch (error) {
        console.error("Error checking for existing listing:", error);
        return [];
    }
}

export const addListingToFirestore = async (listingData: Omit<Listing, 'id'>): Promise<Listing> => {
    const docRef = await addDoc(collection(db, 'listings'), {
        ...listingData,
        createdAt: Timestamp.now(), // Add a timestamp for better data management
    });
    return { id: docRef.id, ...listingData };
};

export const updateListingInFirestore = async (listingId: string, listingData: Partial<Omit<Listing, 'id' | 'ownerId'>>): Promise<void> => {
    try {
        const listingRef = doc(db, 'listings', listingId);
        await updateDoc(listingRef, {
            ...listingData,
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error("Error updating listing in Firestore:", error);
        throw error;
    }
};

export const addBookingToFirestore = async (bookingData: Omit<Booking, 'id'>): Promise<Booking> => {
    const timestamp = Timestamp.now();
    const fullBookingData = {
        ...bookingData,
        createdAt: timestamp,
    };
    const docRef = await addDoc(collection(db, 'bookings'), fullBookingData);
    return { id: docRef.id, ...fullBookingData };
};

export const updateBookingStatusInFirestore = async (bookingId: string, status: Booking['status']): Promise<void> => {
    try {
        const bookingRef = doc(db, 'bookings', bookingId);
        await updateDoc(bookingRef, { status });
    } catch (error) {
        console.error("Error updating booking status:", error);
        throw error;
    }
};


export const deleteBookingFromFirestore = async (bookingId: string): Promise<void> => {
    try {
        const bookingRef = doc(db, 'bookings', bookingId);
        await deleteDoc(bookingRef);
    } catch (error) {
        console.error("Error deleting booking from Firestore:", error);
        throw error; // Re-throw to be handled by the caller
    }
};