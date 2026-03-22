import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VehicleList from './pages/vehicles/VehicleList';
import CustomerVehicleList from './pages/vehicles/CustomerVehicleList';
import BookingList from './pages/bookings/BookingList';
import PaymentList from './pages/payments/PaymentList';
import PaymentPage from './pages/payments/PaymentPage';
import MaintenanceList from './pages/maintenance/MaintenanceList';
import NotificationList from './pages/notifications/NotificationList';
import UserList from './pages/users/UserList';
import Settings from './pages/settings/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><Layout /></ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="vehicles" element={<VehicleList />} />
            <Route path="vehicles/book" element={
              <ProtectedRoute roles={['CUSTOMER', 'BOOKING_CASHIER', 'OWNER']}><CustomerVehicleList /></ProtectedRoute>
            } />
            <Route path="bookings" element={<BookingList />} />
            <Route path="payments" element={
              <ProtectedRoute roles={['CUSTOMER', 'BOOKING_CASHIER', 'OWNER']}><PaymentList /></ProtectedRoute>
            } />
            <Route path="payments/pay/:bookingId" element={
              <ProtectedRoute roles={['CUSTOMER', 'BOOKING_CASHIER', 'OWNER']}><PaymentPage /></ProtectedRoute>
            } />
            <Route path="maintenance" element={
              <ProtectedRoute roles={['REPAIR_ADVISOR', 'OWNER']}><MaintenanceList /></ProtectedRoute>
            } />
            <Route path="notifications" element={
              <ProtectedRoute roles={['CUSTOMER', 'BOOKING_CASHIER', 'OWNER']}><NotificationList /></ProtectedRoute>
            } />
            <Route path="users" element={
              <ProtectedRoute roles={['OWNER']}><UserList /></ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute roles={['OWNER']}><Settings /></ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
