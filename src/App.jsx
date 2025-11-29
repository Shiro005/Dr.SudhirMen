// App.jsx - Refactored clean UI with orange + white theme, mobile-friendly navbar
import React, { useState, useEffect } from 'react';
import AddPatient from './Pages/AddPatient';
import PatientList from './Pages/PatientList';
import DoctorView from './Pages/DoctorView';
import Login from './Pages/Login';
import { Menu, X, UserPlus, ListOrdered, Stethoscope, LogOut } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [userType, setUserType] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Auto-login from localStorage
  useEffect(() => {
    const savedAuth = localStorage.getItem('clinicAuth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      setIsAuthenticated(true);
      setUserType(authData.userType);
      setCurrentView(authData.userType === 'doctor' ? 'doctorView' : 'addPatient');
    }
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUserType(userData.userType);
    localStorage.setItem('clinicAuth', JSON.stringify({
      userType: userData.userType,
      username: userData.username,
      timestamp: new Date().getTime()
    }));

    setCurrentView(userData.userType === 'doctor' ? 'doctorView' : 'addPatient');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserType(null);
    setCurrentView('login');
    localStorage.removeItem('clinicAuth');
  };

  const handleNavigation = (view) => {
    if (view === 'doctorView' && userType !== 'doctor') {
      const doctorPassword = prompt('Enter doctor password:');
      if (doctorPassword !== '9922322220') {
        alert('Invalid password!');
        return;
      }
    }
    setCurrentView(view);
    setMenuOpen(false);
  };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <nav className="sticky top-0 bg-white border-b border-orange-300 px-4 py-3 shadow-sm z-50">
        <div className="flex justify-between items-center">

          {/* Clinic Title */}
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 text-white p-2 rounded-lg">
              <Stethoscope size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-orange-600">Saryoday Clinic</h1>
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
            <button
              onClick={() => handleNavigation('addPatient')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium border ${currentView === 'addPatient' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-orange-600 border-orange-400'} transition`}
            >
              <UserPlus size={18} /> Add Patient
            </button>

            <button
              onClick={() => handleNavigation('patientList')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium border ${currentView === 'patientList' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-orange-600 border-orange-400'} transition`}
            >
              <ListOrdered size={18} /> Patient List
            </button>

            <button
              onClick={() => handleNavigation('doctorView')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium border ${currentView === 'doctorView' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-orange-600 border-orange-400'} transition`}
            >
              <Stethoscope size={18} /> Doctor View
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium border bg-white text-red-500 border-red-400"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="md:hidden mt-3 flex flex-col gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <button
              onClick={() => handleNavigation('addPatient')}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-orange-700 bg-white border border-orange-300"
            >
              <UserPlus size={20} /> Add Patient
            </button>

            <button
              onClick={() => handleNavigation('patientList')}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-orange-700 bg-white border border-orange-300"
            >
              <ListOrdered size={20} /> Patient List
            </button>

            <button
              onClick={() => handleNavigation('doctorView')}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-orange-700 bg-white border border-orange-300"
            >
              <Stethoscope size={20} /> Doctor View
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-red-600 bg-white border border-red-300"
            >
              <LogOut size={20} /> Logout
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="p-4 mx-auto">
        {currentView === 'addPatient' && <AddPatient />}
        {currentView === 'patientList' && <PatientList />}
        {currentView === 'doctorView' && <DoctorView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-orange-200 py-4 text-center text-sm text-gray-600">
        © 2024 Saryoday Clinic • Powered by <span className="font-semibold text-orange-600">WebReich Technologies</span>
      </footer>
    </div>
  );
}

export default App;
