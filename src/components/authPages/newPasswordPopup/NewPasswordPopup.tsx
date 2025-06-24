import React, { useState, useRef, useEffect } from 'react';
import '../forgotPasswordPopup/ForgotPasswordPopup.css'; // Reuse existing styles

interface NewPasswordPopupProps {
  email: string;
  onClose: () => void;
  onPasswordChange: (newPassword: string) => void;
}

const NewPasswordPopup: React.FC<NewPasswordPopupProps> = ({ 
  email, 
  onClose,
  onPasswordChange
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }
    
    // Pass the new password to parent component
    onPasswordChange(newPassword);
  };

  return (
    <div className="forgot-password-overlay">
      <div className="forgot-password-popup" ref={popupRef}>
        <div className="forgot-password-content">
          <span 
            className="close-button" 
            onClick={onClose}
          >
            ×
          </span>
          
          <div className="logo-container">
            <div className="dotted-logo"></div>
          </div>
          
          <h2>Create New Password</h2>
          <p>Please enter your new password below</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email<span className="required">*</span></label>
              <input
                id="email"
                type="email"
                value={email}
                disabled={true}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="new-password">New Password<span className="required">*</span></label>
              <input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password<span className="required">*</span></label>
              <input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            {passwordError && (
              <div className="error-message">{passwordError}</div>
            )}
            
            <button type="submit" className="submit-button">
              Change Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewPasswordPopup;
