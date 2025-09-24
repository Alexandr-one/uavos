import React from "react";
import ContentCard from "../card/content-card.template";
import styles from "./content-list.module.css";
import { ContentFetchDto } from "@uavos/shared-types";

interface ContentListProps {
  articles: ContentFetchDto[]|null;
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
