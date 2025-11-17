// export default ListingForm;
import React, { useState, useEffect } from 'react';
import { Listing } from '../types';

interface ListingFormProps {
    onSubmit: (listing: Omit<Listing, 'id' | 'ownerId'>, id?: string) => Promise<void>;
    initialData?: Listing | null;
}

const PRESET_RATES = [1, 3, 5, 7, 10];

// Helper function to convert HH:MM string to minutes since midnight
const timeToMinutes = (time: string): number => {
    const parts = time.split(':');
    // Ensure both parts exist and are numbers before parsing
    if (parts.length === 2) {
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        if (!isNaN(hours) && !isNaN(minutes)) {
            return (hours * 60) + minutes;
        }
    }
    // Return a value that will trigger validation failure if format is wrong
    return -1; 
};

const ListingForm: React.FC<ListingFormProps> = ({ onSubmit, initialData }) => {
    const isEditMode = !!initialData;
    
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [country, setCountry] = useState(''); 
    const [description, setDescription] = useState('');
    const [rate, setRate] = useState('5');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [contactEmail, setContactEmail] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    
    useEffect(() => {
        if (initialData) {
            setAddress(initialData.address);
            setCity(initialData.city);
            setState(initialData.state);
            setZipCode(initialData.zipCode);
            setCountry(initialData.country);
            setDescription(initialData.description);
            setRate(initialData.rate.toString());
            setDate(initialData.date);
            setStartTime(initialData.startTime);
            setEndTime(initialData.endTime);
            setContactEmail(initialData.contactEmail);
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        // --- 1. Basic Required Field Validation ---
        if (!address || !city || !state || !zipCode || !country || !rate || !date || !startTime || !endTime || !contactEmail) {
            setValidationError("Please fill out all required fields.");
            return;
        }

        // --- 2. Rate Validation ---
        const parsedRate = parseFloat(rate);
        if (parsedRate <= 0 || isNaN(parsedRate)) {
            setValidationError("Rate must be a positive number.");
            return;
        }

        // --- 3. Time Logic Validation (The Fix) ---
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);

        if (startMinutes === -1 || endMinutes === -1) {
            setValidationError("Please enter times in the valid HH:MM 24-hour format (e.g., 09:00).");
            return;
        }
        
        // This logic ONLY allows same-day bookings.
        // If start time is 9:00 (540 min) and end time is 16:00 (960 min): 540 < 960 (TRUE). This now passes.
        // If start time is 16:00 (960 min) and end time is 9:00 (540 min): 960 < 540 (FALSE). This fails, correctly.
        if (startMinutes >= endMinutes) {
             setValidationError("End time must be after start time on the same day.");
             return;
        }

        // Since the current implementation of the marketplace does not handle multi-day bookings, 
        // this validation correctly prevents a start time that wraps into the next day.
        
        setIsLoading(true);

        try {
            await onSubmit({
                address,
                city,
                state,
                zipCode,
                country,
                rate: parsedRate, // Use the parsed float value
                date,
                startTime,
                endTime,
                contactEmail,
                description,
            }, initialData?.id);
        } catch (error: any) {
            console.error("Submission Error:", error);
            setValidationError(error.message || "An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const inputClasses = "w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";
    const labelClasses = "block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200";

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg space-y-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-center mb-1">{isEditMode ? 'Edit Your Driveway' : 'List Your Driveway'}</h2>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">{isEditMode ? 'Update the details for your parking spot.' : 'Provide the details for your available parking spot.'}</p>

            {validationError && (
                 <div className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 p-3 rounded-lg text-center text-sm">
                    {validationError}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label htmlFor="address" className={labelClasses}>Street Address*</label>
                    <input type="text" id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g., 123 Main St" className={inputClasses} required disabled={isLoading} />
                </div>
                 <div>
                    <label htmlFor="city" className={labelClasses}>City*</label>
                    <input type="text" id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g., Anytown" className={inputClasses} required disabled={isLoading} />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label htmlFor="state" className={labelClasses}>State / Province*</label>
                    <input type="text" id="state" value={state} onChange={e => setState(e.target.value)} placeholder="e.g., CA" className={inputClasses} required disabled={isLoading} />
                </div>
                 <div>
                    <label htmlFor="zipCode" className={labelClasses}>Zip / Postal Code*</label>
                    <input type="text" id="zipCode" value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="e.g., 90210 / V5K 0A1" className={inputClasses} required disabled={isLoading} />
                </div>
                <div>
                    <label htmlFor="country" className={labelClasses}>Country*</label>
                    <select id="country" value={country} onChange={e => setCountry(e.target.value)} className={inputClasses} required disabled={isLoading}>
                        <option value="" disabled>Select a country</option>
                        <option value="USA">United States</option>
                        <option value="Canada">Canada</option>
                    </select>
                </div>
            </div>

             <div>
                <label htmlFor="description" className={labelClasses}>Description</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="e.g., Covered spot, EV charging available, near the stadium entrance."
                    className={`${inputClasses} h-24 resize-y`}
                    maxLength={200}
                    disabled={isLoading}
                />
                 <p className="text-right text-xs text-gray-400 dark:text-gray-500 mt-1">{description.length}/200</p>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="date" className={labelClasses}>Date*</label>
                    <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className={inputClasses} required min={new Date().toISOString().split("T")[0]} disabled={isLoading} />
                </div>
                <div>
                    <label htmlFor="rate" className={labelClasses}>Rate per Hour ($)*</label>
                     <input
                        id="rate"
                        type="number"
                        value={rate}
                        onChange={e => setRate(e.target.value)}
                        placeholder="e.g., 6.50"
                        className={inputClasses}
                        required
                        min="0"
                        step="0.01"
                        aria-label="Rate per hour"
                        disabled={isLoading}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                        {PRESET_RATES.map(r => (
                            <button
                                type="button"
                                key={r}
                                onClick={() => setRate(r.toString())}
                                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${rate === r.toString() ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
                                disabled={isLoading}
                            >
                                ${r}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label htmlFor="start-time" className={labelClasses}>Start Time (24h format)*</label>
                    <input
                        type="text"
                        id="start-time"
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                        className={inputClasses}
                        required
                        placeholder="e.g., 09:00"
                        pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                        title="Enter time in 24-hour HH:MM format (e.g., 09:00 or 17:30)"
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <label htmlFor="end-time" className={labelClasses}>End Time (24h format)*</label>
                     <input
                        type="text"
                        id="end-time"
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                        className={inputClasses}
                        required
                        placeholder="e.g., 17:30"
                        pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                        title="Enter time in 24-hour HH:MM format (e.g., 09:00 or 17:30)"
                        disabled={isLoading}
                    />
                </div>
            </div>
            <div>
                <label htmlFor="email" className={labelClasses}>Contact Email*</label>
                <input type="email" id="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="e.g., you@example.com" className={inputClasses} required disabled={isLoading} />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors shadow-md transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-wait" disabled={isLoading}>
                 {isLoading ? (
                    <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isEditMode ? 'Updating...' : 'Adding Driveway...'}
                    </div>
                ) : (isEditMode ? 'Update My Driveway' : 'Add My Driveway')}
            </button>
        </form>
    );
};

export default ListingForm;