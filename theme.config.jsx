// theme.config.jsx
import { useRouter } from 'next/router';
import { readFileSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

function getCategoryTitle(category) {
  try {
    const indexPath = join(process.cwd(), 'content', 'products', category, 'index.mdx');
    const fileContent = readFileSync(indexPath, 'utf8');
    const { data } = matter(fileContent);
    return data.title || category;
  } catch (error) {
    return category;
  }
}

export default {
  sidebar: {
    component: ({ docs, activeType }) => {
      const router = useRouter();
      const pathParts = router.asPath.split('/');
      const currentCategory = pathParts[2]; // products/asc -> asc
      
      if (currentCategory) {
        // Переопределяем заголовок для текущей категории
        const updatedDocs = docs.map(doc => {
          if (doc.route === `/products/${currentCategory}`) {
            return {
              ...doc,
              title: getCategoryTitle(currentCategory)
            };
          }
          return doc;
        });
        
        return <nextra.sidebar.component docs={updatedDocs} activeType={activeType} />;
      }
      
      return <nextra.sidebar.component docs={docs} activeType={activeType} />;
    }
  }
}