import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1);
  };
  return (
    <button
      onClick={handleBack}
      className="fixed top-4 left-4 z-50 p-2 bg-surface/80 backdrop-blur-md rounded-full shadow-md hover:bg-surface/90 transition-colors"
      aria-label="Back"
    >
      <ArrowLeft className="w-5 h-5 text-primary" />
    </button>
  );
}
