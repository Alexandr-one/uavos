'use client';

import React, { ReactNode } from 'react';
import Header from '@/components/templates/header/header.template';
import { AuthProvider } from '@/contexts/auth.context';
import './globals.css';
import Loader from '@/components/ui/loader/loader.ui';

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
};

export default RootLayout;
