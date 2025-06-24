import React from 'react';
import './StepIndicator.css';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="step-indicator">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNum = index + 1;
        const isActive = stepNum <= currentStep;
        const isCompleted = stepNum < currentStep;
        
        return (
          <React.Fragment key={stepNum}>
            <div 
              className={`step-circle ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            ></div>
            
            {stepNum < totalSteps && (
              <div 
                className={`step-line ${stepNum < currentStep ? 'active' : ''}`}
              ></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;
