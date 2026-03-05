import { useState } from 'react';

export default function InternetContent() {
  const [query, setQuery] = useState('');
  const [addressBar] = useState('http://www.google.com');

  const handleSearch = () => {
    if (query.trim()) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    }
  };

  return (
    <div className="internet-browser">
      {/* Address Bar */}
      <div className="internet-address-bar">
        <span className="internet-address-label">Address</span>
        <div className="internet-address-input">
          {addressBar}
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="internet-nav-bar">
        <span className="internet-nav-link internet-nav-active">Search</span>
        <span className="internet-nav-link">Images</span>
        <span className="internet-nav-link">Maps</span>
        <span className="internet-nav-link">News</span>
        <span className="internet-nav-link">Gmail</span>
      </div>

      {/* Google Page Content */}
      <div className="internet-page">
        {/* Google Logo */}
        <div className="internet-google-logo">
          <span className="google-letter google-blue">G</span>
          <span className="google-letter google-red">o</span>
          <span className="google-letter google-yellow">o</span>
          <span className="google-letter google-blue">g</span>
          <span className="google-letter google-green">l</span>
          <span className="google-letter google-red">e</span>
        </div>

        {/* Search Box */}
        <div className="internet-search-box">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="internet-search-input"
            placeholder=""
          />
        </div>

        {/* Buttons */}
        <div className="internet-search-buttons">
          <button type="button" className="internet-btn" onClick={handleSearch}>
            Google Search
          </button>
          <button type="button" className="internet-btn">
            I'm Feeling Lucky
          </button>
        </div>

        {/* Footer Links */}
        <div className="internet-footer-links">
          <span>Advertising Programs</span>
          <span>Business Solutions</span>
          <span>About Google</span>
        </div>
      </div>
    </div>
  );
}
