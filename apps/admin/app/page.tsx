'use client';

import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DeploymentButtons from '@/components/ui/DeploymentButtons';

interface TagsResponse {
  tags: string[];
}

interface DeploymentStatus {
  hasUnpublishedChanges?: boolean;
  message?: string;
  currentTag?: string;
  [key: string]: any;
}

interface PreviewStatus {
  isRunning?: boolean;
  url?: string;
  port?: number;
  [key: string]: any;
}

interface InitialData {
  apiUrl: string;
  tags: TagsResponse;
  previewStatus: PreviewStatus;
  deploymentStatus: DeploymentStatus;
}

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [initialData, setInitialData] = useState<InitialData | null>(null);

  useEffect(() => {
    document.title = "Home | Uavos";
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user) {
      const loadInitialData = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

          const [tagsRes, previewRes, deployRes] = await Promise.all([
            fetch(`${apiUrl}/api/deploy/tags`, { cache: "no-store" }),
            fetch(`${apiUrl}/api/deploy/preview-status`, { cache: "no-store" }),
            fetch(`${apiUrl}/api/deploy/status`, { cache: "no-store" }),
          ]);

          const data: InitialData = {
            apiUrl,
            tags: await tagsRes.json(),
            previewStatus: await previewRes.json(),
            deploymentStatus: await deployRes.json(),
          };

          setInitialData(data);
        } catch (err) {
          console.error("Failed to load initial data:", err);
          setInitialData({
            apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003",
            tags: { tags: [] },
            previewStatus: {},
            deploymentStatus: {},
          });
        }
      };

      loadInitialData();
    }
  }, [user]);

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

  if (!user) return null; // редирект уже сработает

  if (!initialData) {
    return (
      <div className="content-wrapper">
        <div className="content">
          <div className="container-fluid">
            <p>Loading deployment data...</p>
          </div>
        </div>
      </div>
    );
  }

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
