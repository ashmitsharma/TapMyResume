import React, { useState, useRef, useEffect } from 'react';
import './ForgotPasswordPopup.css';

interface ForgotPasswordPopupProps {
  email: string;
  onClose: () => void;
  otpVerified: boolean;
  stage: 'email' | 'otp' | 'password';
  onSendOtp: (email: string) => Promise<void>;
}

const ForgotPasswordPopup: React.FC<ForgotPasswordPopupProps> = ({ 
  email, 
  onClose,
  otpVerified,
  stage,
  onSendOtp
}) => {
  const [emailInput, setEmailInput] = useState(email || '');
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
  
  // Update showPasswordFields when stage changes
  // Update email input when email prop changes
  useEffect(() => {
    if (email) {
      setEmailInput(email);
    }
  }, [email]);

  // Debug render
  console.log('ForgotPasswordPopup rendering with:', {
    otpVerified,
    stage,  // Use stage in debug log to avoid unused variable warning
    email,
    emailInput
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle email form submission (send OTP)
    onSendOtp(emailInput);
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
          
          <h2>Forgot your password?</h2>
          <p>Fill in your email you registered with and we will send you a mail to reset your password</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email<span className="required">*</span></label>
              <input
                id="email"
                type="email"
                placeholder=""
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className="submit-button">Send OTP</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPopup;
