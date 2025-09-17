import ProductCard from './ProductCard';
import styles from './ProductList.module.css';

const ProductsList = ({ products }) => {
  if (!products || products.length === 0) {
    return <div className={styles.empty}>No products yet.</div>;
  }

  return (
    <div className={styles.list}>
      {products.map((product) => (
        <ProductCard key={product.slug || product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductsList;