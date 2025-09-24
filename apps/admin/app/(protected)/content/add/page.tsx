'use client';

import React, { useEffect } from 'react';
import ContentForm from '@/components/forms/add/content-form.component';

const Home: React.FC = () => {
  useEffect(() => {
    document.title = "Content Add | Uavos";
  }, []);

  return (
    <main>
      <ContentForm />
    </main>
  );
};

export default Home;
