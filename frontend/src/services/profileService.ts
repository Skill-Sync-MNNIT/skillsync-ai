import api from './api';

export interface StudentProfileData {
  userId: string;
  name?: string;
  email: string;
  role: string;
  branch: string;
  year: number;
  skills: string[];
  embeddingStatus?: 'pending' | 'processing' | 'indexed' | 'failed';
  resumeStorageKey?: string;
}

export const profileService = {
  /**
   * Fetch a user's profile by ID.
   */
  fetchProfile: async (userId: string): Promise<StudentProfileData> => {
    const response = await api.get(`/profile/${userId}`);
    return response.data;
  },

  /**
   * Update the current user's profile details.
   */
  updateProfile: async (data: { branch: string; year: number; skills: string[] }) => {
    const response = await api.put('/profile', data);
    return response.data;
  },

  /**
   * Upload a PDF resume.
   */
  uploadResume: async (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    const response = await api.post('/profile/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Get the Cloudinary temporary signed URL to download a resume.
   */
  getResumeUrl: async (userId: string): Promise<string> => {
    const response = await api.get(`/profile/resume/${userId}`);
    return response.data.signedUrl;
  },

  /**
   * Delete the current user's profile.
   */
  deleteProfile: async () => {
    const response = await api.delete('/profile');
    return response.data;
  },
};
