

import React, { useState, useMemo } from 'react';
import { User, Listing, Booking } from '../types';
import { LocationIcon, ClockIcon, DollarIcon, CalendarIcon, CarIcon, PlusIcon, XIcon, InfoIcon, UserIcon } from './icons';
import ListingForm from './ListingForm';

type ProfileTab = 'bookings' | 'listings';

const calculateTotalCost = (rate: number, startTime: string, endTime: string): string => {
    try {
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        if ([startHours, startMinutes, endHours, endMinutes].some(isNaN)) return 'N/A';
        const startDate = new Date();
        startDate.setHours(startHours, startMinutes, 0, 0);
        const endDate = new Date();
        endDate.setHours(endHours, endMinutes, 0, 0);
        if (endDate <= startDate) return 'Invalid time';
        const durationMillis = endDate.getTime() - startDate.getTime();
        const durationHours = durationMillis / (1000 * 60 * 60);
        return (rate * durationHours).toFixed(2);
    } catch (e) {
        console.error("Error calculating cost:", e);
        return 'N/A';
    }
}

const StatusBadge: React.FC<{ status: Booking['status'] }> = ({ status }) => {
    const statusInfo = {
        pending: { text: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/70 dark:text-yellow-300' },
        confirmed: { text: 'Confirmed', color: 'bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-300' },
        denied: { text: 'Denied by Owner', color: 'bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-300' },
        canceled_by_user: { text: 'Canceled by You', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
        canceled_by_owner: { text: 'Canceled by Owner', color: 'bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-300' },
    };
    const { text, color } = statusInfo[status] || statusInfo.canceled_by_user;
    return <div className={`px-2.5 py-1 text-xs font-medium rounded-full inline-block ${color}`}>{text}</div>;
};

const BookingCard: React.FC<{ booking: Booking, onCancel: (booking: Booking) => Promise<void>, onDelete: (bookingId: string) => Promise<void> }> = ({ booking, onCancel, onDelete }) => {
    const totalCost = useMemo(() => calculateTotalCost(booking.rate, booking.startTime, booking.endTime), [booking.rate, booking.startTime, booking.endTime]);
    const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
    const [isCanceling, setIsCanceling] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleCancel = async () => {
        setIsCanceling(true);
        await onCancel(booking);
    };
    
    const handleDelete = async () => {
        setIsDeleting(true);
        await onDelete(booking.id);
    };

    const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
    const canDelete = ['canceled_by_user', 'denied', 'canceled_by_owner'].includes(booking.status);


    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="text-center">
                <div className="flex items-center justify-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                        <LocationIcon className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="font-bold text-md text-gray-800 dark:text-white leading-tight">{booking.location}</h3>
                </div>
                <div className="mt-3">
                    <StatusBadge status={booking.status} />
                </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 pt-4 mt-4 flex-grow">
                 <div className="flex items-center gap-3">
                    <CalendarIcon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span>{booking.date}</span>
                </div>
                <div className="flex items-center gap-3">
                    <ClockIcon className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span>{booking.startTime} - {booking.endTime}</span>
                </div>
                <div className="flex items-center gap-3">
                    <DollarIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Total Cost: <span className="font-semibold">${totalCost}</span></span>
                </div>
            </div>

            {canCancel && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    {isConfirmingCancel ? (
                        <div className="space-y-2">
                            <p className="text-center text-sm text-gray-600 dark:text-gray-300">Are you sure?</p>
                            <div className="flex gap-2">
                                <button onClick={() => setIsConfirmingCancel(false)} disabled={isCanceling} className="w-full bg-gray-200 dark:bg-gray-600 text-sm font-semibold py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Keep</button>
                                <button onClick={handleCancel} disabled={isCanceling} className="w-full bg-red-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-wait">
                                    {isCanceling ? 'Canceling...' : 'Confirm Cancel'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setIsConfirmingCancel(true)} className="w-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-semibold py-2 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors text-sm">
                            Cancel Booking
                        </button>
                    )}
                </div>
            )}

            {canDelete && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    {isConfirmingDelete ? (
                        <div className="space-y-2">
                            <p className="text-center text-sm text-gray-600 dark:text-gray-300">Permanently delete?</p>
                            <div className="flex gap-2">
                                <button onClick={() => setIsConfirmingDelete(false)} disabled={isDeleting} className="w-full bg-gray-200 dark:bg-gray-600 text-sm font-semibold py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Keep</button>
                                <button onClick={handleDelete} disabled={isDeleting} className="w-full bg-red-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-wait">
                                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setIsConfirmingDelete(true)} className="w-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-semibold py-2 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors text-sm">
                            Delete Booking
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const UserListingCard: React.FC<{ listing: Listing; onEdit: (listing: Listing) => void; }> = ({ listing, onEdit }) => {
    const fullLocation = `${listing.address}, ${listing.city}, ${listing.state} ${listing.zipCode}`;
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="flex-grow">
                 <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                        <LocationIcon className="w-6 h-6 text-green-500" />
                    </div>
                    <h3 className="font-bold text-md text-gray-800 dark:text-white leading-tight pt-2">{fullLocation}</h3>
                </div>
                {listing.description && (
                     <div className="flex items-start gap-3 mb-4 text-sm text-gray-500 dark:text-gray-400">
                        <InfoIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="italic">{listing.description}</p>
                    </div>
                )}
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <div className="flex items-center gap-3"><DollarIcon className="w-4 h-4 text-green-500 flex-shrink-0" /><span><span className="font-semibold">${listing.rate.toFixed(2)}</span> / hour</span></div>
                    <div className="flex items-center gap-3"><CalendarIcon className="w-4 h-4 text-indigo-500 flex-shrink-0" /><span>Listed for: {listing.date}</span></div>
                    <div className="flex items-center gap-3"><ClockIcon className="w-4 h-4 text-purple-500 flex-shrink-0" /><span>{listing.startTime} - {listing.endTime}</span></div>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700"><button onClick={() => onEdit(listing)} className="w-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 font-semibold py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm">Edit Listing</button></div>
        </div>
    );
};

const BookingRequestCard: React.FC<{ request: Booking, onApprove: (req: Booking) => void, onDeny: (req: Booking) => void }> = ({ request, onApprove, onDeny }) => {
    const [isLoading, setIsLoading] = useState<'approve' | 'deny' | null>(null);

    const handleApprove = async () => {
        setIsLoading('approve');
        await onApprove(request);
        setIsLoading(null);
    }
    const handleDeny = async () => {
        setIsLoading('deny');
        await onDeny(request);
        setIsLoading(null);
    }
    return (
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-5 border border-blue-200 dark:border-blue-700">
             <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-3"><UserIcon className="w-4 h-4 text-gray-500 flex-shrink-0" /><span>Request from: <span className="font-semibold">{request.bookerName}</span></span></div>
                <div className="flex items-center gap-3"><CalendarIcon className="w-4 h-4 text-indigo-500 flex-shrink-0" /><span>{request.date}</span></div>
                <div className="flex items-center gap-3"><ClockIcon className="w-4 h-4 text-purple-500 flex-shrink-0" /><span>{request.startTime} - {request.endTime}</span></div>
            </div>
             <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-800 flex gap-3">
                <button onClick={handleApprove} disabled={!!isLoading} className="w-full bg-green-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-wait">{isLoading === 'approve' ? 'Approving...' : 'Approve'}</button>
                <button onClick={handleDeny} disabled={!!isLoading} className="w-full bg-red-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-wait">{isLoading === 'deny' ? 'Denying...' : 'Deny'}</button>
            </div>
        </div>
    );
};

interface ProfileViewProps {
    user: User, 
    listings: Listing[], 
    bookings: Booking[], 
    bookingRequests: Booking[],
    addListing: (listingData: Omit<Listing, 'id' | 'ownerId'>) => Promise<void>; 
    updateListing: (listingId: string, listingData: Omit<Listing, 'id' | 'ownerId'>) => Promise<void>;
    cancelBooking: (booking: Booking) => Promise<void>; 
    approveBooking: (booking: Booking) => Promise<void>;
    denyBooking: (booking: Booking) => Promise<void>;
    deleteBooking: (bookingId: string) => Promise<void>;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, listings, bookings, bookingRequests, addListing, updateListing, cancelBooking, approveBooking, denyBooking, deleteBooking }) => {
    const [activeTab, setActiveTab] = useState<ProfileTab>('bookings');
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [listingToEdit, setListingToEdit] = useState<Listing | null>(null);
    
    const tabClasses = "px-4 py-2.5 text-sm font-semibold rounded-md transition-colors";
    const activeTabClasses = "bg-blue-600 text-white";
    const inactiveTabClasses = "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700";

    const handleFormSubmit = async (listingData: Omit<Listing, 'id' | 'ownerId'>, id?: string) => {
        if (id) {
            await updateListing(id, listingData);
        } else {
            await addListing(listingData);
        }
        setIsFormVisible(false);
        setListingToEdit(null);
    };

    const handleOpenEditForm = (listing: Listing) => {
        setListingToEdit(listing);
        setIsFormVisible(true);
    };
    
    const handleCloseForm = () => {
        setIsFormVisible(false);
        setListingToEdit(null);
    }

    return (
        <>
        <div className="max-w-4xl mx-auto">
            <header className="mb-8 text-center"><h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Dashboard</h1><p className="text-gray-500 dark:text-gray-400 mt-1">Manage your bookings and driveway listings.</p></header>
            <div className="flex justify-center mb-8"><div className="p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex space-x-1"><button onClick={() => setActiveTab('bookings')} className={`${tabClasses} ${activeTab === 'bookings' ? activeTabClasses : inactiveTabClasses}`}>My Bookings ({bookings.length})</button><button onClick={() => setActiveTab('listings')} className={`${tabClasses} ${activeTab === 'listings' ? activeTabClasses : inactiveTabClasses}`}>My Driveways ({listings.length})</button></div></div>
            <div>
                {activeTab === 'bookings' && (
                    <div className="space-y-6">{bookings.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-6">{bookings.map(b => <BookingCard key={b.id} booking={b} onCancel={cancelBooking} onDelete={deleteBooking} />)}</div>) : (<div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"><CarIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" /><h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mt-4">No Bookings Yet</h2><p className="mt-2 text-gray-500 dark:text-gray-400">Use the AI Assistant to find and book a spot.</p></div>)}</div>
                )}
                {activeTab === 'listings' && (
                     <div className="space-y-6">
                        {bookingRequests.length > 0 && (
                            <div>
                                <h2 className="text-lg font-bold mb-4 text-center">Pending Requests ({bookingRequests.length})</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {bookingRequests.map(req => <BookingRequestCard key={req.id} request={req} onApprove={approveBooking} onDeny={denyBooking}/>)}
                                </div>
                                 <hr className="my-8 border-gray-200 dark:border-gray-700" />
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold">Your Listed Driveways</h2>
                            <button onClick={() => setIsFormVisible(true)} className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md transform hover:scale-105"><PlusIcon className="w-5 h-5" /><span>List New Driveway</span></button>
                        </div>
                        {listings.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-6">{listings.map(l => <UserListingCard key={l.id} listing={l} onEdit={handleOpenEditForm} />)}</div>) : (<div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"><CarIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" /><h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mt-4">You Haven't Listed Any Driveways</h2><p className="mt-2 text-gray-500 dark:text-gray-400">Click the button above to list your driveway and start earning.</p></div>)}
                    </div>
                )}
            </div>
        </div>
        {isFormVisible && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30 p-4" onClick={handleCloseForm} role="dialog" aria-modal="true">
                <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                   <div className="relative"><button onClick={handleCloseForm} className="absolute top-4 right-4 p-2 z-10 bg-gray-200 dark:bg-gray-900 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"><XIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" /><span className="sr-only">Close form</span></button><ListingForm onSubmit={handleFormSubmit} initialData={listingToEdit} /></div>
                </div>
            </div>
        )}
        </>
    );
};

export default ProfileView;
