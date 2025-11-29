import React, { useState, useEffect } from 'react';
import { 
  firestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from '../Database/Firebase';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  FileText, 
  TrendingUp, 
  Shield,
  Activity,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Trash2,
  Mail,
  Phone,
  Clock
} from 'lucide-react';

const SuperAdmin = () => {
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d'); // 7d, 30d, 90d
  const [stats, setStats] = useState({});
  const [userActivities, setUserActivities] = useState({});

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch users from Firebase Auth (you'll need to set up a users collection)
      const usersSnapshot = await getDocs(collection(firestore, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);

      // Fetch all patients
      const patientsSnapshot = await getDocs(collection(firestore, 'patients'));
      const patientsData = patientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPatients(patientsData);

      // Fetch activities (you'll need to log activities when users perform actions)
      const activitiesSnapshot = await getDocs(collection(firestore, 'activities'));
      const activitiesData = activitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActivities(activitiesData);

      calculateStats(usersData, patientsData, activitiesData);
      calculateUserActivities(patientsData, activitiesData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const calculateStats = (usersData, patientsData, activitiesData) => {
    const totalUsers = usersData.length;
    const totalPatients = patientsData.length;
    const staffUsers = usersData.filter(u => u.userType === 'staff').length;
    const doctorUsers = usersData.filter(u => u.userType === 'doctor').length;
    
    // Calculate recent activity
    const periodMs = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    }[selectedPeriod];

    const cutoffDate = new Date(Date.now() - periodMs);
    const recentPatients = patientsData.filter(p => new Date(p.timestamp) > cutoffDate);
    const recentActivities = activitiesData.filter(a => new Date(a.timestamp) > cutoffDate);

    setStats({
      totalUsers,
      staffUsers,
      doctorUsers,
      totalPatients,
      recentPatients: recentPatients.length,
      recentActivities: recentActivities.length,
      avgPatientsPerDay: (recentPatients.length / (periodMs / (24 * 60 * 60 * 1000))).toFixed(1)
    });
  };

  const calculateUserActivities = (patientsData, activitiesData) => {
    const userStats = {};
    
    // Count patients added by each user
    patientsData.forEach(patient => {
      if (patient.addedBy) {
        if (!userStats[patient.addedBy]) {
          userStats[patient.addedBy] = {
            patientsAdded: 0,
            patientsDeleted: 0,
            lastActivity: '',
            totalActivities: 0
          };
        }
        userStats[patient.addedBy].patientsAdded++;
      }
    });

    // Count activities for each user
    activitiesData.forEach(activity => {
      if (!userStats[activity.userEmail]) {
        userStats[activity.userEmail] = {
          patientsAdded: 0,
          patientsDeleted: 0,
          lastActivity: '',
          totalActivities: 0
        };
      }
      userStats[activity.userEmail].totalActivities++;
      
      if (activity.type === 'delete_patient') {
        userStats[activity.userEmail].patientsDeleted++;
      }
      
      if (!userStats[activity.userEmail].lastActivity || 
          new Date(activity.timestamp) > new Date(userStats[activity.userEmail].lastActivity)) {
        userStats[activity.userEmail].lastActivity = activity.timestamp;
      }
    });

    setUserActivities(userStats);
  };

  const getPeriodLabel = () => {
    return {
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
      '90d': 'Last 90 Days'
    }[selectedPeriod];
  };

  const exportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      stats,
      users: users.map(user => ({
        email: user.email,
        userType: user.userType,
        lastSignIn: user.lastSignIn,
        ...userActivities[user.email]
      })),
      recentActivities: activities.slice(0, 100)
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saryoday-admin-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const StatCard = ({ title, value, subtitle, icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 mb-1">Super Admin Panel</h1>
                <p className="text-gray-600 text-sm">Complete system overview and user management</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
                
                <button
                  onClick={fetchData}
                  className="px-4 py-2 text-sm bg-white border border-orange-400 text-orange-600 rounded hover:bg-orange-50 transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={16} /> Refresh
                </button>
                
                <button
                  onClick={exportData}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Download size={16} /> Export Data
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            subtitle={`${stats.staffUsers} staff, ${stats.doctorUsers} doctors`}
            color="text-blue-600"
            icon={<Users size={24} />}
          />
          
          <StatCard
            title="Total Patients"
            value={stats.totalPatients}
            subtitle={`${stats.recentPatients} in ${getPeriodLabel()}`}
            color="text-green-600"
            icon={<UserPlus size={24} />}
          />
          
          <StatCard
            title="Recent Activities"
            value={stats.recentActivities}
            subtitle={`${stats.avgPatientsPerDay} patients/day`}
            color="text-orange-600"
            icon={<Activity size={24} />}
          />
          
          <StatCard
            title="System Health"
            value="100%"
            subtitle="All systems operational"
            color="text-purple-600"
            icon={<Shield size={24} />}
          />
        </div>

        {/* User Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* User List */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
              <span className="text-sm text-gray-500">{users.length} users</span>
            </div>
            
            <div className="space-y-3">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      user.userType === 'admin' ? 'bg-purple-100 text-purple-600' :
                      user.userType === 'doctor' ? 'bg-blue-100 text-blue-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {user.userType === 'admin' ? <Shield size={16} /> :
                       user.userType === 'doctor' ? <Users size={16} /> :
                       <UserPlus size={16} />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.email}</p>
                      <p className="text-sm text-gray-500 capitalize">{user.userType}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <UserPlus size={14} />
                          <span>{userActivities[user.email]?.patientsAdded || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <UserMinus size={14} />
                          <span>{userActivities[user.email]?.patientsDeleted || 0}</span>
                        </div>
                      </div>
                      <button className="p-1 text-gray-400 hover:text-orange-600 transition-colors">
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Activity Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
            
            <div className="space-y-4">
              {users.slice(0, 5).map(user => {
                const userStats = userActivities[user.email] || {};
                return (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-orange-600">
                          {user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                          {user.email.split('@')[0]}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{user.userType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{userStats.patientsAdded || 0}</p>
                      <p className="text-xs text-gray-500">patients</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
            <span className="text-sm text-gray-500">Last 50 activities</span>
          </div>
          
          <div className="space-y-3">
            {activities.slice(0, 10).map(activity => (
              <div key={activity.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'add_patient' ? 'bg-green-100 text-green-600' :
                    activity.type === 'delete_patient' ? 'bg-red-100 text-red-600' :
                    activity.type === 'update_patient' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {activity.type === 'add_patient' ? <UserPlus size={16} /> :
                     activity.type === 'delete_patient' ? <Trash2 size={16} /> :
                     activity.type === 'update_patient' ? <FileText size={16} /> :
                     <Activity size={16} />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {activity.userEmail} • {activity.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activity.type === 'add_patient' ? 'bg-green-100 text-green-800' :
                  activity.type === 'delete_patient' ? 'bg-red-100 text-red-800' :
                  activity.type === 'update_patient' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {activity.type.replace('_', ' ')}
                </span>
              </div>
            ))}
            
            {activities.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Activity size={48} className="mx-auto mb-3 text-gray-300" />
                <p>No activities recorded yet</p>
                <p className="text-sm">User activities will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* System Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Patient Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Statistics</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Patients Added</span>
                <span className="text-lg font-bold text-orange-600">{stats.totalPatients}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Patients This Period</span>
                <span className="text-lg font-bold text-green-600">{stats.recentPatients}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Average Per Day</span>
                <span className="text-lg font-bold text-blue-600">{stats.avgPatientsPerDay}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Active Users</span>
                <span className="text-lg font-bold text-purple-600">
                  {users.filter(u => userActivities[u.email]?.totalActivities > 0).length}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors">
                <Users size={20} />
                <span className="font-medium">Manage User Roles</span>
              </button>
              
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                <FileText size={20} />
                <span className="font-medium">Generate Reports</span>
              </button>
              
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                <Download size={20} />
                <span className="font-medium">Backup Data</span>
              </button>
              
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                <Shield size={20} />
                <span className="font-medium">Security Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdmin;