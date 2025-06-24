import React, { useState, useEffect } from 'react';
import type { ResumeData } from '../OptimizerContainer';
import '../common/SharedStyles.css';
import './JobDescriptionStep.css';
import { pollTaskResult } from '../../../utils/polling';
import { submitFinalBuilder } from '../../../services/resumeOptimizerService';
import LoadingComponent from '../common/LoadingComponent';
import type { MatchScoreResponse } from '../../../services/resumeOptimizerService';
import { useAuth } from '../../../context/AuthContext';

interface JobDescriptionStep2Props {
  resumeData: ResumeData;
  updateResumeData: (data: Partial<ResumeData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

// Interface for internal component state
interface ScoreData {
  match_rate: number;
  expected_rate: number;
  missing_keywords: string[];
}

const JobDescriptionStep2: React.FC<JobDescriptionStep2Props> = ({
  resumeData,
  updateResumeData,
  nextStep,
  prevStep
}) => {
  const { userEmail } = useAuth(); // Get user email from Auth context
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [customKeyword, setCustomKeyword] = useState('');
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing resume match score...');
  const [pollingCompleted, setPollingCompleted] = useState(false);

  // Fetch match score data from the API using the match_score_task_id
  useEffect(() => {
    // Skip polling if it has already completed successfully
    if (pollingCompleted || !resumeData.match_score_task_id) {
      return;
    }

    const fetchScoreData = async () => {
      try {
        setIsLoading(true);
        setLoadingMessage('Analyzing resume match score...');
        
        if (!resumeData.match_score_task_id) {
          setError('Missing match score task ID. Please go back and try again.');
          setIsLoading(false);
          return;
        }
        
        // Poll for the match score result with retry logic
        let result: MatchScoreResponse | null = null;
        try {
          result = await pollTaskResult(resumeData.match_score_task_id) as MatchScoreResponse;
          // Mark polling as completed to prevent re-polling
          setPollingCompleted(true);
        } catch (pollError) {
          console.error('Error polling for match score result:', pollError);
          setIsLoading(false);
          setError(`Error fetching match score: ${pollError instanceof Error ? pollError.message : 'Server error'}`);
          return;
        }
        
        if (!result) {
          setError('No data received from match score analysis');
          setIsLoading(false);
          return;
        }

        // Format and process the score data for display
        const scoreData = {
          match_rate: result.match_rate,
          expected_rate: result.expected_rate,
          missing_keywords: result.missing_keywords || [],
        };
        
        // Update the resume data with match rate and missing keywords
        updateResumeData({
          match_rate: result.match_rate,
          expected_rate: result.expected_rate,
          missing_keywords: result.missing_keywords
        });
        
        setScoreData(scoreData);
        setSelectedKeywords(result.missing_keywords); // Select all by default
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        setError(`Error fetching match score: ${err instanceof Error ? err.message : 'Unknown error'}`);
        console.error('Error fetching match score:', err);
      }
    };

    fetchScoreData();
  }, [resumeData.match_score_task_id, updateResumeData, pollingCompleted]);

  const handleKeywordToggle = (keyword: string) => {
    setSelectedKeywords(prev => {
      if (prev.includes(keyword)) {
        return prev.filter(k => k !== keyword);
      } else {
        return [...prev, keyword];
      }
    });
  };

  const handleAddCustomKeyword = () => {
    if (customKeyword.trim()) {
      setCustomKeywords(prev => [...prev, customKeyword.trim()]);
      setSelectedKeywords(prev => [...prev, customKeyword.trim()]);
      setCustomKeyword('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCustomKeyword();
    }
  };

  const handleOptimize = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('Preparing to optimize your resume...');
      
      // Validate that we have at least some keywords selected
      if (selectedKeywords.length === 0) {
        setError('Please select at least one keyword to continue.');
        setIsLoading(false);
        return;
      }
      
      // Make sure we have either a task_id (for uploaded resumes) or useExistingResume is true (for existing resumes)
      if (!resumeData.task_id && !resumeData.useExistingResume) {
        setError('Missing required data for optimization. Please go back and try again.');
        setIsLoading(false);
        return;
      }
      
      // Prepare parameters for final builder based on whether user is using existing resume or uploaded one
      const params: { missing_keywords: string[], task_id?: string, email?: string } = {
        missing_keywords: [...selectedKeywords, ...customKeywords] // Include both selected and custom keywords
      };
      
      // If using existing resume, use email; otherwise use task_id
      if (resumeData.useExistingResume && userEmail) {
        params.email = userEmail;
      } else if (resumeData.task_id) {
        params.task_id = resumeData.task_id;
      }
      
      // Submit the final builder request
      let response;
      try {
        response = await submitFinalBuilder(params);
        
        if (!response || !response.task_id) {
          throw new Error('Invalid response from optimization service');
        }
      } catch (submitError) {
        setIsLoading(false);
        setError(`Failed to submit optimization request: ${submitError instanceof Error ? submitError.message : 'Server error'}`);
        console.error('Error submitting final builder request:', submitError);
        return;
      }
      
      // Update the resume data with the task ID for the next step
      updateResumeData({
        selectedKeywords,
        customKeywords,
        task_id: response.task_id // This is the new task_id for final builder
      });
      
      setIsLoading(false);
      nextStep();
    } catch (err) {
      setIsLoading(false);
      setError(`Error optimizing resume: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error optimizing resume:', err);
    }
  };

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
    <div className="step-container step-2-container">
      <h2 className="step-heading">Tap My Resume</h2>
      
      <div className="scores-container">
        <div className="score-box current-score">
          <div className="score-label">Current Score</div>
          <div className="score-value">{scoreData?.match_rate}%</div>
        </div>
        <div className="score-box potential-score">
          <div className="score-label">Potential Score</div>
          <div className="score-value">{scoreData?.expected_rate}%</div>
        </div>
      </div>
      
      <div className="missing-keywords">
        <div className="keyword-section-title">Missing Keywords:</div>
        <div className="keyword-section-subtitle">Select keywords to include in your Optimized Resume</div>
        
        <div className="keyword-list">
          {scoreData?.missing_keywords.map((keyword, index) => (
            <div key={index} className="keyword-item">
              <input 
                type="checkbox" 
                id={`keyword-${index}`}
                className="keyword-checkbox"
                checked={selectedKeywords.includes(keyword)}
                onChange={() => handleKeywordToggle(keyword)}
              />
              <label htmlFor={`keyword-${index}`} className="keyword-label">{keyword}</label>
            </div>
          ))}
          
          {customKeywords.map((keyword, index) => (
            <div key={`custom-${index}`} className="keyword-item">
              <input 
                type="checkbox" 
                id={`custom-keyword-${index}`}
                className="keyword-checkbox"
                checked={selectedKeywords.includes(keyword)}
                onChange={() => handleKeywordToggle(keyword)}
              />
              <label htmlFor={`custom-keyword-${index}`} className="keyword-label">{keyword}</label>
            </div>
          ))}
        </div>
        
        <div className="keyword-section-title">Add Custom Keywords:</div>
        <div className="custom-keyword">
          <input 
            type="text" 
            value={customKeyword}
            onChange={(e) => setCustomKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type keyword here..."
          />
          <button className="add-button" onClick={handleAddCustomKeyword}>Add</button>
        </div>
      </div>
      
      <div className="step-actions">
        <button className="back-button" onClick={prevStep}>Back</button>
        <button className="optimize-button" onClick={handleOptimize}>Optimize Resume</button>
      </div>
    </div>
  );
};

export default JobDescriptionStep2;
