import Link from "next/link";
import styles from "./content-card.module.css";
import { ContentFetchDto } from "@uavos/shared-types";

interface ContentCardProps {
  article: ContentFetchDto;
  onEdit?: () => void;  
  onDelete?: () => void; 
}

const ContentCard = ({ article, onEdit, onDelete }: ContentCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <article className={styles.card}>
      <Link href={`/content/${article.slug}`} className={styles.link}>
        <div className={styles.content}>
          <h2 className={styles.title}>{article.title}</h2>
        </div>
      </Link>
    </article>
  );
};

export default ContentCard;
