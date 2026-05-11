import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import DariRetur from './pages/Rusak';
import DariCustomer from './pages/DariCustomer';
import BLP from './pages/BLP';
import Pergantian from './pages/Pergantian';
import Cancel from './pages/Cancel';
import TiketTiktok from './pages/TiketTiktok';
import TiketShopee from './pages/TiketShopee';
import ReturTiktok from './pages/ReturTiktok';
import ReturShopee from './pages/ReturShopee';
import CodGagalTiktok from './pages/CodGagalTiktok';
import CodGagalTiktokMami from './pages/CodGagalTiktokMami';
import CodGagalShopeeAlgoo from './pages/CodGagalShopeeAlgoo';
import CodGagalShopeeMami from './pages/CodGagalShopeeMami';
import Report from './pages/Report';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="rusak" element={<DariRetur />} />
          <Route path="dari-customer" element={<DariCustomer />} />
          <Route path="blp" element={<BLP />} />
          <Route path="pergantian" element={<Pergantian />} />
          <Route path="cancel" element={<Cancel />} />
          <Route path="tiket-tiktok" element={<TiketTiktok />} />
          <Route path="tiket-shopee" element={<TiketShopee />} />
          <Route path="retur-tiktok" element={<ReturTiktok />} />
          <Route path="retur-shopee" element={<ReturShopee />} />
          <Route path="cod-gagal-tiktok" element={<CodGagalTiktok />} />
          <Route path="cod-gagal-tiktok-mami" element={<CodGagalTiktokMami />} />
          <Route path="cod-gagal-shopee-algoo" element={<CodGagalShopeeAlgoo />} />
          <Route path="cod-gagal-shopee-mami" element={<CodGagalShopeeMami />} />
          <Route path="report" element={<Report />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
