import { Link, Route, Routes } from 'react-router-dom';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">Product Catalog + Redis Cache</Link>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<ProductListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
