import React from "react";
import ContentCard from "./ContentCard";
import styles from "./ContentList.module.css";

interface Article {
  id?: string | number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
}

interface ContentListProps {
  articles: Article[];
}

const ContentList: React.FC<ContentListProps> = ({ articles }) => {
  if (!articles || articles.length === 0) {
    return <div className={styles.empty}>No content yet.</div>;
  }

  return (
    <div className={styles.list}>
      {articles.map((article) => (
        <ContentCard key={article.slug || article.id} article={article} />
      ))}
    </div>
  );
};

export default ContentList;
