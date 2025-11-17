import React, { useState } from 'react';
import { Listing } from '../types';
import { LocationIcon, ClockIcon, DollarIcon, CalendarIcon, InfoIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';

interface ListingCardProps {
    listing: Listing;
    addBooking: (listing: Listing, startTime: string, endTime: string) => Promise<void>;
    isLoggedIn: boolean;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, addBooking, isLoggedIn }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const handleBookNow = () => {
        if (isLoggedIn) {
            setIsModalOpen(true);
        }
    }

    const handleConfirmBooking = async (startTime: string, endTime: string) => {
        await addBooking(listing, startTime, endTime);
        setIsModalOpen(false); // Close modal after booking process is complete
    };

    const fullLocation = `${listing.address}, ${listing.city}, ${listing.state} ${listing.zipCode}`;

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1.5 transition-transform duration-300 border border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-6 flex-grow">
                    <div className="flex items-start gap-4 mb-5">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                            <LocationIcon className="w-6 h-6 text-blue-500" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white leading-tight pt-2">{fullLocation}</h3>
                    </div>
                    {listing.description && (
                        <div className="flex items-start gap-3 mb-5 text-sm text-gray-500 dark:text-gray-400">
                            <InfoIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <p className="italic">{listing.description}</p>
                        </div>
                    )}
                    <div className="space-y-3 text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-3">
                            <DollarIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span><span className="font-semibold">${listing.rate.toFixed(2)}</span> / hour</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CalendarIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                            <span>{listing.date}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <ClockIcon className="w-5 h-5 text-purple-500 flex-shrink-0" />
                            <span>{listing.startTime} - {listing.endTime}</span>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50">
                     <button 
                        onClick={handleBookNow}
                        disabled={!isLoggedIn}
                        className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
                        title={isLoggedIn ? "Book this driveway" : "Please log in to book"}
                    >
                        {isLoggedIn ? "Book Now" : "Log In to Book"}
                    </button>
                </div>
            </div>
            {isModalOpen && (
                <ConfirmationModal 
                    listing={listing}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleConfirmBooking}
                />
            )}
        </>
    );
};

export default ListingCard;