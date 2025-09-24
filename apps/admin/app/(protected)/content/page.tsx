'use client';

import { useState, useEffect } from 'react';
import ContentList from '@/components/templates/list/content-list.template';
import './styles.css';
import Cookies from 'js-cookie';
import { ContentFetchDto, ContentResponseDto } from '@uavos/shared-types';
import { getContent } from '@/services/content-service/content-get.service';

export default function ContentPage() {
  const [articles, setArticles] = useState<ContentFetchDto[]|null>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const storedToken = Cookies.get('token');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api"
  useEffect(() => {
    document.title = "Content | Uavos";
  }, []);

  const fetchArticles = async () => {
    setIsLoading(true);
    setError(null);

    try {

      const data: ContentFetchDto[]|null = await getContent(apiUrl);
      setArticles(data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      console.error('Loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  return (
    <div className="articles-page">
      <div className="articles-container">
        <h1 className="articles-title">All Content</h1>

        {isLoading && (
          <div className="articles-loading" />
        )}

        {error && (
          <div className="articles-error">
            <p>Error: {error}</p>
            <button onClick={fetchArticles}>Try Again</button>
          </div>
        )}

        {!isLoading && !error && (
          <ContentList articles={articles} />
        )}
      </div>
    </div>
  );
}
