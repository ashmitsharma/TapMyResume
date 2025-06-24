import React from 'react';
import type { ResumeData, StepType } from '../OptimizerContainer';
import '../common/SharedStyles.css';
import '../jobDescription/JobDescriptionStep.css';

// Import Step Components
import KeywordStep1 from './KeywordStep1';
import JobDescriptionStep2_5 from '../jobDescription/JobDescriptionStep2_5'; // Reusing the paywall component
import JobDescriptionStep3 from '../jobDescription/JobDescriptionStep3'; // Reusing the download component

interface KeywordsFlowProps {
  resumeData: ResumeData;
  updateResumeData: (data: Partial<ResumeData>) => void;
  currentStep: StepType;
  setCurrentStep: (step: StepType) => void;
  hasExistingResume: boolean;
}

const KeywordsFlow: React.FC<KeywordsFlowProps> = ({
  resumeData,
  updateResumeData,
  currentStep,
  setCurrentStep,
  hasExistingResume
}) => {
  // Handle step navigation
  const nextStep = () => {
    if (currentStep === 1 && !resumeData.isPaidUser) {
      // If user is at step 1 and is not a paid user, go to step 2.5 (paywall)
      setCurrentStep(2.5);
    } else if (currentStep < 3) {
      setCurrentStep(currentStep === 2.5 ? 3 : (currentStep + 1) as StepType);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep === 2.5 ? 1 : (currentStep - 1) as StepType);
    }
  };
  
  return (
    <>
      {currentStep === 1 && (
        <KeywordStep1 
          resumeData={resumeData}
          updateResumeData={updateResumeData}
          nextStep={nextStep}
          hasExistingResume={hasExistingResume}
        />
      )}
      
      {currentStep === 2.5 && (
        <JobDescriptionStep2_5 
          resumeData={resumeData}
          nextStep={nextStep}
          prevStep={prevStep}
        />
      )}
      
      {currentStep === 3 && (
        <JobDescriptionStep3 
          resumeData={resumeData}
          prevStep={prevStep}
          updateResumeData={updateResumeData}
          resetFlow={() => setCurrentStep(1)}
        />
      )}
    </>
  );
};

export default KeywordsFlow;
