// App.jsx - Role-based access control with Super Admin panel
import React, { useState, useEffect } from 'react';
import AddPatient from './Pages/AddPatient';
import PatientList from './Pages/PatientList';
import DoctorView from './Pages/DoctorView';
import Login from './Pages/Login';
import Reports from './Pages/Reports';
import SuperAdmin from './Pages/SuperAdmin';
import { Menu, X, UserPlus, ListOrdered, Stethoscope, LogOut, FilesIcon, Shield, Users } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [userType, setUserType] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);

  // Auto-login from localStorage
  useEffect(() => {
    const savedAuth = localStorage.getItem('clinicAuth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      setIsAuthenticated(true);
      setUserType(authData.userType);
      setUserEmail(authData.email);
      setUserData(authData);
      
      // Set initial view based on user type
      if (authData.userType === 'doctor') {
        setCurrentView('doctorView');
      } else if (authData.userType === 'admin') {
        setCurrentView('superAdmin');
      } else {
        setCurrentView('addPatient');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUserType(userData.userType);
    setUserEmail(userData.email);
    setUserData(userData);
    
    localStorage.setItem('clinicAuth', JSON.stringify({
      userType: userData.userType,
      email: userData.email,
      name: userData.name,
      uid: userData.uid,
      timestamp: new Date().getTime()
    }));

    // Redirect based on user type
    if (userData.userType === 'doctor') {
      setCurrentView('doctorView');
    } else if (userData.userType === 'admin') {
      setCurrentView('superAdmin');
    } else {
      setCurrentView('addPatient');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserType(null);
    setUserEmail('');
    setUserData(null);
    setCurrentView('login');
    localStorage.removeItem('clinicAuth');
  };

  const handleNavigation = (view) => {
    setCurrentView(view);
    setMenuOpen(false);
  };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      {
        id: 'addPatient',
        label: 'Add Patient',
        icon: UserPlus,
        visible: ['staff', 'doctor', 'admin']
      },
      {
        id: 'patientList',
        label: 'Patient List',
        icon: ListOrdered,
        visible: ['staff', 'doctor', 'admin']
      }
    ];

    const doctorItems = [
      {
        id: 'doctorView',
        label: 'Doctor View',
        icon: Stethoscope,
        visible: ['doctor', 'admin']
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: FilesIcon,
        visible: ['doctor', 'admin']
      }
    ];

    const adminItems = [
      {
        id: 'superAdmin',
        label: 'Admin Panel',
        icon: Shield,
        visible: ['admin']
      }
    ];

    return [...baseItems, ...doctorItems, ...adminItems].filter(item => 
      item.visible.includes(userType)
    );
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <nav className="sticky top-0 bg-white border-b border-orange-300 px-4 py-3 shadow-sm z-50">
        <div className="flex justify-between items-center">

          {/* Clinic Title & User Info */}
          <div className="flex items-center justify-center gap-2">
            <div className="text-white">
              <img src='https://cdn-icons-gif.flaticon.com/19017/19017481.gif' className='w-10 h-10' alt="Clinic Logo" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-orange-600">Saryoday Clinic</h1>
              <p className='text-sm text-gray-600 font-mono'>Dr. Sudhir Men</p>
            </div>
          </div>

          {/* User Info */}
          <div className="hidden md:flex items-center gap-4 mr-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">
                {userData?.name || userEmail}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {userType === 'admin' ? 'Super Admin' : userType}
              </p>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              userType === 'admin' ? 'bg-purple-100 text-purple-800' :
              userType === 'doctor' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              {userType === 'admin' ? 'Admin' : userType}
            </div>
          </div>

          {/* Mobile Menu Icon */}
          <button
            className="md:hidden text-orange-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-3">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium border ${
                  currentView === item.id 
                    ? 'bg-orange-500 text-white border-orange-500' 
                    : 'bg-white text-orange-600 border-orange-400'
                } transition`}
              >
                <item.icon size={18} /> {item.label}
              </button>
            ))}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium border bg-white text-red-500 border-red-400 hover:bg-red-50 transition"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        {/* Mobile User Info */}
        {menuOpen && (
          <div className="md:hidden mb-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {userData?.name || userEmail}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {userType === 'admin' ? 'Super Admin' : userType}
                </p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                userType === 'admin' ? 'bg-purple-100 text-purple-800' :
                userType === 'doctor' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {userType === 'admin' ? 'Admin' : userType}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="md:hidden flex flex-col gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                  currentView === item.id 
                    ? 'bg-orange-500 text-white' 
                    : 'text-orange-700 bg-white border border-orange-300'
                } transition`}
              >
                <item.icon size={20} /> {item.label}
              </button>
            ))}

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-red-600 bg-white border border-red-300 hover:bg-red-50 transition"
            >
              <LogOut size={20} /> Logout
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="p-4 mx-auto">
        {currentView === 'addPatient' && <AddPatient userEmail={userEmail} userType={userType} />}
        {currentView === 'patientList' && <PatientList userEmail={userEmail} userType={userType} />}
        {currentView === 'doctorView' && <DoctorView userEmail={userEmail} />}
        {currentView === 'reports' && <Reports />}
        {currentView === 'superAdmin' && <SuperAdmin />}
      </main>

      {/* Footer */}
      <footer className="border-t border-orange-200 py-4 text-center text-sm text-gray-600">
        © 2025 Saryoday Clinic • Powered by <span className="font-semibold text-orange-600">WebReich Technologies</span>
      </footer>
    </div>
  );
}

export default App;