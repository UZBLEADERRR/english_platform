import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const parseWord = (str: string) => {
  if (!str) return { mainWord: '', translation: '', example: '', example_translation: '' };
  const parts = str.split('||');
  return {
    mainWord: parts[0] || str,
    translation: parts[1] || '',
    example: parts[2] || '',
    example_translation: parts[3] || '',
  };
};
