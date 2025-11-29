import React, { useState, useEffect } from 'react';
import { 
  firestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit
} from '../Database/Firebase';
import * as XLSX from 'xlsx';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    gender: '',
    status: ''
  });

  // Filter options
  const genderOptions = ['', 'male', 'female', 'other'];
  const statusOptions = ['', 'pending', 'completed'];

  // Fetch patients from Firestore
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const patientsRef = collection(firestore, 'patients');
      
      // Query with date filter and order by patient number
      const q = query(
        patientsRef,
        where('dateKey', '==', selectedDate),
        orderBy('patientNumber', 'asc')
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setPatients([]);
        setFilteredPatients([]);
        return;
      }

      const patientsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setPatients(patientsData);
      setFilteredPatients(patientsData);

    } catch (error) {
      console.error('Error fetching patients:', error);
      // Fallback: Try without ordering if index is missing
      try {
        const patientsRef = collection(firestore, 'patients');
        const q = query(patientsRef, where('dateKey', '==', selectedDate));
        const querySnapshot = await getDocs(q);
        
        const patientsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => a.patientNumber - b.patientNumber);

        setPatients(patientsData);
        setFilteredPatients(patientsData);
      } catch (fallbackError) {
        console.error('Fallback fetch failed:', fallbackError);
        setPatients([]);
        setFilteredPatients([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch when date changes
  useEffect(() => {
    fetchPatients();
  }, [selectedDate]);

  // Apply filters whenever patients, search term, or filters change
  useEffect(() => {
    let result = patients;

    // Search filter
    if (searchTerm) {
      result = result.filter(patient =>
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone?.includes(searchTerm) ||
        patient.patientNumber?.toString().includes(searchTerm)
      );
    }

    // Gender filter
    if (filters.gender) {
      result = result.filter(patient => patient.gender === filters.gender);
    }

    // Status filter
    if (filters.status) {
      result = result.filter(patient => 
        filters.status === 'completed' ? patient.completed : !patient.completed
      );
    }

    setFilteredPatients(result);
  }, [patients, searchTerm, filters]);

  const formatDateForDisplay = (dateString) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const sendWhatsAppMessage = (patient) => {
    const message = `Hello ${patient.name},\n\nThank you for visiting Saryoday Clinic. Here are your details:\n\nPatient Number: ${patient.patientNumber}\nName: ${patient.name}\nAge: ${patient.age}\nWeight: ${patient.weight} kg\nTemperature: ${patient.temperature}°C\nDate: ${patient.date}\nTime: ${patient.time}\n\nThank you for trusting us with your healthcare. Stay healthy!\n\nBest regards,\nSaryoday Clinic`;
    
    const whatsappUrl = `https://wa.me/${patient.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredPatients.map(patient => ({
      'Patient No.': patient.patientNumber,
      'Name': patient.name,
      'Age': patient.age,
      'Gender': patient.gender || 'Not specified',
      'Phone': patient.phone,
      'Weight (kg)': patient.weight,
      'Temperature (°C)': patient.temperature,
      'Date': patient.date,
      'Time': patient.time,
      'Status': patient.completed ? 'Completed' : 'Pending',
      'Additional Info': patient.additionalInfo || ''
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');
    XLSX.writeFile(workbook, `patients_${selectedDate}.xlsx`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      gender: '',
      status: ''
    });
  };

  const getStats = () => {
    return {
      total: filteredPatients.length,
      completed: filteredPatients.filter(p => p.completed).length,
      pending: filteredPatients.filter(p => !p.completed).length
    };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4">
      <div className="mx-auto">
        
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 mb-1">Patient Records</h1>
                <p className="text-gray-600 text-sm">{formatDateForDisplay(selectedDate)}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">{stats.total}</div>
                  <div className="text-xs text-gray-500">Total Patients</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 text-center">
            <div className="text-lg font-semibold text-green-600">{stats.completed}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 text-center">
            <div className="text-lg font-semibold text-orange-600">{stats.pending}</div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 text-center">
            <div className="text-lg font-semibold text-blue-600">{filteredPatients.length}</div>
            <div className="text-xs text-gray-600">Filtered</div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Name, phone, or patient no..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 pl-9 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                />
                <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => setFilters({...filters, gender: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              >
                {genderOptions.map(option => (
                  <option key={option} value={option}>
                    {option ? option.charAt(0).toUpperCase() + option.slice(1) : 'All Gender'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>
                    {option ? option.charAt(0).toUpperCase() + option.slice(1) : 'All Status'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={downloadExcel}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </button>
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 text-sm">Loading patients...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">No patients found</p>
              <p className="text-xs mt-1">Try adjusting your filters or select a different date</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Patient Info</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Details</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Visit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{patient.name}</div>
                          <div className="text-xs text-orange-600 font-medium">#{patient.patientNumber}</div>
                          <div className="text-xs text-gray-500">{patient.age} yrs • {patient.gender || 'N/A'}</div>
                          <div className="text-xs text-blue-600">{patient.phone}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Weight:</span> {patient.weight} kg
                          </div>
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Temp:</span> {patient.temperature || 'N/A'}°C
                          </div>
                          {patient.additionalInfo && (
                            <div className="text-xs text-gray-500 max-w-xs truncate" title={patient.additionalInfo}>
                              {patient.additionalInfo}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs text-gray-900">{patient.date}</div>
                        <div className="text-xs text-gray-500">{patient.time}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          patient.completed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {patient.completed ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => sendWhatsAppMessage(patient)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Send WhatsApp Message"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        {filteredPatients.length > 0 && (
          <div className="mt-3 text-center text-xs text-gray-500">
            Showing {filteredPatients.length} patients • 
            Last updated: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientList;