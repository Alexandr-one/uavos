'use client';

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ContentForm from "@/components/forms/edit/ContentForm";
import { fetchContent } from "@/services/contentService/fetchContent";

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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api"
  const params = useParams();
  const { slug } = params as { slug?: string };

  useEffect(() => {
    if (slug) {
      document.title = `${slug} | Uavos`;
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    const loadContent = async () => {
      try {
        const data = await fetchContent(slug, apiUrl);
        setContent(data);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [slug, apiUrl]);

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
