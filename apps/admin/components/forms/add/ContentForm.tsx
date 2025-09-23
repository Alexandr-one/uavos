'use client';

import { useState, useCallback } from 'react';
import MDXEditor from '@/components/ui/MDXEditor/MDXEditor';
import { uploadImage } from '@/services/contentService/imageUploader';
import styles from './ContentForm.module.css';
import { ContentCreateDto, ImageData } from '@uavos/shared-types';
import { createContent } from '@/services/contentService/';

interface FormData {
  title: string;
  content: string;
}


export default function ContentForm() {
  const [formData, setFormData] = useState<FormData>({ title: '', content: '' });
  const [uploadedImages, setUploadedImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003/api';
  const generateContentId = useCallback(() => `content_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`, []);

  // -----------------------
  // Upload Image
  // -----------------------
  const handleImageUpload = async (file: File): Promise<ImageData> => {
    const imageData = await uploadImage(file, generateContentId(), apiUrl);
    const newImage: ImageData = {
      url: imageData.url,
      path: imageData.path,
      filename: imageData.filename,
      originalName: file.name,
    };
    setUploadedImages(prev => [...prev, newImage]);
    return newImage;
  };

  // -----------------------
  // Submit New Content
  // -----------------------
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const dto = new ContentCreateDto(formData.title, formData.content, uploadedImages);
      const result = await createContent(dto, apiUrl);

      if (result.success) {
        setMessage('✅ Content created successfully!');
        setFormData({ title: '', content: '' });
        setUploadedImages([]);
      } else {
        setMessage(`❌ Validation error: ${result.error}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------
  // Input handlers
  // -----------------------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, title: e.target.value });
  const handleContentChange = (content: string) =>
    setFormData({ ...formData, content });

  const getMessageStyle = () => ({
    backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
    color: message.includes('✅') ? '#155724' : '#721c24',
    borderColor: message.includes('✅') ? '#c3e6cb' : '#f5c6cb',
  });

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.formTitle}>Add New Content</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>Content Title</label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={handleInputChange}
            className={styles.input}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <MDXEditor
            value={formData.content}
            onChange={handleContentChange}
            height={400}
            label="Content (MDX with frontmatter)"
            placeholder="---\ntitle: My Content\n---\n# Start writing..."
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

      {message && <div className={styles.message} style={getMessageStyle()}>{message}</div>}
    </div>
  );
}
