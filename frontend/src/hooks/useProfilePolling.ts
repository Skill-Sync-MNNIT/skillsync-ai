import { useRef } from 'react';
import { profileService } from '../services/profileService';

/**
 * Manages the polling loop that checks the AI embedding status of a user's resume.
 * Polling stops automatically when the status reaches 'indexed' or 'failed'.
 */
export const useProfilePolling = (
  onData: (data: any) => void,
  onStop?: () => void
) => {
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPoll = (userId: string) => {
    if (pollRef.current) return; // already polling
    pollRef.current = setInterval(async () => {
      try {
        const data = await profileService.fetchProfile(userId);
        onData(data);
        if (data.embeddingStatus === 'indexed' || data.embeddingStatus === 'failed') {
          stopPoll();
          onStop?.();
        }
      } catch { /* silent — network hiccup during poll */ }
    }, 4000);
  };

  const stopPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  return { startPoll, stopPoll };
};
