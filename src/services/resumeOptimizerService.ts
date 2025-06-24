import axios, { AxiosError } from 'axios';

const BASE_URL = 'https://core.tapmytalent.com/resumeBuilder-Dev';
const DEFAULT_TIMEOUT = 15000; // 15 seconds timeout

// Custom error handler
const handleApiError = (error: any, customMessage: string): Error => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      // Server responded with a status code outside the 2xx range
      return new Error(
        `${customMessage}: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data) || axiosError.message}`
      );
    } else if (axiosError.request) {
      // The request was made but no response was received
      return new Error(`${customMessage}: No response received. Please check your network connection.`);
    } else {
      // Something happened in setting up the request
      return new Error(`${customMessage}: ${axiosError.message}`);
    }
  }
  // Unknown error
  return new Error(`${customMessage}: ${error?.message || 'Unknown error'}`);
};

// Interface for job description API request
interface JobDescRequest {
  task_id?: string;
  email?: string;
  job_description: string;
}

// Interface for final builder API request
interface FinalBuilderRequest {
  missing_keywords: string[];
  task_id?: string;
  email?: string;
}

// Interface for generate resume API request
interface GenerateResumeRequest {
  basic_details: {
    name: string;
    email: string;
    phone: string;
  };
  resume_data: any; // The resume data from the result endpoint
}

// Interface for match score response
export interface MatchScoreResponse {
  match_rate: number;
  missing_keywords: string[];
  expected_rate: number;
}

// Interface for user details response
export interface UserDetailsResponse {
  name: string;
  email: string;
  phone_number: string;
}

/**
 * Upload resume file to the server
 * @param file Resume file to upload
 * @returns Task ID from the server
 */
export const uploadResume = async (file: File): Promise<string> => {
  try {
    console.log(`[OPTIMIZE] Uploading resume file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
    
    const formData = new FormData();
    formData.append('resume', file);

    const response = await axios.post(`${BASE_URL}/upload_file/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: DEFAULT_TIMEOUT
    });

    if (!response.data || !response.data.task_id) {
      throw new Error('Invalid response format: missing task_id');
    }

    console.log(`[OPTIMIZE] Resume upload successful, received task_id: ${response.data.task_id}`);
    return response.data.task_id;
  } catch (error) {
    console.error('[OPTIMIZE] Resume upload failed:', error);
    throw handleApiError(error, 'Failed to upload resume');
  }
};

/**
 * Check status of a task
 * @param taskId Task ID to check
 * @returns Status of the task (SUCCESS or other)
 */
export const checkStatus = async (taskId: string): Promise<string> => {
  try {
    console.log(`[OPTIMIZE] Checking status for task: ${taskId}`);
    
    const response = await axios.get(`${BASE_URL}/check-status?task_id=${taskId}`, {
      timeout: DEFAULT_TIMEOUT
    });
    
    if (response.data === undefined || response.data === null) {
      throw new Error('Invalid response format: missing status data');
    }
    
    console.log(`[OPTIMIZE] Task ${taskId} status: ${response.data}`);
    return response.data;
  } catch (error) {
    console.error(`[OPTIMIZE] Failed to check status for task ${taskId}:`, error);
    throw handleApiError(error, `Failed to check status for task ${taskId}`);
  }
};

// /**
//  * Poll for task completion
//  * @param taskId Task ID to poll
//  * @param maxAttempts Maximum number of attempts
//  * @param interval Interval between attempts in ms
//  * @returns Promise resolving when task is completed
//  */
// export const pollForCompletion = async (
//   taskId: string, 
//   maxAttempts = 30,
//   interval = 2000
// ): Promise<void> => {
//   if (!taskId) {
//     throw new Error('Task ID is required for polling');
//   }
  
//   console.log(`[OPTIMIZE] Starting polling for task: ${taskId}, maxAttempts: ${maxAttempts}, interval: ${interval}ms`);
  
//   let attempts = 0;
  
