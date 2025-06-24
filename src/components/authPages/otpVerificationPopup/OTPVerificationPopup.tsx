import React, { useState, useRef, useEffect } from 'react';
import './OTPVerificationPopup.css';

// Define the type for setTimeout to avoid NodeJS namespace error
type TimeoutRef = ReturnType<typeof setTimeout> | null;

interface OTPVerificationPopupProps {
  email: string;
  onClose: () => void;
  onVerify: (otp: string) => void;
  onResendOtp: () => void;
}

const OTPVerificationPopup: React.FC<OTPVerificationPopupProps> = ({ 
  email, 
  onClose,
  onVerify,
  onResendOtp
}) => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [countdown, setCountdown] = useState<number>(0); // Countdown timer in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const popupRef = useRef<HTMLDivElement>(null);
  const countdownTimerRef = useRef<TimeoutRef>(null);

  // Initialize input refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);
  
  // Start countdown timer when component mounts
  useEffect(() => {
    // Start with 60 seconds countdown
    setCountdown(60);
    
    // Start the countdown timer
    const decrementCountdown = () => {
      setCountdown(prevCount => {
        if (prevCount <= 1) {
          // Timer finished
          return 0;
        }
        return prevCount - 1;
      });
    };
    
    // Set interval to decrement countdown every second
    countdownTimerRef.current = setInterval(decrementCountdown, 1000);
    
    // Clear interval when component unmounts
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

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

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    // Check if it's a paste operation with multiple digits
    if (value.length > 1) {
      // Only allow numbers
      if (!/^\d+$/.test(value)) return;
      
      // Handle paste of full OTP
      const digits = value.split('').slice(0, 6);
      const newOtp = [...otp];
      
      // Fill in the current and subsequent inputs
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      
      setOtp(newOtp);
      
      // Focus the next empty input or the last input if all filled
      const nextEmptyIndex = newOtp.findIndex(val => val === '');
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else {
        inputRefs.current[5]?.focus();
      }
    } else {
      // Regular single digit input
      // Only allow numbers
      if (!/^\d*$/.test(value)) return;

      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };
  
  // Handle paste event for OTP inputs
  const handlePaste = (e: React.ClipboardEvent, index: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    
    // Only proceed if pasted content contains numbers
    if (!/^\d+$/.test(pastedData)) return;
    
    // Extract up to 6 digits
    const digits = pastedData.slice(0, 6).split('');
    const newOtp = [...otp];
    
    // Fill in the inputs starting from the current index
    digits.forEach((digit, i) => {
      if (index + i < 6) {
        newOtp[index + i] = digit;
      }
    });
    
    setOtp(newOtp);
    
    // Focus the next empty input or the last input if all filled
    const nextEmptyIndex = newOtp.findIndex(val => val === '');
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  // Handle key press for backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input when backspace is pressed on an empty input
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    
    // Call onVerify callback with the OTP value
    onVerify(otpValue);
    
    // Note: We don't close the popup here as the parent component will handle that
    // based on whether the verification was successful or not
  };

  // Handle resend OTP
  const handleResendOtp = () => {
    // Call the parent's resend OTP function
    onResendOtp();
    
    // Reset countdown timer
    setCountdown(60);
    
    // Clear existing timer if any
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    
    // Start a new countdown timer
    const decrementCountdown = () => {
      setCountdown(prevCount => {
        if (prevCount <= 1) {
          // Timer finished
          return 0;
        }
        return prevCount - 1;
      });
    };
    
    countdownTimerRef.current = setInterval(decrementCountdown, 1000);
  };

  return (
    <div className="otp-verification-overlay">
      <div className="otp-verification-popup" ref={popupRef}>
        <div className="otp-verification-content">
          <span 
            className="close-button" 
            onClick={onClose}
          >
            ×
          </span>
          
          <div className="logo-container">
            <div className="dotted-logo"></div>
          </div>
          
          <h2>Verify Your Email</h2>
          <p>We've sent a verification code to <strong>{email}</strong>. Please enter the 6-digit code below.</p>
          
          <form onSubmit={handleSubmit}>
            <div className="otp-inputs">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={otp[index]}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={(e) => handlePaste(e, index)}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  autoFocus={index === 0}
                />
              ))}
            </div>
            
            <button type="submit" className="submit-button" disabled={otp.join('').length !== 6}>
              Verify
            </button>
          </form>
          
          <div className="resend-otp">
            <p>
              Didn't receive the code? 
              {countdown > 0 ? (
                <span>Resend in {countdown}s</span>
              ) : (
                <button onClick={handleResendOtp}>Resend</button>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationPopup;
