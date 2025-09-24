'use client';

import { useState, useEffect } from 'react';
import MDXEditor from '@/components/ui/MDXEditor/mdx-editor.ui';
import styles from './content-form.module.css';
import { useRouter } from 'next/navigation';
import { updateContent, deleteContent, uploadImage } from '@/services/content-service';

import {
  UploadImageDto,
  UploadImageResponseDto,
  ContentUpdateDto,
  ImageDto,
  ContentFetchDto,
} from '@uavos/shared-types';

interface ContentFormProps {
  content: ContentFetchDto; // The content data to edit
  slug: string;     // Slug identifier for this content
}

export default function ContentForm({ content, slug }: ContentFormProps) {
  // Local state for form data
  const [formData, setFormData] = useState<ContentFetchDto>({
    id: content.id,
    slug: content.slug,
    title: content.title,
    content: content.content,
    images: content.images || [],
  });

  // Track images separately for easier upload management
  const [uploadedImages, setUploadedImages] = useState<ImageDto[]>(content.images || []);

  const [loading, setLoading] = useState(false); // Loading state for requests
  const [message, setMessage] = useState('');    // Success/error feedback

  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003/api';

  // Sync state when `content` prop changes
  useEffect(() => {
    if (content) {
      setFormData({
        id: content.id,
        slug: content.slug,
        title: content.title,
        content: content.content,
        images: content.images || [],
      });
      setUploadedImages(content.images || []);
    }
  }, [content]);

  /**
   * Handle image upload.
   * Validates request and response using DTOs.
   */
  const handleImageUpload = async (file: File): Promise<ImageDto> => {
    try {
      // Validate upload request
      const dto = new UploadImageDto(slug);
      const validation = dto.validate();
      if (!validation.isValid) throw new Error(validation.errors.join(', '));

      // Upload image
      const imageData = await uploadImage(file, slug, apiUrl);

      // Validate upload response
      const respDto = new UploadImageResponseDto(imageData.url);
      const respValidation = respDto.validate();
      if (!respValidation.isValid) throw new Error(respValidation.errors.join(', '));

      // Build new image object
      const newImage: ImageDto = {
        url: respDto.url,
        originalName: file.name,
        path: imageData.path,
        filename: imageData.filename,
      };

      // Update state
      setUploadedImages(prev => [...prev, newImage]);
      setFormData({ ...formData, images: [...uploadedImages, newImage] });

      return newImage;
    } catch (error: any) {
      console.error('❌ Image upload error:', error.message);
      throw error;
    }
  };

  /**
   * Handle content update form submission.
   * Validates data with ContentUpdateDto before sending.
   */
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

  /**
   * Handle content deletion.
   * Redirects user back to /content on success.
   */
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

  /**
   * Handle title input change.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, title: e.target.value });
  };

  /**
   * Handle content (MDX) editor change.
   */
  const handleContentChange = (value: string) => {
    setFormData({ ...formData, content: value });
  };

  /**
   * Returns style object for success/error messages.
   */
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
        {/* Title input */}
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

        {/* MDX editor with image upload support */}
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

        {/* Update button */}
        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
          style={{ backgroundColor: loading ? '#bdc3c7' : '#3498db' }}
        >
          {loading ? '⏳ Updating...' : '📝 Update Content'}
        </button>

        {/* Delete button */}
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

      {/* Feedback message */}
      {message && <div className={styles.message} style={getMessageStyle()}>{message}</div>}
    </div>
  );
}
