'use client';

import { useState, useEffect } from 'react';
import MDXEditor from '@/components/ui/MDXEditor/MDXEditor';
import { uploadImage } from '@/services/imageUploader';
import styles from './ContentForm.module.css';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

interface ImageData {
  url: string;
  path?: string;
  filename?: string;
  originalName: string;
}

interface Content {
  title: string;
  content: string;
  images?: ImageData[];
}

interface ContentFormProps {
  content?: Content;
  slug?: string;
}

export default function ContentForm({ content, slug }: ContentFormProps) {
  const [formData, setFormData] = useState<Content>({
    title: content?.title || '',
    content: content?.content || '',
    images: content?.images || [],
  });

  const [uploadedImages, setUploadedImages] = useState<ImageData[]>(content?.images || []);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    if (content) {
      setFormData({
        title: content.title || '',
        content: content.content || '',
        images: content.images || [],
      });
      setUploadedImages(content.images || []);
    }
  }, [content]);

  const handleImageUpload = async (file: File): Promise<ImageData> => {
    try {
      const imageData = await uploadImage(file, slug!); // slug точно должен быть
      const newImage: ImageData = {
        url: imageData.url,
        path: imageData.path,
        filename: imageData.filename,
        originalName: file.name,
      };
      setUploadedImages(prev => [...prev, newImage]);
      return newImage;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!slug) {
      setMessage('❌ Cannot delete: content has no ID');
      return;
    }

    const storedToken = Cookies.get('token');
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`http://localhost:3003/api/content/delete/${slug}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result: { success: boolean; message?: string } = await response.json();

      if (result.success) {
        setMessage(`✅ Content "${content?.title}" deleted successfully!`);
        router.push('/content');
      } else {
        throw new Error(result.message || 'Unknown error');
      }
    } catch (error: any) {
      setMessage(`❌ Error deleting content: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const storedToken = Cookies.get('token');
      const url = `http://localhost:3003/api/content/update/${slug}`;

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
      const result: { success: boolean; message?: string } = await response.json();

      if (result.success) {
        setMessage('✅ Content updated successfully!');
      } else {
        throw new Error(result.message || 'Unknown error');
      }
    } catch (error: any) {
      setMessage(`❌ Error updating content: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContentChange = (contentValue: string) => {
    setFormData({ ...formData, content: contentValue });
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
      <h1 className={styles.formTitle}>Edit Content</h1>

      <form onSubmit={handleUpdate} className={styles.form}>
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
            placeholder="---\ntitle: My Content\nauthor: Me\n---\n\n# Start writing..."
            onImageUpload={handleImageUpload}
            contentId={slug}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
          style={{ backgroundColor: loading ? '#bdc3c7' : '#3498db' }}
        >
          {loading ? '⏳ Updating...' : '📝 Update Content'}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={handleDelete}
          className={styles.deleteButton}
          style={{ backgroundColor: loading ? '#bdc3c7' : '#e74c3c' }}
        >
          {loading ? '⏳ Deleting...' : '🗑️ Delete Content'}
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
