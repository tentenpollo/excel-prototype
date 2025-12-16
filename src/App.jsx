import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TerritoryMap from './pages/TerritoryMap';
import ProspectList from './pages/ProspectList';
import LeadDetail from './pages/LeadDetail';
import CustomList from './pages/CustomList';
import DataManager from './pages/DataManager';
import 'leaflet/dist/leaflet.css';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="map" element={<TerritoryMap />} />
            <Route path="prospects" element={<ProspectList />} />
            <Route path="prospects/:id" element={<LeadDetail />} />
            <Route path="lists/:id" element={<CustomList />} />
            <Route path="manage" element={<DataManager />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
