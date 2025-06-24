import React, { useState, useRef, useEffect } from 'react';
import './Topbar.css';
import logo from '../../assets/logo/TapMyTalentLogo.webp';
import { useAuth } from '../../context/AuthContext';

const Topbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { isAuthenticated, userEmail, credits, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Control body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }

    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [isMenuOpen]);

  return (
    <div className="topbar">
      <div className="container topbar-container">
        <div className="topbar-logo">
          <img src={logo} alt="Tap My Talent" />
          <span>Tap My Talent</span>
        </div>
        
        {/* Hamburger Menu Button */}
        <div className="hamburger-icon" onClick={toggleMenu}>
          <div className={`hamburger-bar ${isMenuOpen ? 'open' : ''}`}></div>
          <div className={`hamburger-bar ${isMenuOpen ? 'open' : ''}`}></div>
          <div className={`hamburger-bar ${isMenuOpen ? 'open' : ''}`}></div>
        </div>

        {/* Menu Overlay - Darkens background when menu is open */}
        <div className={`menu-overlay ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}></div>

        {/* Mobile Menu - Shows when hamburger is clicked */}
        <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <nav className="mobile-nav">
            <ul>
              <li><a href="/" onClick={toggleMenu}>Home</a></li>
              <li><a href="/services" onClick={toggleMenu}>Services</a></li>
              <li><a href="/subscription" onClick={toggleMenu}>Subscription</a></li>
            </ul>
          </nav>
          <div className="mobile-buttons">
            <button className="btn btn-outline" onClick={toggleMenu}>Go Premium</button>
            {isAuthenticated ? (
              <button className="btn btn-solid" onClick={() => { toggleMenu(); logout(); }}>Logout</button>
            ) : (
              <button className="btn btn-solid" onClick={toggleMenu}>Sign up/Login</button>
            )}
          </div>
        </div>

        {/* Desktop Menu */}
        <nav className="topbar-nav desktop-only">
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/services">Services</a></li>
            <li><a href="/subscription">Subscription</a></li>
          </ul>
        </nav>
        <div className="topbar-buttons desktop-only">
          <button className="btn btn-outline">Go Premium</button>
          {isAuthenticated ? (
            <div className="user-dropdown" ref={dropdownRef}>
              <button className="email-button" onClick={toggleDropdown}>
                {userEmail}
              </button>
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-item credits">Credits: {credits}</div>
                  <button className="dropdown-item logout" onClick={logout}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn btn-solid">Sign up/Login</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;
