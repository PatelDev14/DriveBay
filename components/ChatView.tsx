import React, { useState, useRef, useEffect } from 'react';
import { Listing, ChatMessage, ParkingResults, ParkingLocation, ChatRole } from '../types';
import { findParkingSpots } from '../services/geminiService';
import { SendIcon, UserIcon, BotIcon, LocationIcon, CarIcon, GlobeIcon, CrosshairIcon, LinkIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';
import PermissionModal from './PermissionModal';

interface ResultCardProps {
    result: ParkingLocation;
    icon: React.ReactNode;
    onBookNow?: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, icon, onBookNow }) => (
    <div className="border-t border-gray-200 dark:border-gray-600 p-4">
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {icon}
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-gray-800 dark:text-gray-100">{result.name}</p>
                <div className="flex items-start gap-2 mt-1 text-sm text-gray-600 dark:text-gray-300">
                    <LocationIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{result.address}</span>
                </div>
                 <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{result.details}</p>
                 {result.website && (
                    <a href={result.website} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        <LinkIcon className="w-4 h-4" />
                        Visit Website
                    </a>
                )}
                {onBookNow && (
                     <button 
                        onClick={onBookNow}
                        className="mt-3 w-full sm:w-auto bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all text-sm"
                    >
                        Request to Book
                    </button>
                )}
            </div>
        </div>
    </div>
);

interface ChatViewProps {
    marketplaceListings: Listing[];
    messages: ChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    requestBooking: (listing: Listing, startTime: string, endTime: string) => Promise<void>;
    addSystemChatMessage: (content: string) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ marketplaceListings, messages, setMessages, requestBooking, addSystemChatMessage }) => {
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [country, setCountry] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [listingToBook, setListingToBook] = useState<Listing | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<PermissionState>('prompt');


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        // Check permission status on component mount to provide a smoother experience
        if (navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                setPermissionStatus(result.state);
                // Listen for changes, e.g., if user changes it in settings
                result.onchange = () => {
                    setPermissionStatus(result.state);
                };
            });
        }
    }, []);

    const handleBookNow = (listingId: string) => {
        const listing = marketplaceListings.find(l => l.id === listingId);
        if (listing) {
            setListingToBook(listing);
        } else {
            addSystemChatMessage("Sorry, I couldn't find the details for that listing. It might no longer be available.");
        }
    };
    
     const renderMessageContent = (msg: ChatMessage) => {
        if (msg.role === 'system') {
            return <p className="px-4 py-3 italic text-gray-600 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
        }
        
        try {
            const parsed: ParkingResults | { error: string } = JSON.parse(msg.content);

            if ('error' in parsed) {
                return <p className="text-red-800 dark:text-red-200">{parsed.error}</p>;
            }

            const results: ParkingResults = parsed;
            const hasMarketplaceResults = results.marketplaceResults.length > 0;
            const hasWebResults = results.webResults.length > 0;
            
            if (!hasMarketplaceResults && !hasWebResults) {
                return <p className="px-4 py-3">I couldn't find any parking spots matching your request. Please try a different location.</p>
            }

            return (
                <div className="space-y-2">
                    {hasMarketplaceResults && (
                        <>
                            <h3 className="px-4 pt-2 text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-200"><CarIcon className="w-5 h-5"/> Marketplace Driveways</h3>
                            {results.marketplaceResults.map((r, i) => (
                                <ResultCard 
                                    key={`m-${i}`} 
                                    result={r} 
                                    icon={<CarIcon className="w-5 h-5 text-blue-500" />} 
                                    onBookNow={r.listingId ? () => handleBookNow(r.listingId!) : undefined}
                                />
                            ))}
                        </>
                    )}
                     {hasWebResults && (
                        <>
                            <h3 className="px-4 pt-2 text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-200"><GlobeIcon className="w-5 h-5"/> Public & Commercial</h3>
                            {results.webResults.map((r, i) => <ResultCard key={`w-${i}`} result={r} icon={<GlobeIcon className="w-5 h-5 text-green-500" />} />)}
                        </>
                    )}
                </div>
            );
        } catch (e) {
            return <p className="px-4 py-3">{msg.content}</p>;
        }
    };


    const executeSearch = async (query: string) => {
        if (query.trim() === '' || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: query, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, userMessage]);
        
        // Clear form
        setCity('');
        setState('');
        setZipCode('');
        setCountry('USA');
        setIsLoading(true);

        try {
            const botResponseContent = await findParkingSpots(query, marketplaceListings);
            const botMessage: ChatMessage = { role: 'model', content: botResponseContent, timestamp: new Date().toISOString() };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorContent = JSON.stringify({ error: 'Sorry, I am having trouble connecting. Please try again later.' });
            const errorMessage: ChatMessage = { role: 'system', content: errorContent, timestamp: new Date().toISOString() };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!city && !state && !zipCode) {
            addSystemChatMessage("Please fill out at least one location field to search.");
            return;
        }
        const query = `Find parking in ${city}, ${state} ${zipCode}, ${country}`;
        executeSearch(query);
    };
    
    const fetchLocationAndSearch = () => {
        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const query = `Find parking near me (latitude: ${latitude.toFixed(4)}, longitude: ${longitude.toFixed(4)})`;
                executeSearch(query);
                if (permissionStatus === 'prompt') {
                    setPermissionStatus('granted');
                }
            },
            (error) => {
                let errorMessage = "I couldn't get your location. Please try again.";
                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage = "It looks like you've denied location permissions. You can change this in your browser settings if you'd like to use the 'Near Me' feature.";
                    setPermissionStatus('denied');
                }
                addSystemChatMessage(errorMessage);
                setIsLoading(false);
            }
        );
    };

    const handleNearMeSearch = () => {
        if (!navigator.geolocation) {
            addSystemChatMessage("Sorry, Geolocation is not supported by your browser.");
            return;
        }

        if (permissionStatus === 'granted') {
            fetchLocationAndSearch();
        } else {
            setShowPermissionModal(true);
        }
    };

    const handleRequestLocationPermission = () => {
        setShowPermissionModal(false);
        fetchLocationAndSearch();
    };
    
    return (
        <>
            <div className="flex flex-col h-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="flex-grow p-4 md:p-6 overflow-y-auto space-y-6">
                    {messages.length === 0 && (
                         <div className="text-center text-gray-500 dark:text-gray-400 py-16 flex flex-col items-center">
                            <BotIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                            <h2 className="text-2xl font-semibold mt-4">Welcome to ParkPulse AI</h2>
                            <p className="mt-2">Find the perfect parking spot using the form below.</p>
                             <div className="mt-8">
                                <button
                                    onClick={() => executeSearch("Show me all available driveways")}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    ✨ Show all available driveways
                                </button>
                            </div>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''} ${msg.role === 'system' ? 'justify-center' : ''}`}>
                            {msg.role === 'model' && (
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-white dark:border-gray-800">
                                    <BotIcon className="w-6 h-6" />
                                </div>
                            )}
                            <div className={`max-w-md lg:max-w-xl rounded-2xl shadow-sm ${
                                msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 
                                msg.role === 'model' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none overflow-hidden' :
                                'bg-transparent text-gray-900 dark:text-gray-100'
                            }`}>
                               {msg.role === 'user' ? <p className="px-4 py-3">{msg.content}</p> : renderMessageContent(msg)}
                            </div>
                             {msg.role === 'user' && (
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                    <UserIcon className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && !listingToBook && (
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-white dark:border-gray-800">
                               <BotIcon className="w-6 h-6" />
                            </div>
                            <div className="max-w-xl p-4 rounded-2xl bg-gray-100 dark:bg-gray-700 rounded-bl-none">
                                <div className="flex items-center space-x-2">
                                    <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-pulse"></span>
                                    <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></span>
                                    <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <form onSubmit={handleFormSearch} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" disabled={isLoading} />
                            <input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="State / Province" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" disabled={isLoading} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="Zip / Postal Code" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" disabled={isLoading} />
                             <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" disabled={isLoading} />
                        </div>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={handleNearMeSearch} disabled={isLoading} className="flex-shrink-0 flex items-center justify-center gap-2 p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors" aria-label="Find parking near me">
                                <CrosshairIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                <span className="hidden sm:inline text-sm font-medium">Near Me</span>
                            </button>
                            <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:dark:bg-gray-500 disabled:cursor-not-allowed transition-colors font-semibold" aria-label="Search parking">
                                <SendIcon className="w-5 h-5" />
                                <span>Search Parking</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            {listingToBook && (
                <ConfirmationModal 
                    listing={listingToBook}
                    onClose={() => setListingToBook(null)}
                    onConfirm={async (startTime, endTime) => {
                        await requestBooking(listingToBook, startTime, endTime);
                        setListingToBook(null);
                    }}
                />
            )}
            {showPermissionModal && (
                <PermissionModal
                    status={permissionStatus}
                    onClose={() => setShowPermissionModal(false)}
                    onAllow={handleRequestLocationPermission}
                />
            )}
        </>
    );
};

export default ChatView;