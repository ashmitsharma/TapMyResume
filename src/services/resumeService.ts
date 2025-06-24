import { checkStatus, getResult } from './resumeOptimizerService';

/**
 * Check the status of a task
 * @param taskId The task ID to check status for
 * @returns Status string ("PENDING", "SUCCESS", "FAILURE")
 */
export const checkTaskStatus = async (taskId: string): Promise<string> => {
  try {
    const status = await checkStatus(taskId);
    // Convert to standard task status format
    return status === 'SUCCESS' ? 'SUCCESS' : 
           status === 'FAILURE' ? 'FAILURE' : 
           'PENDING';
  } catch (error) {
    console.error('Error checking task status:', error);
    throw error;
  }
};

/**
 * Get the result data for a completed task
 * @param taskId The task ID to get result for
 * @returns Result data object
 */
export const getTaskResult = async <T>(taskId: string): Promise<T> => {
  try {
    return await getResult<T>(taskId);
  } catch (error) {
    console.error('Error getting task result:', error);
    throw error;
  }
};
