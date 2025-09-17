'use client';

import { useState, useCallback } from 'react';
import MDXEditor from '@/components/ui/MDXEditor/MDXEditor';
import { uploadImage } from '@/services/imageUploader';
import styles from './ArticleForm.module.css';
import Cookies from 'js-cookie';

export default function ArticleForm() {
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const storedToken = Cookies.get('token');

  const generateArticleId = useCallback(() => {
    return `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const handleImageUpload = async (file, articleId) => {
    try {
      const imageData = await uploadImage(file, articleId);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:3003/articles/push', {
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

      const result = await response.json();

      if (result.success) {
        setMessage('✅ Article created successfully!');
        setFormData({ title: '', content: '' });
        setUploadedImages([]);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
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
      <h1 className={styles.formTitle}>Add a New Article</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>
            Article Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="Enter article title"
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
            label="Article Content (MDX with frontmatter)"
            placeholder="---\ntitle: My Article\nauthor: Me\ncategory: news\n---\n\n# Start writing..."
            onImageUpload={handleImageUpload}
            articleId={generateArticleId()}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
          style={{ backgroundColor: loading ? '#bdc3c7' : '#3498db' }}
        >
          {loading ? '⏳ Sending...' : '🚀 Publish Article'}
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
