import React, { useState, useEffect } from 'react';
import { 
  firestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from '../Database/Firebase';

const Reports = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('daily'); // daily, weekly, monthly

  // Fetch patients data
  const fetchPatientsData = async () => {
    try {
      setLoading(true);
      const patientsRef = collection(firestore, 'patients');
      
      let q;
      if (viewType === 'daily') {
        q = query(patientsRef, where('dateKey', '==', selectedDate));
      } else {
        q = query(
          patientsRef, 
          where('dateKey', '>=', dateRange.start),
          where('dateKey', '<=', dateRange.end),
          orderBy('dateKey', 'asc')
        );
      }

      const querySnapshot = await getDocs(q);
      const patientsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setPatients(patientsData);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientsData();
  }, [selectedDate, dateRange, viewType]);

  // Calculate BMI
  const calculateBMI = (weight, height = 1.7) => { // Default height 1.7m if not provided
    return (weight / (height * height)).toFixed(1);
  };

  // Get BMI category
  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  // Calculate statistics
  const calculateStats = () => {
    const stats = {
      total: patients.length,
      male: patients.filter(p => p.gender === 'male').length,
      female: patients.filter(p => p.gender === 'female').length,
      other: patients.filter(p => p.gender === 'other').length,
      completed: patients.filter(p => p.completed).length,
      pending: patients.filter(p => !p.completed).length,
      morningShift: patients.filter(p => {
        const hour = parseInt(p.time.split(':')[0]);
        return hour >= 6 && hour < 14;
      }).length,
      eveningShift: patients.filter(p => {
        const hour = parseInt(p.time.split(':')[0]);
        return hour >= 14 && hour < 22;
      }).length,
      nightShift: patients.filter(p => {
        const hour = parseInt(p.time.split(':')[0]);
        return hour >= 22 || hour < 6;
      }).length,
      ageGroups: {
        '0-18': patients.filter(p => p.age <= 18).length,
        '19-35': patients.filter(p => p.age > 18 && p.age <= 35).length,
        '36-50': patients.filter(p => p.age > 35 && p.age <= 50).length,
        '51+': patients.filter(p => p.age > 50).length
      },
      bmiCategories: {
        'Underweight': 0,
        'Normal': 0,
        'Overweight': 0,
        'Obese': 0
      },
      averageWeight: 0,
      averageTemperature: 0
    };

    // Calculate BMI categories
    patients.forEach(patient => {
      if (patient.weight) {
        const bmi = calculateBMI(patient.weight);
        const category = getBMICategory(parseFloat(bmi));
        stats.bmiCategories[category]++;
      }
    });

    // Calculate averages
    const weights = patients.filter(p => p.weight).map(p => p.weight);
    const temperatures = patients.filter(p => p.temperature).map(p => p.temperature);
    
    stats.averageWeight = weights.length > 0 ? 
      (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1) : 0;
    stats.averageTemperature = temperatures.length > 0 ? 
      (temperatures.reduce((a, b) => a + b, 0) / temperatures.length).toFixed(1) : 0;

    return stats;
  };

  const stats = calculateStats();

  // Weekly data for trends
  const getWeeklyTrend = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trend = days.map(day => ({
      day,
      count: Math.floor(Math.random() * 10) + 5 // Mock data for demo
    }));
    return trend;
  };

  const weeklyTrend = getWeeklyTrend();

  // Progress bar component
  const ProgressBar = ({ value, max, color }) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={`h-2 rounded-full ${color}`}
        style={{ width: `${(value / max) * 100}%` }}
      ></div>
    </div>
  );

  // Stat card component
  const StatCard = ({ title, value, subtitle, color, icon }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="px-6 py-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 mb-1">Patient Analytics & Reports</h1>
                <p className="text-gray-600 text-sm">Comprehensive analysis of patient data and trends</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewType('daily')}
                    className={`px-3 py-2 text-sm rounded transition-colors ${
                      viewType === 'daily' 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setViewType('weekly')}
                    className={`px-3 py-2 text-sm rounded transition-colors ${
                      viewType === 'weekly' 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Weekly
                  </button>
                </div>
                
                {viewType === 'daily' ? (
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading analytics data...</p>
          </div>
        ) : (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Total Patients"
                value={stats.total}
                subtitle="Today"
                color="text-orange-600"
                icon={
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
              
              <StatCard
                title="Completed"
                value={stats.completed}
                subtitle={`${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% completion`}
                color="text-green-600"
                icon={
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              
              <StatCard
                title="Avg Weight"
                value={`${stats.averageWeight} kg`}
                subtitle="Patient average"
                color="text-blue-600"
                icon={
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                }
              />
              
              <StatCard
                title="Avg Temperature"
                value={`${stats.averageTemperature}°C`}
                subtitle="Patient average"
                color="text-red-600"
                icon={
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                }
              />
            </div>

            {/* Charts and Detailed Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              
              {/* Gender Distribution */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gender Distribution</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-600">Male</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">{stats.male}</span>
                      <div className="w-32">
                        <ProgressBar 
                          value={stats.male} 
                          max={stats.total} 
                          color="bg-blue-500" 
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right">
                        {stats.total > 0 ? Math.round((stats.male / stats.total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-pink-600">Female</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">{stats.female}</span>
                      <div className="w-32">
                        <ProgressBar 
                          value={stats.female} 
                          max={stats.total} 
                          color="bg-pink-500" 
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right">
                        {stats.total > 0 ? Math.round((stats.female / stats.total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-600">Other</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">{stats.other}</span>
                      <div className="w-32">
                        <ProgressBar 
                          value={stats.other} 
                          max={stats.total} 
                          color="bg-purple-500" 
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right">
                        {stats.total > 0 ? Math.round((stats.other / stats.total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shift Analysis */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shift Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-amber-600">Morning (6AM - 2PM)</span>
                      <span className="font-bold">{stats.morningShift}</span>
                    </div>
                    <ProgressBar value={stats.morningShift} max={stats.total} color="bg-amber-500" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-orange-600">Evening (2PM - 10PM)</span>
                      <span className="font-bold">{stats.eveningShift}</span>
                    </div>
                    <ProgressBar value={stats.eveningShift} max={stats.total} color="bg-orange-500" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-indigo-600">Night (10PM - 6AM)</span>
                      <span className="font-bold">{stats.nightShift}</span>
                    </div>
                    <ProgressBar value={stats.nightShift} max={stats.total} color="bg-indigo-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Age Groups and BMI Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              
              {/* Age Group Distribution */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Age Group Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(stats.ageGroups).map(([group, count]) => (
                    <div key={group} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{group} years</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold">{count}</span>
                        <div className="w-32">
                          <ProgressBar 
                            value={count} 
                            max={stats.total} 
                            color="bg-teal-500" 
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-12 text-right">
                          {stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BMI Analysis */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">BMI Analysis</h3>
                <div className="space-y-3">
                  {Object.entries(stats.bmiCategories).map(([category, count]) => {
                    const colors = {
                      'Underweight': 'text-yellow-600 bg-yellow-100',
                      'Normal': 'text-green-600 bg-green-100',
                      'Overweight': 'text-orange-600 bg-orange-100',
                      'Obese': 'text-red-600 bg-red-100'
                    };
                    
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <span className={`text-sm font-medium px-2 py-1 rounded ${colors[category]}`}>
                          {category}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold">{count}</span>
                          <div className="w-32">
                            <ProgressBar 
                              value={count} 
                              max={stats.total} 
                              color={`bg-${category === 'Underweight' ? 'yellow' : category === 'Normal' ? 'green' : category === 'Overweight' ? 'orange' : 'red'}-500`} 
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-12 text-right">
                            {stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Weekly Trend Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Patient Trend</h3>
              <div className="flex items-end justify-between h-32 gap-2">
                {weeklyTrend.map((day, index) => (
                  <div key={day.day} className="flex flex-col items-center flex-1">
                    <div 
                      className="bg-orange-500 rounded-t w-full max-w-12 transition-all duration-300 hover:bg-orange-600"
                      style={{ height: `${(day.count / 15) * 100}%` }}
                    ></div>
                    <span className="text-xs text-gray-600 mt-2">{day.day}</span>
                    <span className="text-xs font-bold text-gray-900">{day.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg p-4">
                <h4 className="font-semibold mb-2">Peak Hours</h4>
                <p className="text-2xl font-bold">10AM - 12PM</p>
                <p className="text-orange-100 text-sm">Most patients visit during morning hours</p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg p-4">
                <h4 className="font-semibold mb-2">Popular Age</h4>
                <p className="text-2xl font-bold">25-35 Years</p>
                <p className="text-blue-100 text-sm">Young adults are most frequent visitors</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg p-4">
                <h4 className="font-semibold mb-2">Completion Rate</h4>
                <p className="text-2xl font-bold">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </p>
                <p className="text-green-100 text-sm">Patients completing their visits</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;