import React from 'react';
import { CrosshairIcon, XIcon } from './icons';

interface PermissionModalProps {
    status: PermissionState;
    onClose: () => void;
    onAllow: () => void;
}

const PermissionModal: React.FC<PermissionModalProps> = ({ status, onClose, onAllow }) => {
    const isDenied = status === 'denied';

    const title = isDenied ? "Location Access Blocked" : "Find Parking Near You?";
    const description = isDenied
        ? "To use this feature, ParkPulse needs location access. Please enable location permissions for this site in your browser's settings."
        : "To find the best parking spots nearby, allow ParkPulse to access your device's location. We only use it when you ask us to find parking near you.";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="permission-modal-title">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/50 mb-4">
                        <CrosshairIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 id="permission-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">{description}</p>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl flex flex-col sm:flex-row-reverse gap-3">
                    {!isDenied && (
                        <button
                            onClick={onAllow}
                            className="w-full sm:w-auto flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-md transform hover:scale-105"
                        >
                            Allow Access
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className={`w-full sm:w-auto flex-1 font-semibold py-3 px-4 rounded-lg transition-colors ${isDenied ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                    >
                        {isDenied ? "I Understand" : "Maybe Later"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PermissionModal;
