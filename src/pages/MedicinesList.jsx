import React, { useState, useEffect } from 'react';
import {
  Pill, Search, X, Loader2, FlaskConical, Syringe,
  Droplet, Package, Box, Grid, AlertCircle
} from 'lucide-react';
import './MedicinesList.css';

const API = import.meta.env.VITE_URL || 'http://localhost:5000';

const CATEGORIES = [
  { key: 'all', label: 'All Medicines', icon: Pill, color: '#3b82f6', bg: '#eff6ff' },
  { key: 'Tablet', label: 'Tablet', icon: Pill, color: '#0d9488', bg: '#ccfbf1' },
  { key: 'Capsule', label: 'Capsule', icon: Pill, color: '#8b5cf6', bg: '#f3e8ff' },
  { key: 'Syrup', label: 'Syrup', icon: FlaskConical, color: '#f59e0b', bg: '#fef3c7' },
  { key: 'Injection', label: 'Injection', icon: Syringe, color: '#ef4444', bg: '#fee2e2' },
  { key: 'Cream', label: 'Cream', icon: SparkleIcon, color: '#ec4899', bg: '#fce7f3' },
  { key: 'Drops', label: 'Drops', icon: Droplet, color: '#06b6d4', bg: '#cffafe' },
  { key: 'Powder', label: 'Powder', icon: Box, color: '#84cc16', bg: '#ecfccb' },
  { key: 'Other', label: 'Other', icon: Grid, color: '#64748b', bg: '#f1f5f9' },
];

function SparkleIcon(props) {
  return <Package {...props} />;
}

const MedicinesList = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ---- Search & Category Filter state ---- */
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await fetch(`${API}/medicine`);
      const data = await response.json();
      if (data.success) {
        setMedicines(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch medicines');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---- Dynamic Category Counts ---- */
  const counts = {
    all: medicines.length,
    Tablet: medicines.filter(m => (m.category || '').toLowerCase() === 'tablet').length,
    Capsule: medicines.filter(m => (m.category || '').toLowerCase() === 'capsule').length,
    Syrup: medicines.filter(m => (m.category || '').toLowerCase() === 'syrup').length,
    Injection: medicines.filter(m => (m.category || '').toLowerCase() === 'injection').length,
    Cream: medicines.filter(m => (m.category || '').toLowerCase() === 'cream').length,
    Drops: medicines.filter(m => (m.category || '').toLowerCase() === 'drops').length,
    Powder: medicines.filter(m => (m.category || '').toLowerCase() === 'powder').length,
    Other: medicines.filter(m => {
      const cat = (m.category || '').toLowerCase();
      return cat && !['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'powder'].includes(cat);
    }).length,
  };

  /* ---- Filtered Medicines ---- */
  const filteredMedicines = medicines.filter(med => {
    const matchesCategory = selectedCategory === 'all'
      ? true
      : selectedCategory === 'Other'
        ? !['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'powder'].includes((med.category || '').toLowerCase())
        : (med.category || '').toLowerCase() === selectedCategory.toLowerCase();

    const name = (med.medicine_name || '').toLowerCase();
    const generic = (med.generic_name || '').toLowerCase();
    const cat = (med.category || '').toLowerCase();
    const mfg = (med.manufacturer || '').toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || name.includes(q) || generic.includes(q) || cat.includes(q) || mfg.includes(q);

    return matchesCategory && matchesSearch;
  });

  if (loading) return (
    <div className="medicines-list-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <Loader2 size={32} className="ml-spinner" />
    </div>
  );
  if (error) return <div className="medicines-list-container"><div className="ml-error">Error: {error}</div></div>;

  return (
    <div className="medicines-list-container">
      {/* Header */}
      <div className="medicines-header">
        <div>
          <h2>Medicines Inventory</h2>
          <p>{medicines.length} medicine{medicines.length !== 1 ? 's' : ''} registered in pharmacy inventory</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="ml-toolbar">
        <div className="ml-search-box">
          <Search size={18} className="ml-search-icon" />
          <input
            type="text"
            placeholder="Search medicine by name, generic name, category, or manufacturer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ml-search-input"
          />
          {searchQuery && (
            <button className="ml-search-clear" onClick={() => setSearchQuery('')} title="Clear search">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="ml-results-count">
          Showing {filteredMedicines.length} of {medicines.length} medicines
        </div>
      </div>

      {/* Category Boxes Section below Search Bar */}
      <div className="ml-category-cards">
        {CATEGORIES.map(catItem => {
          const IconComp = catItem.icon;
          const count = counts[catItem.key] || 0;
          const isActive = selectedCategory === catItem.key;

          return (
            <button
              key={catItem.key}
              className={`ml-category-card ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedCategory(catItem.key)}
            >
              <div
                className="ml-category-card-icon"
                style={{ background: catItem.bg, color: catItem.color }}
              >
                <IconComp size={18} />
              </div>
              <div className="ml-category-card-info">
                <span className="ml-category-card-title">{catItem.label}</span>
                <span className="ml-category-card-count">{count} available</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Medicines Table */}
      <div className="table-responsive">
        <table className="medicines-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Category</th>
              <th>Manufacturer</th>
              <th>Strength / Unit</th>
              <th>Stock Status</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {filteredMedicines.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                  No medicines found matching the selected search criteria.
                </td>
              </tr>
            ) : (
              filteredMedicines.map(med => (
                <tr key={med._id}>
                  <td>
                    <div className="ml-medicine-cell">
                      <img
                        src={med.medicine_image || '/img/medicine_bottle.png'}
                        alt={med.medicine_name}
                        className="ml-avatar"
                        onError={e => { e.target.src = '/img/medicine_bottle.png'; }}
                      />
                      <div>
                        <div className="ml-name">{med.medicine_name}</div>
                        <div className="ml-desc">{med.generic_name || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="ml-cat-badge">{med.category}</span>
                  </td>
                  <td>{med.manufacturer}</td>
                  <td>{med.strength} / {med.unit}</td>
                  <td>
                    <span
                      className="ml-stock-pill"
                      style={{
                        background: med.stock_available > 20 ? '#dcfce7' : med.stock_available > 0 ? '#fef9c3' : '#fee2e2',
                        color: med.stock_available > 20 ? '#166534' : med.stock_available > 0 ? '#854d0e' : '#991b1b',
                      }}
                    >
                      {med.stock_available > 0 ? `${med.stock_available} units in stock` : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="ml-price">₹{med.price}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MedicinesList;
