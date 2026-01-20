
import React, { useState } from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (feedback: string) => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSend }) => {
  const [feedback, setFeedback] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSend = () => {
    if (feedback.trim()) {
      onSend(feedback);
      setFeedback('');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
        onClose();
    }
  }

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 transition-opacity"
        onClick={handleBackdropClick}
    >
      <div 
        className="bg-surface-0 rounded-lg shadow-xl p-6 w-full max-w-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
      >
        <h2 id="feedback-title" className="text-xl font-bold text-text-primary mb-4">Provide Feedback</h2>
        <p className="text-sm text-text-secondary mb-4">
            We'd love to hear your thoughts! Your feedback will be prepared to send using your default email client.
        </p>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Enter your comments, suggestions, or bug reports here..."
          className="w-full h-40 p-2 border border-surface-2 rounded-md bg-surface-1 focus:ring-brand-primary focus:border-brand-primary text-text-primary"
          aria-label="Feedback input"
        />
        <div className="flex justify-end space-x-3 mt-4">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-md bg-base-200 text-text-primary hover:bg-base-300 transition-colors"
            aria-label="Cancel feedback"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!feedback.trim()}
            className="px-4 py-2 rounded-md bg-brand-primary text-white hover:bg-brand-secondary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            aria-label="Send feedback"
          >
            Send Feedback
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(FeedbackModal);