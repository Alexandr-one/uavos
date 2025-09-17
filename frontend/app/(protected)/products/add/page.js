'use client';

import ProductForm from '@/components/products/add/ProductForm';
import { useEffect } from "react";



export default function Home() {
  useEffect(() => {
    document.title = "Products Add | Uavos"
  }, []);

  return (
    <main>
      <ProductForm />
    </main>
  );
}