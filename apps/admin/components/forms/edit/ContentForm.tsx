'use client';

import { useState, useEffect } from 'react';
import MDXEditor from '@/components/ui/MDXEditor/MDXEditor';
import styles from './ContentForm.module.css';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { updateContent, deleteContent, uploadImage } from '@/services/contentService';

import {
  UploadImageDto,
  UploadImageResponseDto,
  ContentUpdateDto,
  Content,
  ImageData
} from '@uavos/shared-types';


interface ContentFormProps {
  content: Content;
  slug: string;
}

export default function ContentForm({ content, slug }: ContentFormProps) {
  const [formData, setFormData] = useState<Content>({
    title: content.title,
    content: content.content,
    images: content.images || [],
  });
  const [uploadedImages, setUploadedImages] = useState<ImageData[]>(content.images || []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003/api';

  useEffect(() => {
    if (content) {
      setFormData({
        title: content.title,
        content: content.content,
        images: content.images || [],
      });
      setUploadedImages(content.images || []);
    }
  }, [content]);


  const handleImageUpload = async (file: File): Promise<ImageData> => {
    try {
      const dto = new UploadImageDto(slug);
      const validation = dto.validate();
      if (!validation.isValid) throw new Error(validation.errors.join(', '));

      const imageData = await uploadImage(file, slug, apiUrl);
      const respDto = new UploadImageResponseDto(imageData.url);
      const respValidation = respDto.validate();
      if (!respValidation.isValid) throw new Error(respValidation.errors.join(', '));

      const newImage: ImageData = {
        url: respDto.url,
        originalName: file.name,
        path: imageData.path,
        filename: imageData.filename,
      };

      setUploadedImages(prev => [...prev, newImage]);
      setFormData({ ...formData, images: [...uploadedImages, newImage] });

      return newImage;
    } catch (error: any) {
      console.error('❌ Image upload error:', error.message);
      throw error;
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const dto = new ContentUpdateDto(formData.title, formData.content, uploadedImages);
    const validation = dto.validate();
    if (!validation.isValid) {
      setMessage(`❌ Validation error: ${validation.errors.join(', ')}`);
      setLoading(false);
      return;
    }

    const result = await updateContent(slug, dto, apiUrl);
    if (result.success) setMessage('✅ Content updated successfully!');
    else setMessage(`❌ Error updating content: ${result.message}`);

    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    setMessage('');

    const result = await deleteContent(slug, apiUrl);
    if (result.success) {
      setMessage(`✅ Content "${formData.title}" deleted successfully!`);
      router.push('/content');
    } else {
      setMessage(`❌ Error deleting content: ${result.message}`);
    }

    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, title: e.target.value });
  };

  const handleContentChange = (value: string) => {
    setFormData({ ...formData, content: value });
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

      {message && <div className={styles.message} style={getMessageStyle()}>{message}</div>}
    </div>
  );
}
