'use client';

import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DeploymentButtons from '@/components/ui/deploy/DeploymentButtons';
import { fetchPreviewStatus, fetchDeploymentStatus, fetchTags, PreviewStatus, DeploymentStatus } from '@/services/deploymentService';

interface InitialData {
  apiUrl: string;
  tags: string[];
  previewStatus: PreviewStatus;
  deploymentStatus: DeploymentStatus;
}

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [initialData, setInitialData] = useState<InitialData | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api";
  const storedToken = user ? localStorage.getItem('token') || '' : '';

  useEffect(() => {
    document.title = "Home | Uavos";
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    const loadInitialData = async () => {
      try {
        const [tagsRes, previewRes, deployRes] = await Promise.all([
          fetchTags(apiUrl, storedToken),
          fetchPreviewStatus(apiUrl, storedToken),
          fetchDeploymentStatus(apiUrl, storedToken),
        ]);

        setInitialData({
          apiUrl,
          tags: tagsRes.tags || [],
          previewStatus: previewRes,
          deploymentStatus: deployRes,
        });
      } catch (err) {
        console.error("Failed to load initial deployment data:", err);
        setInitialData({
          apiUrl,
          tags: [],
          previewStatus: { isRunning: false },
          deploymentStatus: {},
        });
      }
    };

    loadInitialData();
  }, [user, apiUrl, storedToken]);

  if (isLoading) {
    return (
      <div className="content-wrapper">
        <div className="content">
          <div className="container-fluid">
            <div className="card text-center">
              <div className="card-body">
                <p>Checking authentication...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !initialData) return null;

  return (
    <div className="content-wrapper">
      <div className="content">
        <div className="container-fluid">
          <DeploymentButtons
            apiUrl={initialData.apiUrl}
            initialTags={initialData.tags}
            initialPreviewStatus={initialData.previewStatus}
            initialDeploymentStatus={initialData.deploymentStatus}
          />
        </div>
      </div>
    </div>
  );
}
