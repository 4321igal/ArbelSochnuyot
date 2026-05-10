import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { configureAmplify } from './lib/amplify/configure';
import { AuthProvider } from './lib/auth/AuthContext';
import { CompareProvider } from './lib/compare/CompareContext';
import { FavoritesProvider } from './lib/favorites/FavoritesContext';
import './styles/index.css';

configureAmplify();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CompareProvider>
          <FavoritesProvider>
            <App />
          </FavoritesProvider>
        </CompareProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
