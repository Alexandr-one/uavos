'use client';

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ContentForm from "@/components/content/edit/ContentForm";
import Cookies from "js-cookie";

interface Content {
  id: string;
  slug: string;
  title: string;
  content: string;
  images?: {
    url: string;
    path?: string;
    filename?: string;
    originalName?: string;
  }[];
  [key: string]: any;
}

export default function ContentManager() {
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const storedToken = Cookies.get('token');
  const params = useParams();
  const { slug } = params as { slug?: string };

  useEffect(() => {
    if (slug) {
      document.title = `${slug} | Uavos`;
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    const fetchContent = async () => {
      try {
        const response = await fetch(`http://localhost:3003/api/content/${slug}`, {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load content: ${response.status} ${response.statusText}`);
        }

        const data: { data: Content } = await response.json();
        setContent(data.data);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [slug, storedToken]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!content) return <p>No content found</p>;

  return (
    <div>
      <ContentForm
        content={content}
        slug={slug}
      />
    </div>
  );
}
