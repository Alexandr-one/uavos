"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ArticleForm from "@/components/article/edit/ArticleForm";
import Cookies from "js-cookie";

export default function ArticleManager() {

    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const storedToken = Cookies.get('token');
    const params = useParams();
    const { slug } = params;
    useEffect(() => {
        document.title = slug + " | Uavos"
    }, []);
    useEffect(() => {
        if (!slug) return;

        const fetchArticle = async () => {
            try {
                const response = await fetch(`http://localhost:3003/articles/${slug}`, {
                    method: "GET",
                    headers: {
                        'Authorization': `Bearer ${storedToken}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to load article: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                setArticle(data.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [slug]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
    if (!article) return <p>No article found</p>;

    return (
        <div>
            <h1>Edit Article</h1>

            <ArticleForm
                article={article}
                slug={slug}
            />
        </div>
    );
}
