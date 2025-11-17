import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { CarIcon, ChatIcon, ProfileIcon, MenuIcon, XIcon } from './icons';
import { User, View } from '../types';

interface HeaderProps {
    currentView: View;
    setView: (view: View) => void;
    user: User;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView, user }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navItemClasses = "flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium";
    const activeClasses = "bg-blue-600 text-white shadow";
    const inactiveClasses = "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700";
    
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isMenuOpen]);

    const handleNavClick = (view: View) => {
        setView(view);
        setIsMenuOpen(false);
    }
    
    const handleLogout = async () => {
        try {
            await signOut(auth);
            setIsMenuOpen(false);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <>
            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20 border-b border-gray-200 dark:border-gray-700">
                <nav className="container mx-auto px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavClick('chat')}>
                        <CarIcon className="w-7 h-7 text-blue-600 dark:text-blue-500" />
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                            Park<span className="text-blue-600 dark:text-blue-500">Pulse</span>
                        </h1>
                    </div>
                    
                    <div className="hidden md:flex flex-grow justify-center">
                         <div className="flex items-center space-x-2 p-1 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                            <button
                                onClick={() => handleNavClick('chat')}
                                className={`${navItemClasses} ${currentView === 'chat' ? activeClasses : inactiveClasses}`}
                                aria-current={currentView === 'chat'}
                            >
                                <ChatIcon className="w-5 h-5" />
                                <span>AI Assistant</span>
                            </button>
                            <button
                                onClick={() => handleNavClick('profile')}
                                className={`${navItemClasses} ${currentView === 'profile' ? activeClasses : inactiveClasses}`}
                                 aria-current={currentView === 'profile'}
                            >
                                <ProfileIcon className="w-5 h-5" />
                                <span>My Dashboard</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="hidden md:flex items-center space-x-3">
                            <div className="text-right">
                                <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{user.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                            </div>
                            <button onClick={handleLogout} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                                Log Out
                            </button>
                        </div>
                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                                <span className="sr-only">Open menu</span>
                                {isMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </nav>
            </header>
            
            {isMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-10" onClick={() => setIsMenuOpen(false)}>
                    <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white dark:bg-gray-800 p-6 z-30" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="font-bold text-lg">Menu</h2>
                            <button onClick={() => setIsMenuOpen(false)} className="p-2 -mr-2 rounded-md">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex flex-col space-y-3">
                            <button onClick={() => handleNavClick('chat')} className={`${navItemClasses} w-full justify-start ${currentView === 'chat' ? activeClasses : inactiveClasses}`}><ChatIcon className="w-5 h-5" /><span>AI Assistant</span></button>
                            <button onClick={() => handleNavClick('profile')} className={`${navItemClasses} w-full justify-start ${currentView === 'profile' ? activeClasses : inactiveClasses}`}><ProfileIcon className="w-5 h-5" /><span>My Dashboard</span></button>
                            <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                            <div className="flex items-center space-x-3 px-3 py-2">
                                 <div className="text-left">
                                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{user.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                </div>
                            </div>
                             <button onClick={handleLogout} className="w-full text-left font-medium text-red-600 dark:text-red-400 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
