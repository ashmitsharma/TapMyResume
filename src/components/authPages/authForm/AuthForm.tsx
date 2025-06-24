import React, { useState, useEffect } from 'react';
import './AuthForm.css';
import ForgotPasswordPopup from '../forgotPasswordPopup/ForgotPasswordPopup';
import NewPasswordPopup from '../newPasswordPopup/NewPasswordPopup';
import { useAuth } from '../../../context/AuthContext';
import OTPVerificationPopup from '../otpVerificationPopup/OTPVerificationPopup';
import TapMyTalentLogo from '../../../assets/logo/TapMyTalentLogo.webp'
import TogglerBg from '../../../assets/images/sign-up-in-bg.png'
import { authService } from '../../../services/authService'
import { useNavigate } from 'react-router-dom'

// Define the form data interface
interface FormData {
  email: string;
  password: string;
  fullName?: string; // Optional for Sign Up
  confirmPassword?: string; // Optional for Sign Up
  phone?: string; // Add phone field
}

// Define the auth state interface
interface AuthState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
  verifiedOtp: string | null;
  newPassword?: string | null;
  otpVerified: boolean;
  // Add timestamp to force re-renders when otpVerified changes
  lastVerifiedAt?: number;
}

// Main AuthForm component
const AuthForm: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate(); // Hook to navigate programmatically
  const [isSignUp, setIsSignUp] = useState(false); // State for showing/hiding popups
  const [showForgotPassword, setShowForgotPassword] = useState(false); // Used in JSX
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [otpEmail, setOtpEmail] = useState<string>(''); // Dedicated state for email during OTP flow
  // Track the stage of the forgot password flow
  const [forgotPasswordStage, setForgotPasswordStage] = useState<'email' | 'otp' | 'password'>('email');
  
  // Reset forgotPasswordStage when component mounts
  // Initialize states and add debug logging
  useEffect(() => {
    setForgotPasswordStage('email');
    console.log('AuthForm initialized with forgotPasswordStage: email');
  }, []);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    phone: '',
    fullName: '',
    confirmPassword: '',
  });
  
  // Auth state for managing API calls - used throughout component for tracking auth status
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: false,
    error: null,
    success: null,
    verifiedOtp: null,
    newPassword: null,
    otpVerified: false
  });
  
  // Additional validation states
  const [emailExists, setEmailExists] = useState<boolean>(false);
  const [passwordMismatch, setPasswordMismatch] = useState<boolean>(false);
  const [emailTouched, setEmailTouched] = useState<boolean>(false);
  
  // Debug: Log state changes for forgot password flow
  useEffect(() => {
    console.log('Forgot Password State Changed:', { 
      stage: forgotPasswordStage, 
      showForgotPassword, 
      otpVerified: authState.otpVerified,
      showOTPVerification,
      renderingNewPasswordPopup: showForgotPassword && forgotPasswordStage === 'password'
    });
  }, [forgotPasswordStage, showForgotPassword, authState.otpVerified, showOTPVerification]);

  // Check if the screen is mobile size
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear email exists error when user changes email
    if (name === 'email') {
      setEmailExists(false);
      setEmailTouched(false);
    }
    
    // Check password match when either password or confirmPassword changes
    if (isSignUp && (name === 'password' || name === 'confirmPassword')) {
      if (name === 'password') {
        setPasswordMismatch(value !== formData.confirmPassword && formData.confirmPassword !== '');
      } else {
        setPasswordMismatch(formData.password !== value);
      }
    }
  };

  // Handle input changes (already defined - no duplicate needed)

  // Handle email blur for validation
  const handleEmailBlur = async () => {
    if (formData.email && isSignUp) {
      setEmailTouched(true);
      try {
        setAuthState(prev => ({ ...prev, isLoading: true }));
        const checkMailResult = await authService.checkMail(formData.email);
        setEmailExists(checkMailResult.exists);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error('Error checking email:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthState(prev => ({ ...prev, isLoading: true, error: null, success: null }));
    
    try {
      if (isSignUp) {
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
          setPasswordMismatch(true);
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Passwords do not match. Please try again.'
          }));
          return;
        }
        
        // Check if email already exists
        const checkMailResult = await authService.checkMail(formData.email);
        
        if (checkMailResult.exists) {
          setEmailExists(true);
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: 'User already exists. If you forgot your password, please use the forgot password option.'
          }));
          return;
        }
        
        // Store email in dedicated state for OTP flow
        setOtpEmail(formData.email);
        console.log('Setting OTP email for sign-up:', formData.email);
        
        // Send OTP for registration
        const sendOtpResult = await authService.sendOtp(formData.email);
        
        if (sendOtpResult.status === 'ok') {
          setShowOTPVerification(true);
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            success: 'OTP sent to your email. Please verify.'
          }));
        }
      } else {
        // For sign-in, proceed with login
        await handleSignIn();
      }
    } catch (error: any) {
      // Format error message properly
      let errorMessage = 'An error occurred';
      
      if (error.response?.data) {
        const responseData = error.response.data;
        
        // Handle validation error object format
        if (responseData.msg && typeof responseData.msg === 'string') {
          errorMessage = responseData.msg;
        } else if (responseData.detail && typeof responseData.detail === 'string') {
          errorMessage = responseData.detail;
        } else if (responseData.message && typeof responseData.message === 'string') {
          errorMessage = responseData.message;
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  };
  
  // Handle successful OTP verification for registration flow only
  const handleOTPVerified = async (verifiedOtp: string) => {
    setAuthState(prev => ({ ...prev, verifiedOtp, isLoading: true, otpVerified: true }));
    
    try {
      if (isSignUp) {
        // For sign-up, register the user with the verified OTP
        // Ensure fullName is not undefined
        if (!formData.fullName) {
          throw new Error('Full name is required');
        }
        
        await authService.registerUser(
          {
            name: formData.fullName,
            email: otpEmail, // Use the dedicated otpEmail state
            password: formData.password,
            phone_number: formData.phone
          },
          otpEmail, // Email for bearer token
          verifiedOtp // OTP for bearer token
        );
        
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          success: 'Registration successful! Please login.'
        }));
        
        // Close OTP popup and show login form
        setShowOTPVerification(false);
        setIsSignUp(false);
        
        // Reset form for login
        setFormData({
          email: formData.email,
          password: '',
          fullName: '',
          confirmPassword: ''
        });
      }
    } catch (error: any) {
      // Format error message properly
      let errorMessage = 'An error occurred';
      
      if (error.response?.data) {
        const responseData = error.response.data;
        
        // Handle validation error object format
        if (responseData.msg && typeof responseData.msg === 'string') {
          errorMessage = responseData.msg;
        } else if (responseData.detail && typeof responseData.detail === 'string') {
          errorMessage = responseData.detail;
        } else if (responseData.message && typeof responseData.message === 'string') {
          errorMessage = responseData.message;
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  };

  // Handle sign in
  const handleSignIn = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Validate form
      if (!formData.email || !formData.password) {
        throw new Error('Email and password are required');
      }
      
      // Call login API
      const response = await authService.login({
        email: formData.email,
        password: formData.password
      });
      
      // Check if login was successful
      if (response && response.login === "SUCCESS" && response.user_email) {
        // Store user email in AuthContext
        login(response.user_email);
        
        // Show success message
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          success: 'Login successful!'
        }));
        
        // Navigate to home page after successful login
        setTimeout(() => {
          navigate('/');
        }, 1000); // Short delay to show success message before redirecting
      } else {
        throw new Error('Invalid login response format');
      }
      
    } catch (error: any) {
      // Format error message properly
      let errorMessage = 'Login failed';
      
      if (error.response?.data) {
        const responseData = error.response.data;
        
        // Handle validation error object format
        if (responseData.msg && typeof responseData.msg === 'string') {
          errorMessage = responseData.msg;
        } else if (responseData.detail && typeof responseData.detail === 'string') {
          errorMessage = responseData.detail;
        } else if (responseData.message && typeof responseData.message === 'string') {
          errorMessage = responseData.message;
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  };
  
  // Toggle between Sign In and Sign Up
  const toggleForm = () => {
    setIsSignUp(!isSignUp);
    // Reset form fields when switching
    setFormData((prev) => ({
      ...prev,
      fullName: isSignUp ? '' : prev.fullName,
      confirmPassword: isSignUp ? '' : prev.confirmPassword
    }));
  };

  return (
    <div className="auth-form-wrapper">
      <div className={`auth-form-container ${isSignUp ? 'auth-form-active' : ''}`}>
      {/* Mobile Tabs - Only visible on small screens */}
      {isMobile && (
        <div className="auth-form-mobile-tabs">
          <div
            className={`auth-form-mobile-tab ${!isSignUp ? 'auth-form-active' : ''}`}
            onClick={() => {
              setIsSignUp(false);
            }}
          >
            Sign In
          </div>
          <div
            className={`auth-form-mobile-tab ${isSignUp ? 'auth-form-active' : ''}`}
            onClick={() => {
              setIsSignUp(true);
            }}
          >
            Sign Up
          </div>
        </div>
      )}

      {/* Sign In Form */}
      <div className={`auth-form-form-container auth-form-sign-in ${isSignUp && isMobile ? 'auth-form-hidden' : ''}`}>
        <form onSubmit={handleSubmit}>
          {/* Logo */}
          <div className="auth-form-logo-container">
            <img src={TapMyTalentLogo} alt="Logo" className="auth-form-logo" />
          </div>

          <h1 style={{ fontSize: 32 }}>Sign in</h1>
          <p className="auth-form-welcome-text" style={{ fontSize: 16 }}>Welcome Back! Please sign in to continue</p>

          <div className="auth-form-social-icons">
            <a href="#" className="auth-form-icon">
              <img src="https://img.icons8.com/color/48/000000/google-logo.png" alt="Google" />
              Sign in with Google
            </a>
            <a href="#" className="auth-form-icon">
              <img src="https://img.icons8.com/color/48/000000/linkedin.png" alt="LinkedIn" />
              Sign in with LinkedIn
            </a>
          </div>

          <span style={{ fontSize: 14 }}>or use your email and password</span>

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <div className="auth-form-forgot-password">
            <a href="#" onClick={(e) => {
              e.preventDefault();
              setForgotPasswordStage('email');
              setShowForgotPassword(true);
            }}>Forgot your password?</a>
          </div>

          <button type="submit" style={{ fontSize: 16 }}>Sign In</button>

          {/* Mobile Toggle - Only visible on small screens */}
          {isMobile && (
            <div className="auth-form-mobile-toggle">
              <span onClick={toggleForm} style={{ fontSize: 14 }}>New here? Create an account</span>
            </div>
          )}
        </form>
      </div>

      {/* Sign Up Form */}
      <div className={`auth-form-form-container auth-form-sign-up ${!isSignUp && isMobile ? 'auth-form-hidden' : ''}`}>
        <form onSubmit={handleSubmit}>
          {/* Logo */}
          <div className="auth-form-logo-container">
            <img src={TapMyTalentLogo} alt="Logo" className="auth-form-logo" />
          </div>

          <h1 style={{ fontSize: 24 }}>Create your account</h1>
          <p className="auth-form-welcome-text" style={{ fontSize: 16 }}>Welcome! Please fill in the details to get started.</p>

          <div className="auth-form-social-icons">
            <a href="#" className="auth-form-icon">
              <img src="https://img.icons8.com/color/48/000000/google-logo.png" alt="Google" />
              Sign up with Google
            </a>
            <a href="#" className="auth-form-icon">
              <img src="https://img.icons8.com/color/48/000000/linkedin.png" alt="LinkedIn" />
              Sign up with LinkedIn
            </a>
          </div>

          <span style={{ fontSize: 14 }}>or use your email for registration</span>

          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleEmailBlur}
            className={emailExists && emailTouched ? 'input-error' : ''}
            required
          />
          {emailExists && emailTouched && (
            <div className="error-message">Email already exists</div>
          )}
          <input
            type="tel"
            id="phone"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={passwordMismatch ? 'input-error' : ''}
            required
          />
          {passwordMismatch && (
            <div className="error-message">Passwords do not match</div>
          )}

          <button type="submit" style={{ fontSize: 16 }}>Get Started</button>

          {isMobile ? (
            <div className="auth-form-terms" style={{ fontSize: 12 }}>
              By signing up, I agree to the Terms & Privacy Policy
            </div>
          ) : (
            <div className="auth-form-terms" style={{ fontSize: 14 }}>
              By signing up, I agree to the <a href="#">Terms of Use</a> and <a href="#">Privacy Policy</a>
            </div>
          )}

          {/* Mobile Toggle - Only visible on small screens */}
          {isMobile && (
            <div className="auth-form-mobile-toggle">
              <span onClick={toggleForm} style={{ fontSize: 14 }}>Already have an account? Sign in</span>
            </div>
          )}
        </form>
      </div>

      {/* Toggle Container - Only visible on larger screens */}
      <div className="auth-form-toggle-container">
        <div className="auth-form-toggle" style={{"--toggle-bg-image": `url(${TogglerBg})`} as React.CSSProperties}>
          <div className="auth-form-toggle-panel auth-form-toggle-left">
            <h1 style={{ fontSize: 32 }}>Already have an account?</h1>
            <p style={{ fontSize: 24 }}>Welcome Back! Sign in to access your account.</p>
            <button onClick={toggleForm} style={{ fontSize: 22 }}>Sign in</button>
          </div>
          <div className="auth-form-toggle-panel auth-form-toggle-right">
            <h1 style={{ fontSize: 32 }}>New Here?</h1>
            <p style={{ fontSize: 24 }}>Welcome! Create your account to get started.</p>
            <button onClick={toggleForm} style={{ fontSize: 22 }}>Sign up</button>
          </div>
        </div>
      </div>

      {/* New Password Popup */}
      {showForgotPassword && forgotPasswordStage === 'password' && (
        <NewPasswordPopup
          key={`new-password-${Date.now()}`}
          email={otpEmail || formData.email}
          onClose={() => {
            setShowForgotPassword(false);
            setForgotPasswordStage('email');
            setAuthState(prev => ({ ...prev, otpVerified: false }));
          }}
          onPasswordChange={async (newPassword) => {
            try {
              console.log('Setting new password for email:', otpEmail || formData.email);
              setAuthState(prev => ({ ...prev, isLoading: true }));
              
              // Call the API to reset the password
              await authService.forgotPass(
                otpEmail || formData.email,
                newPassword,
                authState.verifiedOtp || ''
              );
              
              setAuthState(prev => ({
                ...prev,
                isLoading: false,
                success: 'Password has been reset successfully! You can now sign in with your new password.',
                error: null
              }));
              
              // Close the popup and reset states
              setShowForgotPassword(false);
              setForgotPasswordStage('email');
              
              // Clear success message after some time
              setTimeout(() => {
                setAuthState(prev => ({ ...prev, success: null }));
              }, 5000);
              
            } catch (error) {
              setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to reset password. Please try again.'
              }));
            }
          }}
        />
      )}
      
      {/* Error or Success message display */}
      {/* {(authState.error || authState.success) && (
        <div className={`auth-message ${authState.error ? 'error' : 'success'}`}>
          {authState.error || authState.success}
        </div>
      )} */}
      {/* {authState.success && (
        <div className="auth-form-message success">
          {authState.success}
        </div>
      )} */}
      {authState.isLoading && (
        <div className="auth-form-message loading">
          Loading...
        </div>
      )}

      {/* Forgot Password Popup */}
      {showForgotPassword && (forgotPasswordStage === 'email' || forgotPasswordStage === 'otp') && !showOTPVerification && (
        <ForgotPasswordPopup
          key={`forgot-password-${Date.now()}`}
          email={formData.email}
          onClose={() => {
            setShowForgotPassword(false);
            setForgotPasswordStage('email');
            setAuthState(prev => ({ ...prev, otpVerified: false }));
          }}
          otpVerified={false} /* Always false for email/OTP entry stages */
          stage={forgotPasswordStage}
          onSendOtp={async (emailFromPopup) => {
            try {
              setAuthState(prev => ({ ...prev, isLoading: true }));
              const emailToUse = emailFromPopup || formData.email;
              setOtpEmail(emailToUse);
              await authService.sendOtp(emailToUse);
              setShowOTPVerification(true);
              setForgotPasswordStage('otp');
              setAuthState(prev => ({ 
                ...prev, 
                isLoading: false,
                success: 'OTP sent to your email. Please verify.'
              }));
            } catch (error: any) {
              // Format error message properly
              let errorMessage = 'Failed to send OTP';
              
              if (error.response?.data) {
                const responseData = error.response.data;
                
                // Handle validation error object format
                if (responseData.msg && typeof responseData.msg === 'string') {
                  errorMessage = responseData.msg;
                } else if (responseData.detail && typeof responseData.detail === 'string') {
                  errorMessage = responseData.detail;
                } else if (responseData.message && typeof responseData.message === 'string') {
                  errorMessage = responseData.message;
                } else if (typeof responseData === 'string') {
                  errorMessage = responseData;
                } else if (error.message) {
                  errorMessage = error.message;
                }
              }
              
              setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage
              }));
            }
          }}
        />
      )}
      
      {/* OTP Verification Popup */}
      {showOTPVerification && (
        <OTPVerificationPopup
          key={`otp-${Date.now()}`}
          email={otpEmail || ''}
          onClose={() => {
            // Just close the OTP popup without affecting showForgotPassword
            setShowOTPVerification(false);
            console.log('OTP popup closed. showForgotPassword remains:', showForgotPassword);
          }}
          onVerify={async (otp) => {
            try {
              setAuthState(prev => ({ ...prev, isLoading: true }));
              
              // Ensure email is not empty
              if (!otpEmail) {
                throw new Error('Email is required for OTP verification');
              }
              
              const result = await authService.verifyOtp(otpEmail, otp);
              
              if (result.valid) {
                // Always close OTP popup first
                setShowOTPVerification(false);
                
                // If we're in forgot password flow, show password fields
                if (showForgotPassword) {
                  console.log('OTP verified for forgot password flow, transitioning to password stage');
                  
                  // Add additional console logs to track state changes
                  console.log('Before state update - showForgotPassword:', showForgotPassword);
                  
                  // First set the OTP as verified in the state
                  setAuthState(prev => ({
                    ...prev, 
                    otpVerified: true, 
                    verifiedOtp: otp, 
                    isLoading: false,
                    lastVerifiedAt: Date.now() // Add timestamp to force re-renders
                  }));
                  
                  // First change stage to password, then close OTP popup
                  setForgotPasswordStage('password');
                  console.log('After setForgotPasswordStage - stage now: password');
                  
                  // Important: Close OTP popup AFTER stage transition
                  setShowOTPVerification(false);
                  
                  // Force a re-render through state update
                  setTimeout(() => {
                    console.log('DELAYED CHECK - Current states:', {
                      showForgotPassword,
                      forgotPasswordStage,
                      otpVerified: authState.otpVerified,
                      shouldShowNewPasswordPopup: showForgotPassword && forgotPasswordStage === 'password'
                    });
                  }, 100);
                } else {
                  // Normal registration flow
                  handleOTPVerified(otp);
                }
              } else {
                setAuthState(prev => ({
                  ...prev,
                  isLoading: false,
                  error: 'Invalid OTP. Please try again.'
                }));
              }
            } catch (error: any) {
              // Format error message properly
              let errorMessage = 'Failed to verify OTP';
              
              if (error.response?.data) {
                const responseData = error.response.data;
                
                // Handle validation error object format
                if (responseData.msg && typeof responseData.msg === 'string') {
                  errorMessage = responseData.msg;
                } else if (responseData.detail && typeof responseData.detail === 'string') {
                  errorMessage = responseData.detail;
                } else if (responseData.message && typeof responseData.message === 'string') {
                  errorMessage = responseData.message;
                } else if (typeof responseData === 'string') {
                  errorMessage = responseData;
                } else if (error.message) {
                  errorMessage = error.message;
                }
              }
              
              setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage
              }));
            }
          }}
          onResendOtp={async () => {
            try {
              setAuthState(prev => ({ ...prev, isLoading: true }));
              // Use otpEmail which is specifically set for the OTP flow instead of formData.email
              await authService.sendOtp(otpEmail || formData.email);
              setAuthState(prev => ({
                ...prev,
                isLoading: false,
                success: 'OTP resent to your email.'
              }));
            } catch (error: any) {
              // Format error message properly
              let errorMessage = 'Failed to resend OTP';
              
              if (error.response?.data) {
                const responseData = error.response.data;
                
                // Handle validation error object format
                if (responseData.msg && typeof responseData.msg === 'string') {
                  errorMessage = responseData.msg;
                } else if (responseData.detail && typeof responseData.detail === 'string') {
                  errorMessage = responseData.detail;
                } else if (responseData.message && typeof responseData.message === 'string') {
                  errorMessage = responseData.message;
                } else if (typeof responseData === 'string') {
                  errorMessage = responseData;
                } else if (error.message) {
                  errorMessage = error.message;
                }
              }
              
              setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage
              }));
            }
          }}
        />
      )}
      </div>
    </div>
  );
};

export default AuthForm;
