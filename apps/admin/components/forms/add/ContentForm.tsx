'use client';

import { useState, useCallback } from 'react';
import MDXEditor from '@/components/ui/MDXEditor/MDXEditor';
import { uploadImage } from '@uavos/shared-types';
import styles from './ContentForm.module.css';
import Cookies from 'js-cookie';

interface ImageData {
  url: string;
}

interface FormData {
  title: string;
  content: string;
}

export default function ContentForm() {
  const [formData, setFormData] = useState<FormData>({ title: '', content: '' });
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [uploadedImages, setUploadedImages] = useState<ImageData[]>([]);
  const storedToken = Cookies.get('token');

  const generateContentId = useCallback(() => {
    return `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const handleImageUpload = async (file: File, contentId: string): Promise<ImageData> => {
    try {
      const imageData = await uploadImage(file, contentId, process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003/api');
      const newImage: ImageData = {
        url: imageData.url,
      };
      setUploadedImages(prev => [...prev, newImage]);
      return newImage;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/content/push`, {
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: { success: boolean; error?: string } = await response.json();

      if (result.success) {
        setMessage('✅ Content created successfully!');
        setFormData({ title: '', content: '' });
        setUploadedImages([]);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContentChange = (content: string) => {
    setFormData({ ...formData, content });
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
      <h1 className={styles.formTitle}>Add New Content</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>
            Content Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="Enter content title"
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
            label="Content (MDX with frontmatter)"
            placeholder="---\ntitle: My Content\nauthor: Me\ncategory: news\n---\n\n# Start writing..."
            onImageUpload={handleImageUpload}
            contentId={generateContentId()}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
          style={{ backgroundColor: loading ? '#bdc3c7' : '#3498db' }}
        >
          {loading ? '⏳ Sending...' : '🚀 Publish Content'}
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
