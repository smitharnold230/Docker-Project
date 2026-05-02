import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cacheMeta, setCacheMeta] = useState(null);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return Array.from(set).sort();
  }, [products]);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();
        if (category) params.set('category', category);

        const endpoint = query.trim()
          ? `${API_BASE}/search?q=${encodeURIComponent(query.trim())}${
              category ? `&category=${encodeURIComponent(category)}` : ''
            }`
          : `${API_BASE}/products${params.toString() ? `?${params}` : ''}`;

        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Failed to fetch products');

        const data = await response.json();
        setProducts(data.products || []);
        setCacheMeta(data.meta || null);
      } catch (err) {
        setError(err.message || 'Unexpected error');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [query, category]);

  return (
    <section>
      <h1>Products</h1>
      <SearchBar
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
      />

      {cacheMeta && (
        <p className="cache-note">
          Cache: <strong>{cacheMeta.cache}</strong> | Source: <strong>{cacheMeta.source}</strong> | TTL: {cacheMeta.ttlSeconds}s
        </p>
      )}

      {loading && <p>Loading products...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && products.length === 0 && <p>No products found.</p>}

      <div className="grid">
        {products.map((product) => (
          <article key={product.id} className="card">
            <h3>{product.name}</h3>
            <p className="category">{product.category}</p>
            <p className="price">${Number(product.price).toFixed(2)}</p>
            <p>{product.description}</p>
            <Link to={`/products/${product.id}`} className="detail-link">
              View Details
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ProductListPage;
