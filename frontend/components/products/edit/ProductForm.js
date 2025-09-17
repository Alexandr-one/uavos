'use client';

import { useState, useEffect } from 'react';
import MDXEditor from '@/components/ui/MDXEditor/MDXEditor';
import { uploadImage } from '@/services/imageUploader';
import styles from './ProductForm.module.css';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export default function ProductForm({ product, slug }) {
  const [formData, setFormData] = useState({
    title: product?.title || '',
    content: product?.content || ''
  });
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadedImages, setUploadedImages] = useState(product?.images || []);

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || '',
        content: product.content || ''
      });
      setUploadedImages(product.images || []);
    }
  }, [product]);

  const handleImageUpload = async (file) => {
    try {
      const imageData = await uploadImage(file, slug);

      setUploadedImages(prev => [
        ...prev,
        {
          url: imageData.url,
          path: imageData.path,
          filename: imageData.filename,
          originalName: file.name,
        },
      ]);

      return imageData;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!slug) {
      setMessage('❌ Cannot delete: product has no ID');
      return;
    }

    const storedToken = Cookies.get('token');
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(
        `http://localhost:3003/products/delete/${slug}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${storedToken}`,
          },
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();

      if (result.success) {
        setMessage(`✅ product "${product.title}" deleted successfully!`);
        router.push('/products');
      } else {
        throw new Error(result.message || 'Unknown error');
      }
    } catch (error) {
      setMessage(`❌ Error deleting product: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const storedToken = Cookies.get('token');
      const url = `http://localhost:3003/products/update/${slug}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          images: uploadedImages,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();

      if (result.success) {
        setMessage('✅ product updated successfully!');
      } else {
        throw new Error(result.message || 'Unknown error');
      }
    } catch (error) {
      setMessage(`❌ Error updating product: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleContentChange = (content) => {
    setFormData({
      ...formData,
      content: content,
    });
  };

  const getMessageStyle = () => {
    const isSuccess = message.includes('✅');
    return {
      backgroundColor: isSuccess ? '#d4edda' : '#f8d7da',
      color: isSuccess ? '#155724' : '#721c24',
      borderColor: isSuccess ? '#c3e6cb' : '#f5c6cb',
    };
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.formTitle}>Edit product</h1>

      <form onSubmit={handleUpdate} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>
            product Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="Enter product title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <MDXEditor
            value={formData.content}
            onChange={handleContentChange}
            height={400}
            label="product Content (MDX with frontmatter)"
            placeholder="---\ntitle: My product\nauthor: Me\n---\n\n# Start writing..."
            onImageUpload={handleImageUpload}
            productId={slug}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
          style={{ backgroundColor: loading ? '#bdc3c7' : '#3498db' }}
        >
          {loading ? '⏳ Updating...' : '📝 Update product'}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={handleDelete}
          className={styles.deleteButton}
          style={{ backgroundColor: loading ? '#bdc3c7' : '#e74c3c' }}
        >
          {loading ? '⏳ Deleting...' : '🗑️ Delete product'}
        </button>
      </form>

      {message && (
        <div className={styles.message} style={getMessageStyle()}>
          {message}
        </div>
      )}
    </div>
  );
}
