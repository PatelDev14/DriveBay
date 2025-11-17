import React, { useState } from 'react';
import { Listing, User } from '../types';
import ListingCard from './ListingCard';
import ListingForm from './ListingForm';
import { PlusIcon, CarIcon } from './icons';

interface MarketplaceViewProps {
    listings: Listing[];
    // FIX: The 'addListing' function is async, so it returns a Promise.
    addListing: (listing: Omit<Listing, 'id' | 'ownerId'>) => Promise<void>;
    addBooking: (listing: Listing) => Promise<void>;
    user: User;
}

const MarketplaceView: React.FC<MarketplaceViewProps> = ({ listings, addListing, addBooking, user }) => {
    const [showForm, setShowForm] = useState(false);

    // FIX: Make this function async to align with the 'onSubmit' prop of ListingForm.
    const handleFormSubmit = async (listingData: Omit<Listing, 'id' | 'ownerId'>) => {
        await addListing(listingData);
        setShowForm(false);
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Driveway Marketplace</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Rent a private driveway from a homeowner.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md transform hover:scale-105"
                    aria-expanded={showForm}
                >
                    <PlusIcon className={`w-5 h-5 transition-transform duration-300 ${showForm ? 'rotate-45' : ''}`} />
                    <span>{showForm ? 'Cancel' : 'List Your Driveway'}</span>
                </button>
            </div>
            
            {showForm && (
                <div className="mb-10">
                    <ListingForm onSubmit={handleFormSubmit} />
                </div>
            )}
            
            {listings.length === 0 && !showForm ? (
                <div className="text-center py-20 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <CarIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                    <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mt-4">The Marketplace is Empty</h2>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Be the first to list your driveway and start earning today!</p>
                </div>
            ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {listings.map(listing => (
                        <ListingCard key={listing.id} listing={listing} addBooking={addBooking} isLoggedIn={true} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MarketplaceView;