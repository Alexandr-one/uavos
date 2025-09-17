'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';


export default function Dashboard() {
  const { user } = useAuth();



  return (
    <div style={{ padding: '40px' }}>
      <h1>Панель управления</h1>
      <p>Добро пожаловать, {user?.username}!</p>

      <div style={{ marginTop: '30px' }}>
        <h2>Быстрые действия:</h2>
        <Link
          href="/articles/add"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#28a745',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            marginRight: '15px'
          }}
        >
          Добавить статью
        </Link>

        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#6c757d',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          На главную
        </Link>
      </div>
    </div>
  );
}