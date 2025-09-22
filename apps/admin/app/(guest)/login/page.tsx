'use client';

import React, { useEffect } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import GuestRoute from '@/components/auth/GuestRoute';

const LoginPage: React.FC = () => {
  useEffect(() => {
    document.title = "Login | Uavos";
  }, []);

  return (
    <main>
      <LoginForm />
    </main>
  );
};

export default LoginPage;

export const dynamic = 'force-dynamic';
