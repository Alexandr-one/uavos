import ArticleCard from './ArticleCard';
import styles from './ArticlesList.module.css';

const ArticlesList = ({ articles }) => {
  if (!articles || articles.length === 0) {
    return <div className={styles.empty}>No articles yet.</div>;
  }

  return (
    <div className={styles.list}>
      {articles.map((article) => (
        <ArticleCard key={article.slug || article.id} article={article} />
      ))}
    </div>
  );
};

export default ArticlesList;