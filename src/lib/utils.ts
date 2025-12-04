import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { User } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Compresses an image from a data URI.
 * @param dataUri The data URI of the image to compress.
 * @param quality The quality of the output image, from 0 to 1.
 * @param maxWidth The maximum width of the output image.
 * @param maxHeight The maximum height of the output image.
 * @returns A promise that resolves with the compressed image data URI.
 */
export function compressImage(dataUri: string, quality = 0.8, maxWidth = 1024, maxHeight = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        return reject(new Error('Failed to get canvas context'));
      }

      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = (error) => {
      console.error("Image loading error for compression:", error);
      // If loading fails, just return the original uri to not break the flow
      resolve(dataUri);
    };
    img.src = dataUri;
  });
}


/**
 * Calculates a compatibility score and finds commonalities between two users.
 * This is a simple, non-AI based implementation for fast results.
 */
export function calculateCompatibility(user1: User, user2: User): { score: number; commonalities: string[] } {
  let score = 0;
  const commonalities: string[] = [];

  // Define weights for different categories
  const weights = {
    hobbies: 15,
    interests: 15,
    values: 10,
    communication: 5,
    lifestyle: 5,
  };

  const findCommon = (arr1: string[] = [], arr2: string[] = []) => {
    const set1 = new Set(arr1);
    return arr2.filter(item => set1.has(item));
  };
  
  const commonHobbies = findCommon(user1.hobbies, user2.hobbies);
  score += commonHobbies.length * weights.hobbies;
  commonalities.push(...commonHobbies);

  const commonInterests = findCommon(user1.interests, user2.interests);
  score += commonInterests.length * weights.interests;
  commonalities.push(...commonInterests);
  
  const commonValues = findCommon(user1.values, user2.values);
  score += commonValues.length * weights.values;
  
  const commonCommunication = findCommon(user1.communication, user2.communication);
  score += commonCommunication.length * weights.communication;

  const commonLifestyle = findCommon(user1.lifestyle, user2.lifestyle);
  score += commonLifestyle.length * weights.lifestyle;

  // Normalize score to be out of 100
  // This is a simplistic normalization. A more complex one might be needed.
  const finalScore = Math.min(100, Math.floor(score));

  return {
    score: finalScore,
    commonalities: [...new Set(commonalities)], // Return unique commonalities
  };
}

/**
 * Formats the last seen date into a relative time string.
 */
export function formatLastSeen(lastSeen?: 'Online' | string): string {
    if (!lastSeen) {
        return '오래 전';
    }
    if (lastSeen === 'Online') {
        return '온라인';
    }

    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInSeconds = (now.getTime() - lastSeenDate.getTime()) / 1000;

    if (diffInSeconds < 60) {
        return '방금 전';
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes}분 전`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours}시간 전`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays}일 전`;
    }
    
    return lastSeenDate.toLocaleDateString('ko-KR');
}
