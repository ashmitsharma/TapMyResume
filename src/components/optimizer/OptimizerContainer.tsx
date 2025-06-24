import React, { useState } from 'react';
import './OptimizerContainer.css';
import './common/SharedStyles.css';
// Components
import StepIndicator from './common/StepIndicator';
import JobDescriptionStep1 from './jobDescription/JobDescriptionStep1';
import JobDescriptionStep2 from './jobDescription/JobDescriptionStep2';
import JobDescriptionStep2_5 from './jobDescription/JobDescriptionStep2_5';
import JobDescriptionStep3 from './jobDescription/JobDescriptionStep3';
// Keyword Flow
import KeywordsFlow from './keywords/KeywordsFlow';
// Types
export type ResumeData = {
  file?: File | null;
  jobDescription?: string;
  keywords?: string;
  selectedKeywords?: string[];
  customKeywords?: string[];
  isPaidUser?: boolean;
  existingResume?: string;
  useExistingResume?: boolean;
  // API response fields
  task_id?: string;
  match_score_task_id?: string;
  match_rate?: number;
  expected_rate?: number;
  missing_keywords?: string[];
  resume_data?: any;
  download_url?: string;
};

export type FlowType = 'jobDescription' | 'keywords';
export type StepType = 1 | 2 | 2.5 | 3;

const OptimizerContainer: React.FC = () => {
  const [activeFlow, setActiveFlow] = useState<FlowType>('jobDescription');
  const [currentStep, setCurrentStep] = useState<StepType>(1);
  const [resumeData, setResumeData] = useState<ResumeData>({
    isPaidUser: false // Default to unpaid user
  });
  const [hasExistingResume, setHasExistingResume] = useState<boolean>(false);

  // Check if user has previously uploaded a resume
  React.useEffect(() => {
    // Mock API call to check for existing resume
    const checkExistingResume = async () => {
      // This would be an actual API call in production
      setTimeout(() => {
        setHasExistingResume(true); // Mock response
      }, 500);
    };

    checkExistingResume();
  }, []);

  // Handle flow toggle
  const toggleFlow = (flow: FlowType) => {
    // Only allow switching flows if at step 1
    if (flow !== activeFlow && currentStep === 1) {
      setActiveFlow(flow);
      setCurrentStep(1);
    }
  };

  // Determine if flow toggle buttons should be disabled
  const isFlowToggleDisabled = currentStep > 1;

  const nextStep = () => {
    if (currentStep === 2 && !resumeData.isPaidUser) {
      // If user is at step 2 and is not a paid user, go to step 2.5
      setCurrentStep(2.5);
    } else if (currentStep < 3) {
      setCurrentStep(prev => {
        if (prev === 2.5) return 3;
        return (prev + 1) as StepType;
      });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => {
        if (prev === 2.5) return 2;
        return (prev - 1) as StepType;
      });
    }
  };

  const updateResumeData = (newData: Partial<ResumeData>) => {
    setResumeData(prev => ({ ...prev, ...newData }));
  };

  return (
    <div className="optimizer-container">
      <div className="flow-toggle-buttons">
        <button 
          className={`toggle-button ${activeFlow === 'jobDescription' ? 'active' : ''} ${isFlowToggleDisabled && activeFlow !== 'jobDescription' ? 'disabled' : ''}`}
          onClick={() => toggleFlow('jobDescription')}
          disabled={isFlowToggleDisabled && activeFlow !== 'jobDescription'}
        >
          Job Description
        </button>
        <button 
          className={`toggle-button ${activeFlow === 'keywords' ? 'active' : ''} ${isFlowToggleDisabled && activeFlow !== 'keywords' ? 'disabled' : ''}`}
          onClick={() => toggleFlow('keywords')}
          disabled={isFlowToggleDisabled && activeFlow !== 'keywords'}
        >
          Keywords
        </button>
      </div>
      
      <StepIndicator currentStep={currentStep} totalSteps={3} />
      
      <div className="flow-content">
        {activeFlow === 'jobDescription' && (
          <div className="job-description-flow">
            {currentStep === 1 && (
              <JobDescriptionStep1 
                resumeData={resumeData}
                updateResumeData={updateResumeData}
                nextStep={nextStep}
                hasExistingResume={hasExistingResume}
              />
            )}
            
            {currentStep === 2 && (
              <JobDescriptionStep2 
                resumeData={resumeData}
                updateResumeData={updateResumeData}
                nextStep={nextStep}
                prevStep={prevStep}
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
                updateResumeData={updateResumeData}
                prevStep={prevStep}
                resetFlow={() => setCurrentStep(1)}
              />
            )}
          </div>
        )}
        {activeFlow === 'keywords' && (
          <KeywordsFlow
            resumeData={resumeData}
            updateResumeData={updateResumeData}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            hasExistingResume={hasExistingResume}
          />
        )}
      </div>
    </div>
  );
};

export default OptimizerContainer;
