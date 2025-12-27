import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProspectList from './pages/ProspectList';
import 'leaflet/dist/leaflet.css';

// Lazy load heavier pages
const TerritoryMap = React.lazy(() => import('./pages/TerritoryMap'));
const LeadDetail = React.lazy(() => import('./pages/LeadDetail'));
const CustomList = React.lazy(() => import('./pages/CustomList'));
const DataManager = React.lazy(() => import('./pages/DataManager'));
const BuildingsList = React.lazy(() => import('./pages/BuildingsList'));
const BuildingDetail = React.lazy(() => import('./pages/BuildingDetail'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-gray-500">Loading...</div>
  </div>
);

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="map" element={<Suspense fallback={<LoadingFallback />}><TerritoryMap /></Suspense>} />
            <Route path="prospects" element={<ProspectList />} />
            <Route path="prospects/:id" element={<Suspense fallback={<LoadingFallback />}><LeadDetail /></Suspense>} />
            <Route path="buildings" element={<Suspense fallback={<LoadingFallback />}><BuildingsList /></Suspense>} />
            <Route path="buildings/:prospectId/:buildingId" element={<Suspense fallback={<LoadingFallback />}><BuildingDetail /></Suspense>} />
            <Route path="lists/:id" element={<Suspense fallback={<LoadingFallback />}><CustomList /></Suspense>} />
            <Route path="manage" element={<Suspense fallback={<LoadingFallback />}><DataManager /></Suspense>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
