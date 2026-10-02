import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import Admin from './admin/Admin.jsx';
import './styles.css';

const isAdmin = /^\/admin\/?$/.test(window.location.pathname);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdmin ? <Admin /> : <App />}
  </StrictMode>,
);
