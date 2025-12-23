import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import { registerServiceWorker } from './registerServiceWorker';
import './index.css';

registerServiceWorker();

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.error('Missing Clerk Publishable Key');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/"
        appearance={{
          variables: {
            fontFamily: '"Comic Neue", sans-serif',
            colorPrimary: '#059669', // emerald-600
            colorBackground: '#fcfbf5', // brand-cream
            colorText: '#2d2d2d',
            colorInputBackground: '#ffffff',
            borderRadius: '0.5rem',
          },
          elements: {
            card: {
              border: '2px solid #2d2d2d',
              boxShadow: '4px 4px 0 0 rgba(0, 0, 0, 0.1)',
              borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
            },
            headerTitle: {
              fontFamily: '"Sniglet", cursive',
            },
            headerSubtitle: {
              fontFamily: '"Comic Neue", sans-serif',
            },
            formButtonPrimary: {
              backgroundColor: '#059669',
              borderColor: '#059669',
              boxShadow: '2px 2px 0 0 rgba(0, 0, 0, 0.1)',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#047857', // emerald-700
                borderColor: '#047857',
                transform: 'translateY(-1px)',
                boxShadow: '3px 3px 0 0 rgba(0, 0, 0, 0.15)',
              },
              '&:active': {
                transform: 'translateY(1px)',
                boxShadow: '1px 1px 0 0 rgba(0, 0, 0, 0.1)',
              },
            },
            footerActionLink: {
              color: '#059669',
              '&:hover': {
                color: '#047857',
              },
            },
          },
        }}
      >
        <App />
      </ClerkProvider>
    ) : (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-4 text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">Configuration Error</h1>
          <p>
            Missing Clerk Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file.
          </p>
        </div>
      </div>
    )}
  </React.StrictMode>
);
