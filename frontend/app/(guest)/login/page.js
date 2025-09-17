"use client";

import LoginForm from '@/components/auth/LoginForm';
import GuestRoute from '@/components/auth/GuestRoute';
import { useEffect } from 'react';


export default function LoginPage() {

  useEffect(() => {
    document.title = "Login | Uavos"
  }, []);

  return (
    <main>
      <LoginForm />
    </main>
  )
}

export const dynamic = 'force-dynamic';