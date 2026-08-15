import React from 'react';
import ReactDOM from 'react-dom/client';
import BeatIQ from './App.jsx';
import 'leaflet/dist/leaflet.css';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BeatIQ />
  </React.StrictMode>
);
