import React, { useState, useEffect } from 'react';
import { firestore, collection, addDoc, query, where, getDocs, orderBy } from '../Database/Firebase';

const AddPatient = () => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    weight: '',
    temperature: '',
    gender: '',
    additionalInfo: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [todayPatientsCount, setTodayPatientsCount] = useState(0);
  const [currentTime, setCurrentTime] = useState('');

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Get today's patients count from Firestore
  useEffect(() => {
    const getTodayPatientsCount = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const patientsRef = collection(firestore, 'patients');
        const q = query(patientsRef, where('dateKey', '==', today));
        const querySnapshot = await getDocs(q);
        setTodayPatientsCount(querySnapshot.size);
      } catch (error) {
        console.error('Error getting patients count:', error);
      }
    };

    getTodayPatientsCount();
  }, []);

  const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const time = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return { date, time };
  };

  const getNextPatientNumber = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const patientsRef = collection(firestore, 'patients');
      
      // Try with ordering first
      try {
        const q = query(
          patientsRef, 
          where('dateKey', '==', today),
          orderBy('patientNumber', 'desc'),
          orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          return 1;
        } else {
          const lastPatient = querySnapshot.docs[0].data();
          return lastPatient.patientNumber + 1;
        }
      } catch (orderError) {
        // Fallback without ordering
        const q = query(patientsRef, where('dateKey', '==', today));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          return 1;
        } else {
          const patientsData = querySnapshot.docs.map(doc => doc.data());
          const maxPatientNumber = Math.max(...patientsData.map(p => p.patientNumber));
          return maxPatientNumber + 1;
        }
      }
    } catch (error) {
      console.error('Error getting next patient number:', error);
      return todayPatientsCount + 1;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const patientNumber = await getNextPatientNumber();
      const { date, time } = getCurrentDateTime();
      const dateKey = new Date().toISOString().split('T')[0];

      const patientData = {
        ...formData,
        patientNumber,
        date,
        time,
        dateKey,
        timestamp: new Date().toISOString(),
        status: 'pending',
        completed: false,
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight),
        temperature: formData.temperature ? parseFloat(formData.temperature) : null
      };

      // Add patient to Firestore
      const patientsRef = collection(firestore, 'patients');
      await addDoc(patientsRef, patientData);

      setMessage(`Patient added successfully! Patient Number: ${patientNumber}`);
      setTodayPatientsCount(prev => prev + 1);
      
      // Reset form
      setFormData({
        name: '',
        age: '',
        phone: '',
        weight: '',
        temperature: '',
        gender: '',
        additionalInfo: ''
      });

      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setMessage('');
      }, 5000);

    } catch (error) {
      console.error('Error adding patient:', error);
      setMessage('Error adding patient: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { date: currentDate } = getCurrentDateTime();

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4">
      <div className="mx-auto">
        
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 mb-1">Add New Patient</h1>
                <p className="text-gray-600 text-sm">Today is {currentDate}</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">{todayPatientsCount}</div>
                  <div className="text-xs text-gray-500">Today's Patients</div>
                </div>
                <div className="bg-orange-50 px-3 py-2 rounded border border-orange-200">
                  <p className="text-sm font-medium text-orange-700">{currentTime}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 text-center">
            <div className="text-lg font-semibold text-orange-600">{todayPatientsCount}</div>
            <div className="text-xs text-gray-600">Today's Total</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 text-center">
            <div className="text-lg font-semibold text-blue-600">{todayPatientsCount + 1}</div>
            <div className="text-xs text-gray-600">Next Patient No.</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 text-center">
            <div className="text-lg font-semibold text-green-600">Ready</div>
            <div className="text-xs text-gray-600">Status</div>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {message && (
            <div className={`m-4 p-3 rounded border-l-4 ${
              message.includes('Error') 
                ? 'bg-red-50 border-red-500 text-red-700' 
                : 'bg-green-50 border-green-500 text-green-700'
            }`}>
              <div className="flex items-center">
                {message.includes('Error') ? (
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="text-sm font-medium">{message}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Personal Information Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="120"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Years"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact & Medical Information Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Contact & Medical Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="+91 8668722207"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Weight (kg) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      required
                      min="1"
                      max="300"
                      className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="0.0"
                    />
                    <span className="absolute right-3 top-2 text-xs text-gray-500">kg</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Body Temperature
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      name="temperature"
                      value={formData.temperature}
                      onChange={handleInputChange}
                      min="10"
                      max="140"
                      className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="36.6"
                    />
                    <span className="absolute right-3 top-2 text-xs text-gray-500">°C</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Additional Information
              </h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Notes & Comments
                </label>
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 resize-none"
                  placeholder="Enter any additional notes, symptoms, or important information about the patient..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding Patient...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add New Patient
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Info */}
        <div className="mt-3 text-center text-xs text-gray-500">
          Ensure all required fields are filled before submitting
        </div>
      </div>
    </div>
  );
};

export default AddPatient;