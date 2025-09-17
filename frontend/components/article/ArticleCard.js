import Link from 'next/link';
import styles from './ArticleCard.module.css';

const ArticleCard = ({ article, onEdit, onDelete}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  return (
    <article className={styles.card}>
      <Link href={`/articles/${article.slug}`} className={styles.link}>
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

export default ArticleCard;