import React from 'react';
import type { ResumeData } from '../OptimizerContainer';
import '../common/SharedStyles.css';
import './JobDescriptionStep.css';

interface JobDescriptionStep2_5Props {
  resumeData: ResumeData;
  nextStep: () => void;
  prevStep: () => void;
}

const JobDescriptionStep2_5: React.FC<JobDescriptionStep2_5Props> = ({ nextStep, prevStep }) => {
  
  const handleGoToPremium = () => {
    // In a real implementation, this would redirect to the premium subscription page
    alert('Redirecting to premium subscription page');
    // For demo purposes, we'll just move to the next step
    nextStep();
  };
  
  const handleDownloadWithWatermark = () => {
    // In a real implementation, this would download the resume with watermark
    alert('Downloading resume with watermark');
    // For demo purposes, we'll just move to the next step
    nextStep();
  };
  
  return (
    <div className="job-description-step card-content">
      <h2 className="app-heading">Tap My Resume</h2>
      
      <h3 className="section-title almost-there">Almost There!</h3>
      
      <div className="premium-message">
        <p>Your optimized resume is ready for download.</p>
        <p>To access the final version, simply subscribe to Tap My Talent Premium and unlock all features.</p>
      </div>
      
      <div className="premium-actions">
        <button 
          className="premium-button" 
          onClick={handleGoToPremium}
        >
          Go Premium
        </button>
        
        <a 
          className="watermark-link" 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            handleDownloadWithWatermark();
          }}
        >
          Download with Watermark
        </a>
      </div>
      
      <div className="action-buttons">
        <button 
          className="back-button" 
          onClick={prevStep}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default JobDescriptionStep2_5;
