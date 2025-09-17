'use client';

import { useState, useEffect } from 'react';
import ArticlesList from '@/components/article/ArticlesList';
import './styles.css';
import Cookies from 'js-cookie';

export default function ArticlesPage() {

  useEffect(() => {
    document.title = "Articles | Uavos"
  }, []);

  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const storedToken = Cookies.get('token');


  const fetchArticles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3003/articles/", {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },  
      });

      if (!response.ok) {
        throw new Error(`Failed to load articles: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setArticles(data.data);
    } catch (err) {
      setError(err.message);
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
        <h1 className="articles-title">All Articles</h1>

        {isLoading && (
          <div className="articles-loading">
          </div>
        )}

        {error && (
          <div className="articles-error">
            <p>Error: {error}</p>
            <button onClick={fetchArticles}>Try Again</button>
          </div>
        )}

        {!isLoading && !error && (
          <ArticlesList
            articles={articles}
          />
        )}
      </div>
    </div>
  );
}