import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { configureAmplify } from './lib/amplify/configure';
import { AuthProvider } from './lib/auth/AuthContext';
import { CartProvider } from './lib/cart/CartContext';
import './styles/index.css';

// Amplify must be configured once before any Amplify API (Auth, Data, Storage) is used.
// Do not import or render components that use Amplify before this line.
configureAmplify();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
