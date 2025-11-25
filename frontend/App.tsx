
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Roadmap } from './pages/Roadmap';
import { AboutUs } from './pages/AboutUs';
import { ContactUs } from './pages/ContactUs';
import { Signup } from './pages/Signup';
import { Profile } from './pages/Profile';
import { UserType } from './types';

const AppRoutes: React.FC = () => {
    const { currentUser, initializing } = useAppContext();

    if (initializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-white-600 font-medium">
                Loading workspace...
            </div>
        );
    }

    // FIX: Refactored to use the standard v6 layout route pattern.
    // The Layout component is now part of a route, and child routes are rendered via its <Outlet />.
    // This fixes the type error and aligns with modern react-router practices.
    return (
        <Routes>
            {!currentUser ? (
                <>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="*" element={<Navigate to="/login" />} />
                </>
            ) : (
                <Route element={<Layout />}>
                    {currentUser.type === UserType.Admin && <Route path="/admin" element={<AdminDashboard />} />}
                    
                    {[UserType.Student, UserType.Teacher, UserType.Parent].includes(currentUser.type) && (
                        <>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/roadmap" element={<Roadmap />} />
                        </>
                    )}

                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/contact" element={<ContactUs />} />
                    <Route path="/profile" element={<Profile />} />

                    {/* Default route based on user type */}
                    <Route path="*" element={<Navigate to={currentUser.type === UserType.Admin ? "/admin" : "/"} />} />
                </Route>
            )}
        </Routes>
    );
};


const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
};

export default App;
