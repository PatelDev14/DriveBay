import React, { useState, useEffect, useRef } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { auth, googleProvider, RecaptchaVerifier } from '../firebase';
import { CarIcon } from './icons';

// Declare recaptchaVerifier in the window scope for Firebase
declare global {
    interface Window {
        recaptchaVerifier: RecaptchaVerifier;
    }
}

const LoginView: React.FC = () => {
    const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
    const [isSignUp, setIsSignUp] = useState(false);
    
    // Form states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    // Logic states
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [hostname, setHostname] = useState('');

    const recaptchaContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setHostname(window.location.hostname);

        // Setup reCAPTCHA verifier
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
              'size': 'invisible',
              'callback': () => {
                // reCAPTCHA solved, allow signInWithPhoneNumber.
              }
            });
        }
    }, []);

    const resetFormState = () => {
        setError(null);
        setIsLoading(false);
        setConfirmationResult(null);
        setVerificationCode('');
    }

    const handleMethodChange = (method: 'email' | 'phone') => {
        setLoginMethod(method);
        resetFormState();
    }

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (isSignUp) {
                if (!name.trim()) {
                    setError("Please enter your name.");
                    setIsLoading(false);
                    return;
                }
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: name });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err: any) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhoneAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const verifier = window.recaptchaVerifier;
            const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
            setConfirmationResult(result);
        } catch(err: any) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleCodeVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirmationResult) {
            setError("Something went wrong. Please try sending the code again.");
            return;
        }
        setError(null);
        setIsLoading(true);

        try {
            await confirmationResult.confirm(verificationCode);
            // On success, onAuthStateChanged will handle the login
        } catch (err: any) {
             setError(err.message.replace('Firebase: ', ''));
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleGoogleAuth = async () => {
        setError(null);
        setIsLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err: any) {
             if (err.code === 'auth/popup-closed-by-user') {
                setError("Sign-in process cancelled.");
            } else {
                setError(err.message.replace('Firebase: ', ''));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const inputClasses = "w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";
    const labelClasses = "block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200";

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 relative">
             {hostname && (
                <div className="absolute top-0 left-0 right-0 bg-yellow-300 text-black p-3 text-center text-sm font-sans z-10">
                    <strong>Firebase Auth Domain:</strong> Add this exact value to your authorized domains list &#x27A1; 
                    <strong className="select-all bg-white p-1 rounded-md ml-2 font-mono">{hostname}</strong>
                </div>
            )}
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <CarIcon className="w-12 h-12 text-blue-600 dark:text-blue-500 mx-auto" />
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mt-2">
                        Welcome to Park<span className="text-blue-600 dark:text-blue-500">Pulse</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Your AI-powered parking assistant.</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                    
                    <div className="flex justify-center mb-6 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <button onClick={() => handleMethodChange('email')} className={`w-1/2 py-2 rounded-md font-semibold transition-colors ${loginMethod === 'email' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Email</button>
                        <button onClick={() => handleMethodChange('phone')} className={`w-1/2 py-2 rounded-md font-semibold transition-colors ${loginMethod === 'phone' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Phone</button>
                    </div>

                    {error && <p className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4 text-center text-sm">{error}</p>}
                    
                    {loginMethod === 'email' && (
                        <>
                            <h2 className="text-xl font-bold text-center mb-4">{isSignUp ? 'Create an Account' : 'Log In'}</h2>
                            <form onSubmit={handleEmailAuth} className="space-y-4">
                                {isSignUp && (
                                    <div>
                                        <label htmlFor="name" className={labelClasses}>Full Name</label>
                                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className={inputClasses} required />
                                    </div>
                                )}
                                <div>
                                    <label htmlFor="email" className={labelClasses}>Email Address</label>
                                    <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClasses} required />
                                </div>
                                <div>
                                    <label htmlFor="password" className={labelClasses}>Password</label>
                                    <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} className={inputClasses} required minLength={6} />
                                </div>
                                <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed">
                                    {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
                                </button>
                            </form>
                             <p className="text-center mt-4 text-sm">
                                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                                <button onClick={() => { setIsSignUp(!isSignUp); setError(null); }} className="font-semibold text-blue-600 hover:text-blue-500 ml-1">
                                    {isSignUp ? 'Log In' : 'Sign Up'}
                                </button>
                            </p>
                        </>
                    )}

                    {loginMethod === 'phone' && (
                        <>
                            <h2 className="text-xl font-bold text-center mb-4">Sign in with Phone</h2>
                            {!confirmationResult ? (
                                <form onSubmit={handlePhoneAuth} className="space-y-4">
                                    <div>
                                        <label htmlFor="phone" className={labelClasses}>Phone Number</label>
                                        <input type="tel" id="phone" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+1 555 555 5555" className={inputClasses} required />
                                    </div>
                                    <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed">
                                        {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleCodeVerification} className="space-y-4">
                                    <p className="text-center text-sm text-gray-600 dark:text-gray-300">Enter the code sent to {phoneNumber}</p>
                                    <div>
                                        <label htmlFor="code" className={labelClasses}>Verification Code</label>
                                        <input type="text" id="code" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} className={inputClasses} required />
                                    </div>
                                    <button type="submit" disabled={isLoading} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed">
                                        {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                                    </button>
                                     <button type="button" onClick={resetFormState} className="w-full text-center text-sm text-blue-600 hover:underline mt-2">
                                        Use a different number
                                    </button>
                                </form>
                            )}
                        </>
                    )}

                    <div className="flex items-center my-6">
                        <hr className="flex-grow border-gray-300 dark:border-gray-600" />
                        <span className="mx-4 text-sm text-gray-500 dark:text-gray-400">OR</span>
                        <hr className="flex-grow border-gray-300 dark:border-gray-600" />
                    </div>
                    <button onClick={handleGoogleAuth} disabled={isLoading} className="w-full flex justify-center items-center gap-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50">
                        <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.222 0-9.618-3.67-11.283-8.591l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.021 35.798 44 30.338 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
                        Sign in with Google
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginView;