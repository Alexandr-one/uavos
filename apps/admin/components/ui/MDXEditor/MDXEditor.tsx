'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import styles from './MDXEditor.module.css';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

export interface ImageData {
  url: string;
  path?: string;
  filename?: string;
  originalName?: string;
}

export interface MDXEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
  label?: string;
  placeholder?: string;
  showHelpText?: boolean;
  onImageUpload?: (file: File, contentId: string) => Promise<ImageData>;
  contentId?: string;
}

type PreviewMode = 'live' | 'edit' | 'preview';

export default function MDXEditor({
  value,
  onChange,
  height = 400,
  placeholder = "Start writing your article...",
  label = "Article Content (MDX)",
  showHelpText = true,
  onImageUpload,
  contentId = 'temp',
}: MDXEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('live');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const handleChange = (val: string | undefined) => {
    onChange(val || '');
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length || !onImageUpload) return;

    setIsUploading(true);
    try {
      let currentValue = value || '';

      for (const file of files) {
        const placeholderText = `![Uploading ${file.name}...](uploading)`;
        currentValue = currentValue ? `${currentValue}\n${placeholderText}` : placeholderText;
        onChange(currentValue);

        const imageData = await onImageUpload(file, contentId);
        const markdownImage = `![${file.name}](${imageData.url})`;
        currentValue = currentValue.replace(placeholderText, markdownImage);
        onChange(currentValue);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      const errorValue = (value || '').replace(/!\[Uploading.*?\]\(uploading\)/g, '');
      onChange(errorValue);
      alert('Image upload failed. Check the console for details.');
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const uploadImageCommand = {
    name: 'uploadImage',
    keyCommand: 'uploadImage',
    buttonProps: { 
      'aria-label': 'Upload Image',
      disabled: isUploading,
      title: isUploading ? 'Uploading...' : 'Upload Image'
    },
    icon: isUploading ? (
      <div style={{
        width: '12px', height: '12px',
        border: '2px solid #ccc',
        borderTop: '2px solid #007acc',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
    ) : (
      <svg width="12" height="12" viewBox="0 0 20 20">
        <path fill="currentColor" d="M19 5v14H1V5h18zm0-2H1c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zm-8 10l-4-4-4 4h3v4h2v-4h3zm5-4h-2v4h-2v-4h-2l3-3 3 3z"/>
      </svg>
    ),
    execute: isUploading ? () => {} : handleImageUploadClick,
  };

  const fullscreenCommand = {
    name: 'fullscreen',
    keyCommand: 'fullscreen',
    buttonProps: { 'aria-label': 'Fullscreen Mode', title: 'Fullscreen Mode' },
    icon: (
      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3 3a1 1 0 000 2h1v10a1 1 0 001 1h10v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V4a1 1 0 00-1-1H5V3a1 1 0 00-1-1H3zm12 12V5H5v10h10z"/>
      </svg>
    ),
    execute: toggleFullscreen,
  };

  const previewCommands = [
    {
      name: 'preview',
      keyCommand: 'preview',
      buttonProps: { 'aria-label': 'Preview', title: 'Preview' },
      icon: <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path d="M.2 10a11 11 0 0119.6 0A11 11 0 01.2 10zm9.8 4a4 4 0 100-8 4 4 0 000 8zm0-2a2 2 0 110-4 2 2 0 010 4z"/></svg>,
      execute: () => setPreviewMode('preview')
    },
    {
      name: 'edit',
      keyCommand: 'edit',
      buttonProps: { 'aria-label': 'Edit', title: 'Edit' },
      icon: <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>,
      execute: () => setPreviewMode('edit')
    },
    {
      name: 'live',
      keyCommand: 'live',
      buttonProps: { 'aria-label': 'Split Screen Mode', title: 'Split Screen Mode' },
      icon: <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm4 0v12h8V4H6z"/></svg>,
      execute: () => setPreviewMode('live')
    }
  ];

  const renderers = {
    image: ({ src, alt }: { src: string; alt?: string }) => {
      if (src === 'uploading') {
        return (
          <div style={{
            padding: '10px',
            background: '#f0f0f0',
            border: '1px dashed #ccc',
            borderRadius: '4px',
            color: '#666',
            fontStyle: 'italic'
          }}>
            ⏳ Uploading image: {alt}
          </div>
        );
      }
      return <img src={src} alt={alt} style={{ maxWidth: '100%' }} />;
    }
  };

  return (
    <div className={`${styles.editorContainer} ${isFullscreen ? styles.fullscreen : ''}`}>
      {label && <label className={styles.label}>{label}</label>}
      <div data-color-mode="light" className={styles.editorWrapper}>
        <MDEditor
          value={value}
          onChange={handleChange}
          height={isFullscreen ? '100vh' : height}
          preview={previewMode}
          textareaProps={{ placeholder }}
          className={styles.editor}
          extraCommands={[uploadImageCommand, fullscreenCommand, ...previewCommands]}
          previewOptions={{ components: renderers }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={isUploading}
        />
      </div>
      {showHelpText && (
        <div className={styles.helpText}>
          Markdown and MDX syntax supported. Use the image button to upload images.
          Use the buttons above to switch between edit and preview modes.
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
