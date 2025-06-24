import React, { useState, useEffect } from 'react';
import type { ResumeData } from '../OptimizerContainer';
import '../common/SharedStyles.css';
import './JobDescriptionStep.css';
import { pollTaskResult } from '../../../utils/polling';
import { getUserDetails, generateResume } from '../../../services/resumeOptimizerService';
import LoadingComponent from '../common/LoadingComponent';
import { useAuth } from '../../../context/AuthContext';
import Lottie from 'lottie-react';
import successAnimation from '../../../assets/animation/success.json';

interface JobDescriptionStep3Props {
  resumeData: ResumeData;
  prevStep: () => void;
  updateResumeData: (data: ResumeData) => void;
  resetFlow: () => void;
}

const JobDescriptionStep3: React.FC<JobDescriptionStep3Props> = ({
  resumeData,
  updateResumeData,
  prevStep,
  resetFlow
}) => {
  const { userEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Generating your optimized resume...');
  const [pollingCompleted, setPollingCompleted] = useState(false);

  const handleDownload = () => {
    // Open the download URL in a new tab
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  const handleCreateAnother = () => {
    // Reset the flow to start over
    resetFlow();
  };

  // Handle the resume optimization process
  useEffect(() => {
    // Skip if we've already completed polling or don't have required data
    if (pollingCompleted || !resumeData.task_id) {
      return;
    }
    
    const processOptimizedResume = async () => {
      try {
        setIsLoading(true);
        
        // 1. Get the optimized resume data if we have a task_id from final builder
        if (!resumeData.task_id) {
          setError('Missing task ID for resume optimization');
          setIsLoading(false);
          return;
        }
        
        setLoadingMessage('Retrieving optimized resume data...');
        // Poll for final builder result with error handling
        let resumeResult;
        try {
          resumeResult = await pollTaskResult(resumeData.task_id);
          // Mark polling as completed to prevent re-polling
          setPollingCompleted(true);
          
          if (!resumeResult) {
            throw new Error('No data received from resume optimization');
          }
          
          // Update resume data with the optimized content
          updateResumeData({
            resume_data: resumeResult
          });
        } catch (pollError) {
          setError(`Error retrieving optimized resume data: ${pollError instanceof Error ? pollError.message : 'Server error'}`);
          setIsLoading(false);
          console.error('Error polling for optimized resume:', pollError);
          return;
        }
        
        // 2. Get user basic details
        if (!userEmail) {
          setError('User email not found. Please log in again.');
          setIsLoading(false);
          return;
        }
        
        // Handle both resume upload path and existing resume path correctly
        // For existing resume path, we might not have gotten the task_id from final_builder
        // but used email instead, so we'll pass the email in that case
        
        setLoadingMessage('Fetching your profile information...');
        const userDetails = await getUserDetails(userEmail);
        
        // Adapt the user details to the format expected by the generate-resume endpoint
        const basicDetails = {
          ...userDetails,
          phone: userDetails.phone_number // Map phone_number to phone as required
        };
        
        // 3. Generate the final resume
        setLoadingMessage('Generating your optimized resume...');
        
        // Prepare parameters for resume generation based on path
        // For uploaded resume path: use resume_data from final builder
        // For existing resume path: might need to use email instead
        const generateParams = {
          basic_details: basicDetails,
          resume_data: resumeResult,
          // If we're using existing resume and don't have task_id, pass email
          ...(resumeData.useExistingResume && !resumeData.task_id && userEmail ? { email: userEmail } : {})
        };
        
        // Generate the resume with proper error handling
        let generateResponse;
        try {
          setLoadingMessage('Generating final PDF document...');
          generateResponse = await generateResume(generateParams);
          
          // Validate the response
          if (!generateResponse || !generateResponse.pdf || !generateResponse.pdf.download_url) {
            throw new Error('Invalid response from resume generation service');
          }
          
          // Update the download URL
          setDownloadUrl(generateResponse.pdf.download_url);
          updateResumeData({
            download_url: generateResponse.pdf.download_url
          });
        } catch (generateError) {
          setError(`Error generating resume PDF: ${generateError instanceof Error ? generateError.message : 'Server error'}`);
          setIsLoading(false);
          console.error('Error generating resume:', generateError);
          return;
        }
        
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        setError(`Error generating resume: ${err instanceof Error ? err.message : 'Unknown error'}`);
        console.error('Error generating resume:', err);
      }
    };

    processOptimizedResume();
  }, [resumeData.task_id, userEmail, updateResumeData, pollingCompleted]);

  if (isLoading) {
    return <LoadingComponent statusText={loadingMessage} />;
  }

  if (error) {
    return (
      <div className="step-container">
        <h2 className="app-heading">Tap My Resume</h2>
        <div className="error-message">{error}</div>
        <button className="back-button" onClick={prevStep}>Back</button>
      </div>
    );
  }

  return (
    <div className="step-container step-3-container">
      <h2 className="step-heading">Tap My Resume</h2>
      
      <div className="success-icon">
        <Lottie 
          animationData={successAnimation} 
          loop={true}
          style={{ width: '100%', height: '100%' }} 
        />
      </div>
      
      <h3 className="success-heading">Your Resume is Ready!</h3>
      <p className="success-text">Your optimized resume is ready for download.</p>
      
      <button className="download-button" onClick={handleDownload}>
        Download Resume
      </button>
      
      <div className="step-actions centered">
        <button className="back-button" onClick={prevStep}>
          Back to Keywords
        </button>
      </div>
      
      <a className="create-another" onClick={handleCreateAnother}>
        Create Another Resume
      </a>
    </div>
  );
};

export default JobDescriptionStep3;