//   return new Promise((resolve, reject) => {
//     // Create timeout to abort polling if it takes too long overall
//     const maxTime = maxAttempts * interval * 1.2; // Give slightly more time than theoretical max
//     const timeoutId = setTimeout(() => {
//       clearInterval(checkInterval);
//       console.error(`[OPTIMIZE] Polling timed out after ${maxTime}ms for task ${taskId}`);
//       reject(new Error(`Polling timed out after ${maxTime}ms for task ${taskId}`));
//     }, maxTime);
    
//     const checkInterval = setInterval(async () => {
//       try {
//         const status = await checkStatus(taskId);
//         attempts++;
        
//         console.log(`[OPTIMIZE] Poll attempt ${attempts}/${maxAttempts} for task ${taskId}: status = ${status}`);
        
//         if (status === 'SUCCESS') {
//           clearInterval(checkInterval);
//           clearTimeout(timeoutId);
//           console.log(`[OPTIMIZE] Task ${taskId} completed successfully after ${attempts} attempts`);
//           resolve();
//         } else if (status === 'FAILED' || status === 'ERROR') {
//           clearInterval(checkInterval);
//           clearTimeout(timeoutId);
//           console.error(`[OPTIMIZE] Task ${taskId} failed with status: ${status}`);
//           reject(new Error(`Task ${taskId} failed with status: ${status}`));
//         } else if (attempts >= maxAttempts) {
//           clearInterval(checkInterval);
//           clearTimeout(timeoutId);
//           console.error(`[OPTIMIZE] Maximum polling attempts (${maxAttempts}) reached for task ${taskId}`);
//           reject(new Error(`Maximum polling attempts (${maxAttempts}) reached for task ${taskId}`));
//         }
//         // Continue polling for PENDING or any other status
//       } catch (error) {
//         clearInterval(checkInterval);
//         clearTimeout(timeoutId);
//         console.error(`[OPTIMIZE] Error polling task ${taskId}:`, error);
//         reject(handleApiError(error, `Error while polling task ${taskId}`));
//       }
//     }, interval);
//   });
// };

/**
 * Get result of a completed task
 * @param taskId Task ID to get result for
 * @returns Result data
 */
export const getResult = async <T>(taskId: string): Promise<T> => {
  try {
    console.log(`[OPTIMIZE] Fetching result for task: ${taskId}`);
    
    const response = await axios.get(`${BASE_URL}/get_result?task_id=${taskId}`, {
      timeout: DEFAULT_TIMEOUT
    });
    
    if (!response.data) {
      throw new Error('Invalid response format: missing result data');
    }
    
    console.log(`[OPTIMIZE] Successfully received result for task ${taskId}:`, {
      resultType: typeof response.data,
      isArray: Array.isArray(response.data),
      hasData: !!response.data
    });
    
    return response.data;
  } catch (error) {
    console.error(`[OPTIMIZE] Failed to get result for task ${taskId}:`, error);
    throw handleApiError(error, `Failed to get result for task ${taskId}`);
  }
};

/**
 * Submit job description for analysis
 * @param params Parameters including task_id or email, and job description
 * @returns Response containing match_score_task_id and other fields
 */
export const submitJobDescription = async (params: JobDescRequest): Promise<{
  match_score_task_id: string;
  task_id: string | null;
  email: string | null;
}> => {
  try {
    console.log('[OPTIMIZE] Submitting job description:', { 
      hasTaskId: !!params.task_id,
      hasEmail: !!params.email,
      jobDescriptionLength: params.job_description?.length || 0
    });
    
    const response = await axios.post(`${BASE_URL}/job_desc`, params, {
      timeout: DEFAULT_TIMEOUT
    });
    
    if (!response.data || !response.data.match_score_task_id) {
      throw new Error('Invalid response format: missing match_score_task_id');
    }
    
    console.log('[OPTIMIZE] Job description submitted successfully:', {
      matchScoreTaskId: response.data.match_score_task_id,
      responseTaskId: response.data.task_id,
      responseEmail: response.data.email
    });
    
    return response.data;
  } catch (error) {
    console.error('[OPTIMIZE] Failed to submit job description:', error);
    throw handleApiError(error, 'Failed to submit job description');
  }
};

