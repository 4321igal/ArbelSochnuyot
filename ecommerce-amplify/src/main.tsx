import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { configureAmplify } from './lib/amplify/configure';
import { AuthProvider } from './lib/auth/AuthContext';
import { CartProvider } from './lib/cart/CartContext';
import './styles/index.css';

// Initialize Amplify
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
