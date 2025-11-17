import React, { useEffect, useState } from 'react';
import { XIcon } from './icons';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Animate in
        setVisible(true);

        const timer = setTimeout(() => {
            handleClose();
        }, 3800); // Start fade out before auto-close

        return () => clearTimeout(timer);
    }, [message, type]);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 200); // Wait for fade out animation
    }

    const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
    const ringColor = type === 'success' ? 'ring-green-700' : 'ring-red-700';

    return (
        <div
            className={`fixed bottom-5 right-5 z-50 flex items-center justify-between max-w-sm w-full p-4 rounded-lg shadow-2xl text-white ${bgColor} ring-2 ring-opacity-50 ${ringColor} transition-all duration-300 transform ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
            role="alert"
        >
            <p className="font-medium">{message}</p>
            <button onClick={handleClose} className="p-1 -mr-2 rounded-md hover:bg-white/20 transition-colors">
                <XIcon className="w-5 h-5" />
                <span className="sr-only">Close notification</span>
            </button>
        </div>
    );
};

export default Toast;