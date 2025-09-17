'use client';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import { useEffect } from 'react';

export default function HomePage() {


  useEffect(() => {
    document.title = "Home | Uavos"
  }, []);


  const { user, logout } = useAuth();

  return (
    ''
  );
}