import React, { useState, useRef, useEffect } from 'react';
import type { ResumeData } from '../OptimizerContainer';
import '../common/SharedStyles.css';
import './JobDescriptionStep.css';
import { uploadResume, submitJobDescription } from '../../../services/resumeOptimizerService';
import { pollTaskStatus } from '../../../utils/polling';
import { useAuth } from '../../../context/AuthContext';
import LoadingComponent from '../common/LoadingComponent';
import { TASK_STATUS } from '../../../types/index';

interface JobDescriptionStep1Props {
  resumeData: ResumeData;
  updateResumeData: (data: Partial<ResumeData>) => void;
  nextStep: () => void;
  hasExistingResume: boolean;
}

const JobDescriptionStep1: React.FC<JobDescriptionStep1Props> = ({ nextStep, updateResumeData, resumeData, hasExistingResume }) => {
  const { userEmail } = useAuth(); // Get user email from Auth context
  const [useExistingResume, setUseExistingResume] = useState(hasExistingResume);
  const [jobDescription, setJobDescription] = useState(resumeData?.jobDescription || '');
  const [existingResume, setExistingResume] = useState<File | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('Processing your request...');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Handle option change to use existing resume
  const handleUseExistingResume = () => {
    setUseExistingResume(true);
    setSelectedFile(null); // Clear selected file when using existing resume
    
    // Update resume data with useExistingResume flag
    updateResumeData({
      useExistingResume: true
    });
  };

  // Check if user has existing resume
  useEffect(() => {
    if (hasExistingResume) {
      setExistingResume(new File([""], "existing-resume.pdf", { type: "application/pdf" }));
    }
  }, [hasExistingResume]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('drag-over');
    }
  };

  const handleDragLeave = () => {
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('drag-over');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleDragLeave();

    const files = e.dataTransfer.files;
    if (files.length) {
      setSelectedFile(files[0]);
      setUseExistingResume(false);
    }
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length) {
      setSelectedFile(files[0]);
      setUseExistingResume(false);
    }
  };

  // Handle the resume upload and job description submission process
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Parameter for job_desc API
      let jobDescParams: { task_id?: string; email?: string; job_description: string } = {
        job_description: jobDescription
      };

      // If using existing resume, use email
      if (useExistingResume) {
        if (!userEmail) {
          setError('User email not found. Please log in again.');
          setIsLoading(false);
          return;
        }
        jobDescParams.email = userEmail;
      } 
      // If uploading a new resume
      else if (selectedFile) {
        setLoadingMessage('Uploading your resume...');
        // 1. Upload the resume file
        const taskId = await uploadResume(selectedFile);
        
        setLoadingMessage('Processing your resume...');
        // 2. Poll for completion
        const status = await pollTaskStatus(taskId);
        
        if (status !== TASK_STATUS.SUCCESS) {
          throw new Error('Resume processing failed');
        }
        
        // 3. Use task_id for job description API
        jobDescParams.task_id = taskId;
        
        // Save task_id for later use
        updateResumeData({
          task_id: taskId
        });
      } else {
        setError('Please select a resume file or use an existing resume');
        setIsLoading(false);
        return;
      }
      
      setLoadingMessage('Analyzing job description and matching with resume...');
      // Submit job description
      console.log(jobDescParams);
      const jobDescResponse = await submitJobDescription(jobDescParams);
      
      // Update resume data with API response
      updateResumeData({
        file: useExistingResume ? existingResume : selectedFile,
        jobDescription,
        match_score_task_id: jobDescResponse.match_score_task_id,
        task_id: jobDescResponse.task_id || resumeData.task_id
      });

      setIsLoading(false);
      nextStep();
    } catch (err) {
      setIsLoading(false);
      setError(`An error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error in job description submission:', err);
    }
  };

  // If loading, show the loading component
  if (isLoading) {
    return <LoadingComponent statusText={loadingMessage} />
  }

  return (
    <div className="job-description-step card-content">
      <h2 className="app-heading">Tap My Resume</h2>

      {error && <div className="error-message">{error}</div>}
      
      <h3 className="section-title">Upload Your Resume</h3>

      {existingResume && (
        <button
          className={`resume-option-button ${useExistingResume ? 'active' : ''}`}
          onClick={handleUseExistingResume}
        >
          Use Existing Resume
        </button>
      )}

      <div
        className={`drop-zone ${selectedFile ? 'file-selected' : ''}`}
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileSelect}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="file-input"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx"
        />
        {selectedFile ? (
          <div className="selected-file">
            <p className="file-name">{selectedFile.name}</p>
          </div>
        ) : (
          <div className="drop-message">
            <span className="upload-icon"></span>
            <p>Drop/Upload</p>
          </div>
        )}
      </div>

      <h3 className="section-title">Add Job Description</h3>
      <textarea
        className="job-description-input"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        placeholder="Paste job description here..."
      ></textarea>

      <div className="action-buttons">
        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={(!selectedFile && !useExistingResume) || !jobDescription}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default JobDescriptionStep1;
