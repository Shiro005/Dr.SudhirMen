import React, { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../Database/Firebase';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    const savedAuth = localStorage.getItem('clinicAuth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      if (authData.timestamp && (Date.now() - authData.timestamp) < (24 * 60 * 60 * 1000)) {
        onLogin(authData);
      }
    }
  }, [onLogin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  // Determine user type based on email
  const getUserType = (email) => {
    const adminEmails = [
      'admin@saryodayclinic.com',
      'dr.sudhir@saryodayclinic.com',
      'sudhir121@gmail.com'
    ];

    const doctorEmails = [
      'doctor@saryodayclinic.com',
      'dr.men@saryodayclinic.com'
    ];

    if (adminEmails.includes(email)) return 'admin';
    if (doctorEmails.includes(email)) return 'doctor';
    return 'staff';
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const user = userCredential.user;
      const userType = getUserType(user.email);

      const userData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        userType,
        timestamp: new Date().getTime()
      };

      localStorage.setItem('clinicAuth', JSON.stringify(userData));
      onLogin(userData);

    } catch (error) {
      console.error('Login error:', error);
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Invalid email address format.');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled.');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later.');
          break;
        default:
          setError('Failed to sign in. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      const userType = getUserType(user.email);

      const userData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        userType,
        timestamp: new Date().getTime()
      };

      localStorage.setItem('clinicAuth', JSON.stringify(userData));
      onLogin(userData);

    } catch (error) {
      console.error('Google login error:', error);
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          setError('Login cancelled by user.');
          break;
        case 'auth/popup-blocked':
          setError('Popup was blocked by your browser. Please allow popups for this site.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your internet connection.');
          break;
        default:
          setError('Failed to sign in with Google. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">

          <div className="bg-white px-6 py-8 text-center border-b border-gray-200">
            <div className="bg-orange-50 p-3 rounded-full inline-flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Saryoday Clinic</h1>
            <p className="text-gray-600 text-sm">Healthcare Management System</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center">
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors mb-4"
            >
              {isGoogleLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={credentials.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter your email"
                  />
                  <svg className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter your password"
                  />
                  <svg className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </>
                ) : (
                  'Sign In with Email'
                )}
              </button>
            </form>

            <div className="mt-6 p-3 bg-gray-50 rounded border border-gray-200">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">Role-based Access:</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Admin:</strong> Full system access + Admin panel</p>
                <p><strong>Doctor:</strong> All features except Admin panel</p>
                <p><strong>Staff:</strong> Add Patient & Patient List only</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="text-center text-xs text-gray-600">
              <p>Powered by <span className="font-semibold text-orange-600">Webreich Technologies</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;