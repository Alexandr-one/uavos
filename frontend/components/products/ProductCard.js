import Link from 'next/link';
import styles from './ProductCard.module.css';

const ProductCard = ({ product}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  return (
    <div className={styles.card}>
      <Link href={`/products/${product.slug}`} className={styles.link}>
        <div className={styles.content}>
          <h2 className={styles.title}>{product.title}</h2>
          <p className={styles.excerpt}>{product.excerpt}</p>
          <div className={styles.meta}>
            <time className={styles.date} dateTime={product.date}>
              {formatDate(product.date)}
            </time>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;