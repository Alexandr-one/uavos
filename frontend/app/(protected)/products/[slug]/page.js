"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ProductForm from "@/components/products/edit/ProductForm";
import Cookies from "js-cookie";

export default function ProductManager() {

    const [product, setProduct] = useState(null);
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

        const fetchProduct = async () => {
            try {
                const response = await fetch(`http://localhost:3003/products/${slug}`, {
                    method: "GET",
                    headers: {
                        'Authorization': `Bearer ${storedToken}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to load product: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                setProduct(data.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [slug]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
    if (!product) return <p>No product found</p>;

    return (
        <div>
            <h1>Edit Products</h1>

            <ProductForm
                product={product}
                slug={slug}
            />
        </div>
    );
}
