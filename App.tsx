import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import ChatView from './components/ChatView';
import ProfileView from './components/ProfileView';
import Header from './components/Header';
import Toast from './components/Toast';
import LoginView from './components/LoginView';
import { Listing, User, Booking, View, ChatMessage } from './types';
import { 
    generateBookingConfirmationEmails, 
    generateListingConfirmationEmail, 
    generateBookingCancellationEmails,
    generateBookingRequestEmail,
    generateBookingDeniedEmail,
    generateListingUpdateCancellationEmail
} from './services/geminiService';
import { 
    getMarketplaceListings, 
    getUserBookings, 
    addListingToFirestore, 
    addBookingToFirestore, 
    getExistingBookingsForListing, 
    deleteBookingFromFirestore, 
    checkForExistingListing, 
    updateListingInFirestore,
    getBookingRequestsForOwner,
    updateBookingStatusInFirestore,
} from './services/firestoreService';
import { sendEmail } from './services/emailService';

// Helper function to convert HH:MM string to minutes since midnight for reliable comparison.
const timeToMinutes = (timeStr: string): number => {
    if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr)) return NaN;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return NaN;
    }
    return hours * 60 + minutes;
};


const App: React.FC = () => {
    const [view, setView] = useState<View>('chat');
    const [listings, setListings] = useState<Listing[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [bookingRequests, setBookingRequests] = useState<Booking[]>([]); // For owners
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                const user: User = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || 'User',
                    email: firebaseUser.email || 'No email provided',
                    avatarUrl: firebaseUser.photoURL || undefined,
                    phoneNumber: firebaseUser.phoneNumber || null,
                };
                setCurrentUser(user);

                const storedMessages = localStorage.getItem(`parkpulse-chat-${user.id}`);
                setMessages(storedMessages ? JSON.parse(storedMessages) : []);

                const [marketplaceListings, userBookings, ownerRequests] = await Promise.all([
                    getMarketplaceListings(),
                    getUserBookings(firebaseUser.uid),
                    getBookingRequestsForOwner(firebaseUser.uid)
                ]);
                setListings(marketplaceListings);
                setBookings(userBookings);
                setBookingRequests(ownerRequests);
            } else {
                setCurrentUser(null);
                setListings([]);
                setBookings([]);
                setBookingRequests([]);
                setMessages([]);
            }
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        if (currentUser) {
            localStorage.setItem(`parkpulse-chat-${currentUser.id}`, JSON.stringify(messages));
        }
    }, [messages, currentUser]);


    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };
    
    const addSystemChatMessage = (content: string) => {
        const systemMessage: ChatMessage = { role: 'system', content, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, systemMessage]);
    };

    const addListing = async (listingData: Omit<Listing, 'id' | 'ownerId'>) => {
        if (!currentUser) {
            showToast("You must be logged in to list a driveway.", "error");
            return;
        }

        try {
            const newListingData = {
                ownerId: currentUser.id,
                ...listingData,
            };

            const potentialDuplicates = await checkForExistingListing(newListingData);
            const isDuplicate = potentialDuplicates.some(existing => {
                return newListingData.startTime < existing.endTime && newListingData.endTime > existing.startTime;
            });

            if (isDuplicate) {
                showToast("A listing with this address and overlapping times already exists.", "error");
                throw new Error("Duplicate listing detected");
            }
            
            const newListing = await addListingToFirestore(newListingData);
            setListings(prev => [newListing, ...prev]);
            showToast("Your driveway has been listed successfully!");

            const email = await generateListingConfirmationEmail(newListing, currentUser.name);
            sendEmail(newListing.contactEmail, email.subject, email.emailContent);

        } catch (error: any) {
            console.error("Error adding listing:", error);
            if (error.message !== "Duplicate listing detected") {
                showToast("Failed to list your driveway. Please try again.", "error");
            }
            throw error;
        }
    };

    const updateListing = async (listingId: string, listingData: Omit<Listing, 'id' | 'ownerId'>) => {
         if (!currentUser) {
            showToast("You must be logged in to update a listing.", "error");
            return;
        }
        try {
            // --- Logic to cancel conflicting bookings ---
            const existingBookings = await getExistingBookingsForListing(listingId, listingData.date);
            for (const booking of existingBookings) {
                const isConflict = listingData.date !== booking.date || booking.startTime < listingData.startTime || booking.endTime > listingData.endTime;
                if (isConflict && (booking.status === 'confirmed' || booking.status === 'pending')) {
                    await cancelBookingByOwner(booking);
                }
            }
            
            await updateListingInFirestore(listingId, listingData);
            setListings(prevListings => 
                prevListings.map(l => l.id === listingId ? { ...l, ...listingData } : l)
            );
            showToast("Listing updated successfully!", "success");
        } catch (error) {
            console.error("Error updating listing:", error);
            showToast("Failed to update listing. Please try again.", "error");
            throw error;
        }
    };
    
    const requestBooking = async (listing: Listing, startTime: string, endTime: string) => {
        if (!currentUser || !currentUser.email) {
            showToast("Please log in to book a driveway.", "error");
            throw new Error("User not logged in or email not available");
        }

        const fullLocation = `${listing.address}, ${listing.city}, ${listing.state} ${listing.zipCode}`;

        try {
            // REMOVED: Client-side conflict check is not possible due to Firestore security rules
            // that protect user privacy. The definitive check is now done by the owner upon approval.

            const newRequestStartMinutes = timeToMinutes(startTime);
            const newRequestEndMinutes = timeToMinutes(endTime);

            if (isNaN(newRequestStartMinutes) || isNaN(newRequestEndMinutes)) {
                showToast("Invalid time format submitted.", "error");
                throw new Error("Invalid time format");
            }
            
            const newBookingData: Omit<Booking, 'id'> = {
                listingId: listing.id,
                userId: currentUser.id,
                bookerName: currentUser.name,
                bookerEmail: currentUser.email,
                ownerId: listing.ownerId,
                ownerEmail: listing.contactEmail,
                location: fullLocation,
                date: listing.date,
                startTime: startTime,
                endTime: endTime,
                rate: listing.rate,
                status: 'pending',
            };

            const newBooking = await addBookingToFirestore(newBookingData);
            setBookings(prev => [newBooking, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
            
            // If the current user is the owner, add to their requests list in real-time
            if (currentUser && listing.ownerId === currentUser.id) {
                setBookingRequests(prev => [newBooking, ...prev].sort((a, b) => {
                    const timeA = a.createdAt?.toMillis() || 0;
                    const timeB = b.createdAt?.toMillis() || 0;
                    return timeA - timeB;
                }));
            }

            const email = await generateBookingRequestEmail(newBooking);
            sendEmail(listing.contactEmail, email.subject, email.body);

            showToast(`Request sent for ${fullLocation}!`);
            addSystemChatMessage(`I've sent your booking request for **${fullLocation}** on **${listing.date} from ${startTime} to ${endTime}**. You'll be notified when the owner responds. You can check the status in your dashboard.`);

        } catch (error: any) {
            console.error("Booking request failed:", error);
            showToast("Sorry, something went wrong with the booking request.", "error");
            throw error;
        }
    };

    const approveBooking = async (booking: Booking) => {
        try {
             // --- New: Conflict check before approving ---
            const allBookingsForListing = await getExistingBookingsForListing(booking.listingId, booking.date);
            const confirmedBookings = allBookingsForListing.filter(b => b.status === 'confirmed');

            const requestStartMinutes = timeToMinutes(booking.startTime);
            const requestEndMinutes = timeToMinutes(booking.endTime);

            const isConflict = confirmedBookings.some(confirmedBooking => {
                const existingStartMinutes = timeToMinutes(confirmedBooking.startTime);
                const existingEndMinutes = timeToMinutes(confirmedBooking.endTime);
                 if (isNaN(existingStartMinutes) || isNaN(existingEndMinutes)) {
                    return false;
                }
                // Check for overlap
                return requestStartMinutes < existingEndMinutes && requestEndMinutes > existingStartMinutes;
            });

            if (isConflict) {
                showToast("Approval failed: Conflicts with an existing confirmed booking.", "error");
                return;
            }
            // --- End of new logic ---

            await updateBookingStatusInFirestore(booking.id, 'confirmed');
            const updatedBooking = { ...booking, status: 'confirmed' as const };
            
            // Update local state
            setBookings(prev => prev.map(b => b.id === booking.id ? updatedBooking : b));
            setBookingRequests(prev => prev.filter(b => b.id !== booking.id));

            const emails = await generateBookingConfirmationEmails({
                bookerName: booking.bookerName,
                ownerEmail: booking.ownerEmail,
                location: booking.location,
                date: booking.date,
                startTime: booking.startTime,
                endTime: booking.endTime,
                rate: booking.rate
            });

            // As the owner, you are emailing the booker.
            sendEmail(booking.bookerEmail, emails.bookerSubject, emails.bookerEmailContent);
            
            showToast("Booking approved and confirmed!", "success");

        } catch (error) {
            console.error("Error approving booking:", error);
            showToast("Failed to approve booking.", "error");
        }
    };

    const denyBooking = async (booking: Booking) => {
        try {
            await updateBookingStatusInFirestore(booking.id, 'denied');
            const updatedBooking = { ...booking, status: 'denied' as const };
            
            setBookings(prev => prev.map(b => b.id === booking.id ? updatedBooking : b));
            setBookingRequests(prev => prev.filter(b => b.id !== booking.id));
            
            const email = await generateBookingDeniedEmail(booking);
            sendEmail(booking.bookerEmail, email.subject, email.body);

            showToast("Booking request denied.", "success");

        } catch (error) {
            console.error("Error denying booking:", error);
            showToast("Failed to deny booking request.", "error");
        }
    };

    const cancelBookingByUser = async (booking: Booking) => {
        if (!currentUser || !currentUser.email) {
             showToast("You must be logged in to cancel a booking.", "error");
            return;
        }
        try {
            await updateBookingStatusInFirestore(booking.id, 'canceled_by_user');
            setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'canceled_by_user' } : b));
            
            showToast("Booking successfully canceled.", "success");

            const emails = await generateBookingCancellationEmails(booking, currentUser);

            // As the user, you are emailing the owner about the cancellation.
            sendEmail(booking.ownerEmail, emails.ownerSubject, emails.ownerEmailContent);

        } catch (error) {
            console.error("Error canceling booking:", error);
            showToast("Failed to cancel booking. Please try again.", "error");
        }
    };

    const cancelBookingByOwner = async (booking: Booking) => {
        try {
            await updateBookingStatusInFirestore(booking.id, 'canceled_by_owner');
            setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'canceled_by_owner' } : b));
            showToast("Conflicting booking canceled.", "success");

            const email = await generateListingUpdateCancellationEmail(booking);
            sendEmail(booking.bookerEmail, email.subject, email.body);
        } catch (error) {
            console.error("Error canceling booking by owner:", error);
            showToast("Failed to cancel a conflicting booking.", "error");
        }
    };

    const deleteBooking = async (bookingId: string) => {
        if (!currentUser) {
            showToast("You must be logged in to delete a booking.", "error");
            return;
        }
        try {
            await deleteBookingFromFirestore(bookingId);
            setBookings(prev => prev.filter(b => b.id !== bookingId));
            showToast("Booking permanently deleted.", "success");
        } catch (error) {
            console.error("Error deleting booking:", error);
            showToast("Failed to delete booking. Please try again.", "error");
        }
    };


    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                 <div className="flex items-center space-x-3">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-xl font-semibold text-gray-700 dark:text-gray-200">Loading ParkPulse...</span>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return <LoginView />;
    }
    
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col font-sans">
            <Header currentView={view} setView={setView} user={currentUser} />
            <main className="flex-grow container mx-auto px-4 pt-4 md:px-6 md:pt-6 lg:px-8 lg:pt-8 pb-2">
                {view === 'chat' && <ChatView marketplaceListings={listings} messages={messages} setMessages={setMessages} requestBooking={requestBooking} addSystemChatMessage={addSystemChatMessage} />}
                {view === 'profile' && <ProfileView user={currentUser} listings={listings.filter(l => l.ownerId === currentUser.id)} bookings={bookings} bookingRequests={bookingRequests} addListing={addListing} updateListing={updateListing} cancelBooking={cancelBookingByUser} approveBooking={approveBooking} denyBooking={denyBooking} deleteBooking={deleteBooking} />}
            </main>
            <footer className="text-center p-4 text-sm text-gray-500 dark:text-gray-400">
                <p>&copy; {new Date().getFullYear()} ParkPulse. All rights reserved.</p>
            </footer>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default App;