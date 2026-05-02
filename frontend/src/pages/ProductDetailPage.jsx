import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE}/products/${id}`);
        if (!response.ok) {
          if (response.status === 404) throw new Error('Product not found');
          throw new Error('Failed to fetch product details');
        }

        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError(err.message || 'Unexpected error');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  if (loading) return <p>Loading product details...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <section className="detail-card">
      <Link to="/" className="back-link">Back to products</Link>
      <h1>{product.name}</h1>
      {product.meta && (
        <p className="cache-note">
          Cache: <strong>{product.meta.cache}</strong> | Source: <strong>{product.meta.source}</strong>
        </p>
      )}
      <p className="category">Category: {product.category}</p>
      <p className="price">Price: ${Number(product.price).toFixed(2)}</p>
      <p>{product.description}</p>
      <p className="muted">Added on: {new Date(product.created_at).toLocaleString()}</p>
    </section>
  );
}

export default ProductDetailPage;
