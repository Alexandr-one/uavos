'use client';

import ArticleForm from '@/components/article/add/ArticleForm';
import { useEffect } from "react";



export default function Home() {
  useEffect(() => {
    document.title = "Articles Add | Uavos"
  }, []);

  return (
    <main>
      <ArticleForm />
    </main>
  );
}