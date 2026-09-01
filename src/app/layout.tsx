// src/app/layout.tsx
"use client";

import { Provider } from 'react-redux';
import store from '../redux/store';
import ClientLayout from './ClientLayout';
import { ToastContainer } from 'react-toastify';
import { DisplaySettingsProvider } from '@/contexts/DisplaySettingsContext';
import './globals.css';
import '@/styles/purchase/purchaseTable.css';
import '@/styles/purchase/vendor.css';
import '@/styles/purchase/purchaseOrder.css';
import '@/styles/desktopDensity.css';
import '@/styles/account-settings/account-settings.css';
/* MUST BE LAST - global dialog override */
import '@/styles/yenDialog.css';
import '@/styles/responsive.css';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* <link
          href="https://fonts.googleapis.com/css2?family=ABeeZee&display=swap"
          rel="stylesheet"
        /> */}
<link
  href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Open+Sans:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Source+Sans+3:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>

        {/* <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" /> */}
      </head>
      <body>
        <Provider store={store}>
          <DisplaySettingsProvider>
            <ClientLayout>{children}</ClientLayout>
            <ToastContainer position="top-right" autoClose={1000} hideProgressBar={false} />
          </DisplaySettingsProvider>
        </Provider>
      </body>
    </html>
  );
}
