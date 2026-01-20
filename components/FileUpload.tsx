
import React, { useState } from 'react';

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
  onTrySample: () => void;
  isLoading: boolean;
}

const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, onTrySample, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!isLoading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(Array.from(e.dataTransfer.files).slice(0,1));
      e.dataTransfer.clearData();
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full p-4">
      <div 
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center w-full max-w-3xl aspect-[4/3] p-10 border-2 border-dashed rounded-2xl transition-all duration-300 shadow-sm
        ${isDragging ? 'border-brand-primary bg-cyan-50/50 scale-[1.01]' : 'border-base-300 bg-surface-1 hover:border-brand-primary/50 hover:bg-surface-0'}
        ${isLoading ? 'cursor-wait' : 'cursor-default'}
        `}
      >
        {isLoading ? (
            <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                <div className="relative w-16 h-16 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-base-200"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-brand-primary border-t-transparent animate-spin"></div>
                </div>
                <p className="text-xl font-bold text-text-primary">Processing Data...</p>
                <p className="text-sm text-text-secondary mt-1">Analyzing electrochemical waveforms.</p>
            </div>
        ) : (
            <div className="flex flex-col items-center text-center text-text-secondary max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-4 bg-brand-primary/5 rounded-full mb-6">
                    <UploadIcon className="w-12 h-12 text-brand-primary" />
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-2">Visualize your CV Data</h3>
                <p className="text-lg mb-8">Drop a <code className="bg-base-200 px-1 rounded text-brand-primary">.txt</code> file here to get started, or upload from the sidebar.</p>
                
                <div className="w-full h-px bg-gradient-to-r from-transparent via-base-300 to-transparent mb-8"></div>
                
                <div className="flex flex-col space-y-3 w-full">
                    <button 
                        onClick={onTrySample}
                        className="px-6 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                        Try with Sample Data
                    </button>
                    <p className="text-xs">Quickly see the plotter in action with a duck-shaped CV curve.</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(FileUpload);
