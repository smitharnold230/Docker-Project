function SearchBar({ query, onQueryChange, category, onCategoryChange, categories }) {
  return (
    <div className="search-controls">
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search products by name"
        className="search-input"
      />

      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="category-select"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SearchBar;
