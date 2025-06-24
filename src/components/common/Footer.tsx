import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="social-icons">
            <a href="https://linkedin.com/" aria-label="LinkedIn">
              <i className="social-icon linkedin"></i>
            </a>
            <a href="https://instagram.com/" aria-label="Instagram">
              <i className="social-icon instagram"></i>
            </a>
            <a href="https://facebook.com/" aria-label="Facebook">
              <i className="social-icon facebook"></i>
            </a>
            <a href="https://twitter.com/" aria-label="Twitter">
              <i className="social-icon twitter"></i>
            </a>
          </div>
          <div className="footer-menu">
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/services">Services</a></li>
              <li><a href="/faqs">FAQs</a></li>
              <li><a href="/privacy-policy">Privacy Policies</a></li>
              <li><a href="/contact">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© Copyright 2025. Powered by Tap My Talent</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
