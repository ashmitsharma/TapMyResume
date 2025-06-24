import axios from 'axios';

const BASE_URL = 'https://core.tapmytalent.com/resumeBuilder-Dev';

// Interface for Education
export interface Education {
  institution: string;
  location: string;
  degree: string;
  startDate: string;
  endDate: string;
}

// Interface for Certification
export interface Certification {
  Title: string;
  Desc: string;
}

// Interface for Master Data response
export interface MasterDataResponse {
  work_experiences: Array<{
    job_title: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

// Interface for User Details response
export interface UserDetailsResponse {
  name: string;
  email: string;
  phone: string;
  [key: string]: any;
}

// Interface for Education & Certification data
export interface EducationCertificationData {
  Education: Education[];
  Certifications: Certification[];
}

/**
 * Get the user's master data
 * @param email User's email
 * @returns User master data or throws error if user not found
 */
export const getMasterData = async (email: string): Promise<MasterDataResponse> => {
  try {
    const response = await axios.get(`${BASE_URL}/userDetails/Master-data?email=${encodeURIComponent(email)}`, {
      headers: {
        accept: 'application/json',
      },
    });
    
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      throw new Error('User not found');
    }
    throw error;
  }
};

/**
 * Get user details by email
 * @param email User's email
 * @returns User details or throws error if user not found
 */
export const getDetails = async (email: string): Promise<UserDetailsResponse> => {
  try {
    const response = await axios.get(`${BASE_URL}/userDetails/details?email=${encodeURIComponent(email)}`, {
      headers: {
        accept: 'application/json',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user details:', error);
    throw error;
  }
};

/**
 * Update user's education and certification data
 * @param email User's email
 * @param data Education and certification data
 * @returns Success status
 */
export const putMasterEdu = async (email: string, data: EducationCertificationData): Promise<boolean> => {
  try {
    const response = await axios.put(`${BASE_URL}/userDetails/Master-Edu?email=${encodeURIComponent(email)}`, data, {
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Failed to update education and certification data:', error);
    throw error;
  }
};

/**
 * Update user's master data including work experiences
 * @param email User's email
 * @param data Work experiences data
 * @returns Success status object
 */
export const putMasterData = async (email: string, data: any): Promise<{ status: boolean }> => {
  try {
    const response = await axios.put(`${BASE_URL}/userDetails/Master-data?email=${encodeURIComponent(email)}`, data, {
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to update master data:', error);
    throw error;
  }
};
