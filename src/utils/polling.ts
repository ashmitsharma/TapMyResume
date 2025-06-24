import { checkTaskStatus, getTaskResult } from '../services/resumeService';
import { TASK_STATUS } from '../types/index';

/**
 * Polls the task status until it's not PENDING anymore
 * @param taskId The task ID to check status for
 * @param maxAttempts Maximum number of polling attempts
 * @param interval Polling interval in milliseconds
 * @returns The final task status
 */
export const pollTaskStatus = async (
  taskId: string,
  maxAttempts = 15,
  interval = 2000
): Promise<string> => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const status = await checkTaskStatus(taskId);
      
      if (status !== TASK_STATUS.PENDING) {
        return status;
      }
      
      await new Promise((resolve) => setTimeout(resolve, interval));
      attempts++;
    } catch (error) {
      console.error('Error polling task status:', error);
      throw error;
    }
  }
  
  throw new Error('Task polling timed out');
};

/**
 * Polls the task status and returns the result when successful
 * @param taskId The task ID to check status and get result for
 * @returns The task result data
 */
export const pollTaskResult = async (
  taskId: string,
  maxAttempts = 15,
  interval = 2000
): Promise<any> => {
  const status = await pollTaskStatus(taskId, maxAttempts, interval);
  
  if (status === TASK_STATUS.SUCCESS) {
    try {
      const result = await getTaskResult(taskId);
      return result;
    } catch (error: any) {
      // console.error(`Error getting task result for task ${taskId}:`, error);
      // If error is 406 or other 4xx, we should throw a special error object
      // that includes the response data for the caller to handle
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        const clientError = new Error('Client-side document error');
        // @ts-ignore - Adding custom properties to Error
        clientError.isClientError = true;
        // @ts-ignore
        clientError.responseData = error.response.data;
        // @ts-ignore
        clientError.statusCode = error.response.status;
        throw clientError;
      }
      throw error;
    }
  } else if (status === TASK_STATUS.FAILURE) {
    console.error(`Task ${taskId} failed to complete`);
    throw new Error('Task failed to complete');
  } else {
    console.error(`Unexpected task status for task ${taskId}: ${status}`);
    throw new Error(`Unexpected task status: ${status}`);
  }
};
