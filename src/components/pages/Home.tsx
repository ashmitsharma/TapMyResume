import React, { useState, useEffect } from 'react';
import './Home.css';
import resumeImage from '../../assets/images/heroImageHome.png';
import { useAuth } from '../../context/AuthContext';
import { getMasterData, getDetails, putMasterEdu, putMasterData } from '../../services/userDetailsService';
import { uploadResume } from '../../services/resumeOptimizerService';
import PopupForm from '../common/PopupForm';
import { pollTaskStatus, pollTaskResult } from '../../utils/polling';
import handShake from '../../assets/icons/handshake 2.png';
import aiChipset from '../../assets/icons/ai-chipset 2.png';
import trustBadge from '../../assets/icons/trust 2.png';
import secureBadge from '../../assets/icons/secure 1.png';

const Home: React.FC = () => {
  const { isAuthenticated, userEmail } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Check if user has master data, if not show popup
  useEffect(() => {
    const checkUserData = async () => {
      if (isAuthenticated && userEmail) {
        try {
          await getMasterData(userEmail);
          // User exists with master data, no need to show popup
        } catch (error: any) {
          if (error.message === 'User not found') {
            // User not found, show popup
            try {
              // Pre-fill form with available user details
              const details = await getDetails(userEmail);
              setUserDetails(details);
              setShowPopup(true);
            } catch (detailsError) {
              console.error('Error fetching user details:', detailsError);
              // Still show popup but with no pre-filled data
              setShowPopup(true);
            }
          } else {
            console.error('Error checking master data:', error);
            setErrorMessage('Error checking user data. Please try again.');
          }
        }
      }
    };

    if (isAuthenticated && userEmail) {
      checkUserData();
    }
  }, [isAuthenticated, userEmail]);

  // Handle form submission from popup
  const handleFormSubmit = async (formData: any) => {
    if (!userEmail) return;
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Step 1: Update education and certification data
      const eduData = {
        Education: formData.educations.map((edu: any) => ({
          institution: edu.institution,
          location: edu.location,
          degree: edu.degree,
          startDate: edu.startDate,
          endDate: edu.endDate
        })),
        Certifications: formData.certifications.map((cert: any) => ({
          Title: cert.title,
          Desc: cert.description
        }))
      };
      
      await putMasterEdu(userEmail, eduData);
      
      // Step 2: Upload resume and process it
      if (formData.resume) {
        const taskId = await uploadResume(formData.resume);
        
        // Poll for task completion
        await pollTaskStatus(taskId);
        
        // Get result once task is completed
        const result = await pollTaskResult(taskId);
        
        // Step 3: Update master data with results
        if (result && result.work_experiences) {
          const success = await putMasterData(userEmail, result);
          
          if (success && success.status) {
            // Close popup on success
            setShowPopup(false);
          } else {
            setErrorMessage('Failed to update user data');
          }
        } else {
          setErrorMessage('Failed to process resume');
        }
      } else {
        setErrorMessage('Resume is required');
      }
    } catch (error) {
      console.error('Error during form submission:', error);
      setErrorMessage('An error occurred during submission. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="home-page">
        <div className="hero-section">
          <div className="container hero-container">
            <div className="hero-content">
              <h1>Welcome to <span className="accent">Tap My Resume</span>!</h1>
              <h2>Smarter resumes. Faster job offers.</h2>
              <p>Empowering students and graduates to land interviews with AI-powered resume optimization and job-matching intelligence.</p>
              
              <ul className="feature-list">
                <li>✓ Upload Your Resume</li>
                <li>✓ Get Instant AI Suggestions</li>
                <li>✓ Boost Your ATS Score</li>
              </ul>
              
              <button className="btn btn-primary">Optimize Resume</button>
              
              <div className="trust-badges">
                <div className="badge">
                  <span className="badge-icon"><img src={handShake} alt="handshake" /></span>
                  <span className="badge-text">Trusted by over <strong>2,000+ students</strong> and <strong>job seekers</strong></span>
                </div>
                <div className="badge">
                  <span className="badge-icon"><img src={aiChipset} alt="ai-chipset" /></span>
                  <span className="badge-text">Built with AI to boost <strong>ATS visibility</strong> and <strong>hiring potential</strong></span>
                </div>
                <div className="badge">
                  <span className="badge-icon"><img src={trustBadge} alt="trust-badge" /></span>
                  <span className="badge-text">Crafted with precision by the <strong>Tap My Talent</strong> team</span>
                </div>
                <div className="badge">
                  <span className="badge-icon"><img src={secureBadge} alt="secure-badge" /></span>
                  <span className="badge-text">Secure & Confidential</span>
                </div>
              </div>
            </div>
            <div className="hero-image">
              <div className="resume-images">
                <img src={resumeImage} alt="Resume optimization" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPopup && (
        <PopupForm
          isOpen={showPopup}
          onClose={() => setShowPopup(false)}
          onSubmit={handleFormSubmit}
          initialData={userDetails ? {
            name: userDetails.name || '',
            email: userDetails.email || userEmail || '',
            phone: userDetails.phone || '',
          } : undefined}
          isLoading={isLoading}
          error={errorMessage}
        />
      )}
    </>
  );
};

export default Home;
