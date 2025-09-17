'use client';

import { useState, useEffect } from 'react';
import ProductList from '@/components/products/ProductList';
import './styles.css';
import Cookies from 'js-cookie';

export default function ProductsPage() {

  useEffect(() => {
    document.title = "products | Uavos"
  }, []);

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const storedToken = Cookies.get('token');

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3003/products/", {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load products: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setProducts(data.data);
    } catch (err) {
      setError(err.message);
      console.error('Loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="products-page">
      <div className="products-container">
        <h1 className="products-title">All Products</h1>

        {isLoading && (
          <div className="products-loading">
          </div>
        )}

        {error && (
          <div className="products-error">
            <p>Error: {error}</p>
            <button onClick={fetchproducts}>Try Again</button>
          </div>
        )}

        {!isLoading && !error && (
          <ProductList
            products={products}
          />
        )}
      </div>
    </div>
  );
}