/**
 * Submit final builder request for resume optimization
 * @param params Parameters including missing_keywords and either task_id or email
 * @returns Task ID for the final builder process
 */
export const submitFinalBuilder = async (params: FinalBuilderRequest): Promise<{ task_id: string }> => {
  try {
    console.log('[OPTIMIZE] Submitting final builder request:', {
      keywordsCount: params.missing_keywords?.length || 0,
      hasTaskId: !!params.task_id,
      hasEmail: !!params.email,
      keywords: params.missing_keywords
    });
    
    const response = await axios.post(`${BASE_URL}/final_builder`, params, {
      timeout: DEFAULT_TIMEOUT
    });
    
    if (!response.data || !response.data.task_id) {
      throw new Error('Invalid response format: missing task_id');
    }
    
    console.log(`[OPTIMIZE] Final builder request successful, received task_id: ${response.data.task_id}`);
    return response.data;
  } catch (error) {
    console.error('[OPTIMIZE] Failed to submit final builder request:', error);
    throw handleApiError(error, 'Failed to submit final builder request');
  }
};

/**
 * Get user details by email
 * @param email User email
 * @returns User details
 */
export const getUserDetails = async (email: string): Promise<UserDetailsResponse> => {
  try {
    if (!email) {
      throw new Error('Email is required to fetch user details');
    }
    
    console.log(`[OPTIMIZE] Fetching user details for email: ${email}`);
    
    const response = await axios.get(`${BASE_URL}/userDetails/details?email=${encodeURIComponent(email)}`, {
      timeout: DEFAULT_TIMEOUT
    });
    
    if (!response.data || !response.data.email) {
      throw new Error('Invalid response format: missing user details');
    }
    
    console.log('[OPTIMIZE] Successfully retrieved user details:', {
      hasName: !!response.data.name,
      hasEmail: !!response.data.email,
      hasPhone: !!response.data.phone_number
    });
    
    return response.data;
  } catch (error) {
    console.error(`[OPTIMIZE] Failed to get user details for ${email}:`, error);
    throw handleApiError(error, `Failed to get user details for ${email}`);
  }
};

/**
 * Generate the final resume
 * @param params Parameters including basic_details and resume_data
 * @returns Response containing download URL
 */
export const generateResume = async (params: GenerateResumeRequest): Promise<{ 
  pdf: { download_url: string } 
}> => {
  try {
    if (!params.basic_details || !params.resume_data) {
      throw new Error('Missing required parameters for resume generation');
    }
    
    console.log('[OPTIMIZE] Generating resume PDF with parameters:', {
      hasName: !!params.basic_details.name,
      hasEmail: !!params.basic_details.email,
      hasPhone: !!params.basic_details.phone,
      hasResumeData: !!params.resume_data
    });
    
    const response = await axios.post(`${BASE_URL}/generate-resume`, params, {
      timeout: DEFAULT_TIMEOUT * 2 // Double timeout for this operation as it might take longer
    });
    
    if (!response.data || !response.data.pdf || !response.data.pdf.download_url) {
      throw new Error('Invalid response format: missing download URL');
    }
    
    console.log(`[OPTIMIZE] Resume PDF generation successful, received download URL: ${response.data.pdf.download_url}`);
    return response.data;
  } catch (error) {
    console.error('[OPTIMIZE] Failed to generate resume PDF:', error);
    throw handleApiError(error, 'Failed to generate resume PDF');
  }
};

/**
 * Get download URL for a generated resume
 * @param filename Filename from the generate-resume response
 * @returns Full download URL
 */
export const getResumeDownloadUrl = (filename: string): string => {
  if (!filename) {
    throw new Error('Filename is required to generate download URL');
  }
  
  // Ensure the filename starts with a forward slash
  const formattedFilename = filename.startsWith('/') ? filename : `/${filename}`;
  const fullUrl = `${BASE_URL}${formattedFilename}`;
  
  console.log(`[OPTIMIZE] Generated resume download URL: ${fullUrl}`);
  return fullUrl;
};
