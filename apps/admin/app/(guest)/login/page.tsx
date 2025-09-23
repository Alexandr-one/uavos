'use client';

import React, { useEffect } from 'react';
import LoginForm from '@/components/forms/auth/LoginForm';
import GuestRoute from '@/components/guards/GuestRoute';

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
