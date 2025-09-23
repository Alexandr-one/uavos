import Link from "next/link";
import styles from "./ContentCard.module.css";

interface Article {
  id?: string | number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;

}

interface ContentCardProps {
  article: Article;
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
          <p className={styles.excerpt}>{article.excerpt}</p>
          <div className={styles.meta}>
            <time className={styles.date} dateTime={article.date}>
              {formatDate(article.date)}
            </time>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default ContentCard;
