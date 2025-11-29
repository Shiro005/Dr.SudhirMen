import React, { useState, useEffect } from 'react';
import {
  firestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  updateDoc,
  doc
} from '../Database/Firebase';

const DoctorView = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Fetch patients from Firestore
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const patientsRef = collection(firestore, 'patients');

      // Query with date filter
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
      // Fallback without ordering
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

  // Filter patients based on search term and status filter
  useEffect(() => {
    let filtered = patients;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone?.includes(searchTerm) ||
        patient.patientNumber?.toString().includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(patient =>
        statusFilter === 'completed' ? patient.completed : !patient.completed
      );
    }

    setFilteredPatients(filtered);
  }, [patients, searchTerm, statusFilter]);

  const handleStatusChange = async (patientId, completed) => {
    try {
      const patientRef = doc(firestore, 'patients', patientId);
      await updateDoc(patientRef, {
        completed: completed,
        status: completed ? 'completed' : 'pending'
      });

      // Update local state
      setPatients(prev => prev.map(p =>
        p.id === patientId ? { ...p, completed, status: completed ? 'completed' : 'pending' } : p
      ));
    } catch (error) {
      console.error('Error updating patient status:', error);
      alert('Error updating patient status');
    }
  };

  const formatDateForDisplay = (dateString) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStats = () => {
    const total = patients.length;
    const completed = patients.filter(p => p.completed).length;
    const pending = total - completed;
    return { total, completed, pending };
  };

  // const generatePrintableReport = (patient) => {
  //   return `
  //     <!DOCTYPE html>
  //     <html>
  //     <head>
  //       <title>Patient Report - ${patient.name}</title>
  //       <meta charset="UTF-8">
  //       <style>
  //         @media print {
  //           @page {
  //             size: A4;
  //             margin: 40px 25px 25px 25px;
  //           }
  //           body {
  //             font-family: 'Arial', sans-serif;
  //             font-size: 12px;
  //             line-height: 1.4;
  //             color: #000;
  //             margin: 0;
  //             padding: 0;
  //           }
  //         }
  //         body {
  //           font-family: 'Arial', sans-serif;
  //           font-size: 12px;
  //           line-height: 1.4;
  //           color: #000;
  //           margin: 0;
  //           padding: 0;
  //         }
  //         .clinic-header {
  //           text-align: center;
  //           border-bottom: 2px solid #333;
  //           padding-bottom: 15px;
  //           margin-bottom: 20px;
  //         }
  //         .clinic-header h1 {
  //           font-size: 18px;
  //           margin: 0 0 5px 0;
  //           color: #333;
  //         }
  //         .clinic-header p {
  //           font-size: 11px;
  //           margin: 2px 0;
  //           color: #666;
  //         }
  //         .report-title {
  //           text-align: center;
  //           font-size: 14px;
  //           font-weight: bold;
  //           margin: 15px 0;
  //           color: #333;
  //         }
  //         .patient-info {
  //           margin: 15px 0;
  //         }
  //         .info-section {
  //           margin: 10px 0;
  //         }
  //         .info-row {
  //           display: flex;
  //           margin: 3px 0;
  //         }
  //         .info-label {
  //           font-weight: bold;
  //           min-width: 120px;
  //         }
  //         .vital-signs {
  //           margin: 15px 0;
  //         }
  //         .additional-info {
  //           margin: 15px 0;
  //         }
  //         .footer {
  //           margin-top: 30px;
  //           text-align: center;
  //           font-size: 10px;
  //           color: #666;
  //           border-top: 1px solid #ccc;
  //           padding-top: 10px;
  //         }
  //         .signature-area {
  //           margin-top: 40px;
  //           border-top: 1px solid #000;
  //           width: 200px;
  //           padding-top: 5px;
  //           font-size: 11px;
  //         }
  //       </style>
  //     </head>
  //     <body>
  //       <!-- Clinic Branding Header -->
  //       <div class="clinic-header">
  //         <h1>SARYODAY CLINIC</h1>
  //         <p>Healthcare Excellence Since 2010</p>
  //         <p>123 Medical Street, Healthcare City | Phone: (555) 123-4567</p>
  //         <p>Email: contact@saryodayclinic.com | www.saryodayclinic.com</p>
  //       </div>

  //       <!-- Report Title -->
  //       <div class="report-title">
  //         PATIENT MEDICAL REPORT
  //       </div>

  //       <!-- Patient Information -->
  //       <div class="patient-info">
  //         <div class="info-section">
  //           <div class="info-row">
  //             <span class="info-label">Report Date:</span>
  //             <span>${new Date().toLocaleDateString()}</span>
  //           </div>
  //           <div class="info-row">
  //             <span class="info-label">Patient ID:</span>
  //             <span>#${patient.patientNumber}</span>
  //           </div>
  //           <div class="info-row">
  //             <span class="info-label">Full Name:</span>
  //             <span>${patient.name}</span>
  //           </div>
  //           <div class="info-row">
  //             <span class="info-label">Age:</span>
  //             <span>${patient.age} years</span>
  //           </div>
  //           <div class="info-row">
  //             <span class="info-label">Gender:</span>
  //             <span>${patient.gender || 'Not specified'}</span>
  //           </div>
  //           <div class="info-row">
  //             <span class="info-label">Phone:</span>
  //             <span>${patient.phone}</span>
  //           </div>
  //           <div class="info-row">
  //             <span class="info-label">Visit Date:</span>
  //             <span>${patient.date}</span>
  //           </div>
  //           <div class="info-row">
  //             <span class="info-label">Visit Time:</span>
  //             <span>${patient.time}</span>
  //           </div>
  //         </div>
  //       </div>

  //       <!-- Vital Signs -->
  //       <div class="vital-signs">
  //         <div style="font-weight: bold; margin-bottom: 8px;">VITAL SIGNS</div>
  //         <div class="info-row">
  //           <span class="info-label">Weight:</span>
  //           <span>${patient.weight} kg</span>
  //         </div>
  //         <div class="info-row">
  //           <span class="info-label">Temperature:</span>
  //           <span>${patient.temperature || 'N/A'} °C</span>
  //         </div>
  //       </div>

  //       <!-- Additional Information -->
  //       ${patient.additionalInfo ? `
  //       <div class="additional-info">
  //         <div style="font-weight: bold; margin-bottom: 8px;">ADDITIONAL NOTES</div>
  //         <div style="margin: 5px 0; line-height: 1.3;">${patient.additionalInfo}</div>
  //       </div>
  //       ` : ''}

  //       <!-- Visit Status -->
  //       <div style="margin: 15px 0;">
  //         <div class="info-row">
  //           <span class="info-label">Visit Status:</span>
  //           <span style="font-weight: bold; color: ${patient.completed ? '#059669' : '#d97706'}">
  //             ${patient.completed ? 'COMPLETED' : 'PENDING'}
  //           </span>
  //         </div>
  //       </div>

  //       <!-- Doctor's Notes Area -->
  //       <div style="margin: 25px 0;">
  //         <div style="font-weight: bold; margin-bottom: 8px;">DOCTOR'S NOTES</div>
  //         <div style="border: 1px solid #ccc; min-height: 80px; padding: 8px; margin: 5px 0;">
  //           <!-- Empty space for doctor to write notes -->
  //         </div>
  //       </div>

  //       <!-- Signature Area -->
  //       <div style="display: flex; justify-content: space-between; margin-top: 40px;">
  //         <div class="signature-area">
  //           Patient's Signature
  //         </div>
  //         <div class="signature-area">
  //           Doctor's Signature & Stamp
  //         </div>
  //       </div>

  //       <!-- Footer -->
  //       <div class="footer">
  //         <p>This is a computer-generated report. No physical signature is required for digital records.</p>
  //         <p>Generated on ${new Date().toLocaleString()} • Saryoday Clinic Management System</p>
  //       </div>
  //     </body>
  //     </html>
  //   `;
  // };

  const generatePrintableReport = (patient) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Patient Report - ${patient.name}</title>
      <meta charset="UTF-8">
      <style>
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
        
        body {
          font-family: 'Arial', sans-serif;
          font-size: 12px;
          line-height: 1.2;
          color: #000;
          margin: 0;
          padding: 0;
          height: 100vh;
        }
        
        .top-space {
          height: 20vh;
          background: transparent;
        }
        
        .content-area {
          margin: 0 15px;
        }
        
        .patient-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
          border-bottom: 1px solid #000;
          padding-bottom: 5px;
        }
        
        .patient-left {
          flex: 1;
        }
        
        .patient-right {
          text-align: right;
          flex: 1;
        }
        
        .patient-name {
          font-size: 14px;
          font-weight: bold;
          margin: 0;
        }
        
        .patient-details {
          margin: 2px 0;
          font-size: 11px;
        }
        
        .detail-row {
          display: flex;
          margin: 1px 0;
        }
        
        .detail-label {
          font-weight: bold;
          min-width: 80px;
        }
        
        .detail-value {
          flex: 1;
        }
        
        .section {
          margin: 8px 0;
        }
        
        .section-title {
          font-weight: bold;
          margin-bottom: 3px;
          font-size: 11px;
        }
        
        .vital-signs {
          display: flex;
          gap: 20px;
          margin: 5px 0;
        }
        
        .vital-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .additional-notes {
          margin: 8px 0;
          padding: 5px;
          border: 1px solid #ccc;
          min-height: 60px;
          font-size: 11px;
        }
        
        .doctor-notes {
          margin: 8px 0;
          padding: 5px;
          border: 1px solid #ccc;
          min-height: 80px;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <!-- Top 20% Blank Space -->
      <div class="top-space"></div>
      
      <!-- Content Area with Narrow Margins -->
      <div class="content-area">
        
        <!-- Patient Header Row -->
        <div class="patient-header">
          <div class="patient-left">
            <div class="patient-name">${patient.name}</div>
            <div class="patient-details">
              <div><strong>Age:</strong> ${patient.age} years</div>
              <div><strong>Gender:</strong> ${patient.gender || 'Not specified'}</div>
            </div>
          </div>
          
          <div class="patient-right">
            <div class="patient-details">
              <div><strong>Weight:</strong> ${patient.weight} kg</div>
              <div><strong>Date:</strong> ${patient.date}</div>
              <div><strong>Time:</strong> ${patient.time}</div>
            </div>
          </div>
        </div>
        
        <!-- Patient Number -->
        <div style="text-align: center; margin: 5px 0; font-weight: bold;">
          Patient Number: ${patient.patientNumber}
        </div>
        
        
      
      </div>
    </body>
    </html>
  `;
  };

  const printPatientReport = (patient) => {
    const printContent = generatePrintableReport(patient);
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      // Close window after printing
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
  };

  const stats = getStats();

  const completedPatients = patients.filter(p => p.completed);
  const pendingPatients = patients.filter(p => !p.completed);

  const renderPatientTable = (patientList) => (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">#</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Age</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Phone</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Weight</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Temp</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Time</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {patientList.map((patient) => (
            <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                {patient.patientNumber}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {patient.name}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {patient.age}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {patient.phone}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {patient.weight} kg
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {patient.temperature || 'N/A'}°C
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {patient.time}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${patient.completed
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                  }`}>
                  {patient.completed ? 'Completed' : 'Pending'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-1">
                <button
                  onClick={() => handleStatusChange(patient.id, !patient.completed)}
                  className={`px-2 py-1 rounded text-xs ${patient.completed
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                    } transition-colors`}
                >
                  {patient.completed ? 'Mark Pending' : 'Mark Done'}
                </button>
                <button
                  onClick={() => printPatientReport(patient)}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                >
                  Print
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4">
      <div className="">

        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 mb-1">Doctor's View</h1>
                <p className="text-gray-600 text-sm">Manage patient visits and status</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">{stats.total}</div>
                  <div className="text-xs text-gray-500">Total Patients</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                  />
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Patients</option>
                <option value="pending">Pending Only</option>
                <option value="completed">Completed Only</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">View</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${activeTab === 'all'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  All ({patients.length})
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${activeTab === 'pending'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Pending ({pendingPatients.length})
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${activeTab === 'completed'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Completed ({completedPatients.length})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Patient List */}
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
            <>
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h3 className="text-sm font-medium text-gray-700">
                  {activeTab === 'all' && `All Patients - ${formatDateForDisplay(selectedDate)}`}
                  {activeTab === 'pending' && `Pending Patients - ${formatDateForDisplay(selectedDate)}`}
                  {activeTab === 'completed' && `Completed Patients - ${formatDateForDisplay(selectedDate)}`}
                  <span className="text-gray-500 ml-2">({filteredPatients.length} patients)</span>
                </h3>
              </div>
              {renderPatientTable(
                activeTab === 'all' ? filteredPatients :
                  activeTab === 'pending' ? filteredPatients.filter(p => !p.completed) :
                    filteredPatients.filter(p => p.completed)
              )}
            </>
          )}
        </div>

        {/* Footer Info */}
        {filteredPatients.length > 0 && (
          <div className="mt-3 text-center text-xs text-gray-500">
            Last updated: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorView;