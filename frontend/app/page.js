// app/page.js
'use client';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DeploymentButtons from '@/components/ui/DeploymentButtons';

export default function HomePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    document.title = "Home | Uavos";
    
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="content-wrapper">
        <div className="content">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-body text-center">
                    <p>Loading...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrapper">
      <div className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-8 mx-auto">
              <DeploymentButtons apiUrl={"http://localhost:3003/api"} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}