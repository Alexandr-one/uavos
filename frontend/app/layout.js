'use client';
import Header from '@/components/templates/Header';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';
import Loader from '@/components/ui/Loader';

export default function RootLayout({ children }) {


  return (
    <html lang="en">
      <body>
        {/* <Loader /> */}
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}