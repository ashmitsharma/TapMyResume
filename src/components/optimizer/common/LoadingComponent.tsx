import React from 'react';
import Lottie from 'lottie-react';
import resumeLoadingAnimation from '../../../assets/animation/resume_loading.json';
import './SharedStyles.css';
import '../jobDescription/JobDescriptionStep.css';

interface LoadingComponentProps {
  statusText: string;
}

const LoadingComponent: React.FC<LoadingComponentProps> = ({ statusText }) => {
  return (
    <div className="step-container step-2-container">
      <h2 className="app-heading">Tap My Resume</h2>
      
      <div className="loading-container">
        <div className="loading-animation">
          <Lottie 
            animationData={resumeLoadingAnimation}
            loop={true}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        
        <p className="loading-status">{statusText}</p>
      </div>
    </div>
  );
};

export default LoadingComponent;
