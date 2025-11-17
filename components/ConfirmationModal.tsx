import React, { useMemo, useState, useEffect } from 'react';
import { Listing, Booking } from '../types';
import { LocationIcon, ClockIcon, DollarIcon, CalendarIcon, XIcon, InfoIcon } from './icons';
import { getExistingBookingsForListing } from '../services/firestoreService';

interface ConfirmationModalProps {
    listing: Listing;
    onClose: () => void;
    onConfirm: (startTime: string, endTime: string) => Promise<void>;
}

// Helper to convert HH:MM time string to total minutes from midnight for reliable comparison.
const timeToMinutes = (timeStr: string): number => {
    if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr)) return NaN;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return NaN;
    }
    return hours * 60 + minutes;
};

// Helper function to correctly calculate duration and total cost using the robust timeToMinutes function
const calculateTotalCost = (rate: number, startTime: string, endTime: string): string => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (isNaN(startMinutes) || isNaN(endMinutes) || endMinutes <= startMinutes) {
        return '0.00';
    }

    const durationMinutes = endMinutes - startMinutes;
    const durationHours = durationMinutes / 60;
    const total = rate * durationHours;

    return total.toFixed(2);
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ listing, onClose, onConfirm }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedStartTime, setSelectedStartTime] = useState('');
    const [selectedEndTime, setSelectedEndTime] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);
    const [existingBookings, setExistingBookings] = useState<Booking[]>([]);

    useEffect(() => {
        // Set initial times when component mounts
        setSelectedStartTime(listing.startTime);
        setSelectedEndTime(listing.endTime);

        // Cannot fetch existing bookings on the client due to security rules.
        // The definitive conflict check happens when the owner approves the request.
        setExistingBookings([]);

    }, [listing]);


    const totalCost = useMemo(() => calculateTotalCost(listing.rate, selectedStartTime, selectedEndTime), [listing.rate, selectedStartTime, selectedEndTime]);

    const handleConfirmClick = async () => {
        setValidationError(null);

        const startMinutes = timeToMinutes(selectedStartTime);
        const endMinutes = timeToMinutes(selectedEndTime);
        const listingStartMinutes = timeToMinutes(listing.startTime);
        const listingEndMinutes = timeToMinutes(listing.endTime);

        if (isNaN(startMinutes) || isNaN(endMinutes)) {
            setValidationError("Please enter a valid start and end time in HH:MM format.");
            return;
        }

        if (startMinutes >= endMinutes) {
            setValidationError("End time must be after start time.");
            return;
        }

        if (startMinutes < listingStartMinutes || endMinutes > listingEndMinutes) {
            setValidationError(`Please select a time within the available window (${listing.startTime} - ${listing.endTime}).`);
            return;
        }
        
        // REMOVED: Pre-emptive client-side conflict check is no longer possible
        // due to security rules. The owner will perform the final check upon approval.

        setIsLoading(true);
        try {
            await onConfirm(selectedStartTime, selectedEndTime);
            onClose(); // Close modal on successful booking request
        } catch (error: any) {
            // The `onConfirm` (requestBooking) function will now show its own generic toast.
            // We can simplify the error handling here.
            setValidationError("An unexpected error occurred. Please try again.");
            setIsLoading(false);
        }
    };

    const fullLocation = `${listing.address}, ${listing.city}, ${listing.state} ${listing.zipCode}`;
    const inputClasses = "w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30 p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Request to Book</h2>
                    <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <XIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-4 text-gray-700 dark:text-gray-200">
                        <div className="flex items-center gap-3">
                            <LocationIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            <span className="font-semibold">{fullLocation}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CalendarIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                            <span>{listing.date} (Available: {listing.startTime} - {listing.endTime})</span>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/40 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-2">
                            <InfoIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                    Your request is subject to the owner's approval. The final conflict check is performed by the owner.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="start-time" className="block text-sm font-medium mb-2">Start Time*</label>
                                <input 
                                    type="text" 
                                    id="start-time" 
                                    value={selectedStartTime}
                                    onChange={e => setSelectedStartTime(e.target.value)}
                                    className={inputClasses}
                                    required
                                    placeholder="HH:MM"
                                    pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                                    title="Enter time in 24-hour HH:MM format (e.g., 09:00 or 17:30)"
                                />
                            </div>
                            <div>
                                <label htmlFor="end-time" className="block text-sm font-medium mb-2">End Time*</label>
                                <input 
                                    type="text"
                                    id="end-time" 
                                    value={selectedEndTime}
                                    onChange={e => setSelectedEndTime(e.target.value)}
                                    className={inputClasses}
                                    required
                                    placeholder="HH:MM"
                                    pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                                    title="Enter time in 24-hour HH:MM format (e.g., 09:00 or 17:30)"
                                />
                            </div>
                        </div>
                        {validationError && (
                            <div className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 p-3 rounded-lg text-center text-sm">
                                {validationError}
                            </div>
                        )}
                    </div>

                     <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <span className="text-lg font-medium">Estimated Cost:</span>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">${totalCost}</span>
                    </div>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
                     <button
                        onClick={handleConfirmClick}
                        disabled={isLoading}
                        className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors shadow-md transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-wait"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending Request...
                            </div>
                        ) : 'Send Booking Request'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;