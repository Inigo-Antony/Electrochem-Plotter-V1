
import React, { useState, useRef } from 'react';

interface SidebarProps {
    onUploadSingle: () => void;
    onUploadMultiple: () => void;
    onOverlay: () => void;
    onDownloadCurrent: () => void;
    onDownloadAll: () => void;
    onReset: () => void;
    onToggleProperties: () => void;
    onFeedback: () => void;
    isLoading: boolean;
    hasChart: boolean;
    hasMultipleTabs: boolean;
}

const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const OverlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <rect x="7" y="7" width="10" height="10" rx="2" ry="2" fill="currentColor" fillOpacity="0.3" />
        <line x1="12" y1="7" x2="12" y2="17" />
        <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
);

const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ResetIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3 2v6h6" />
        <path d="M21 12A9 9 0 0 0 6 5.3L3 8" />
        <path d="M21 22v-6h-6" />
        <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" />
    </svg>
);

const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const FeedbackIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);

const SidebarButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { tooltip: string; icon: React.ReactNode }> = ({ children, tooltip, icon, ...props }) => (
    <div className="group relative flex items-center justify-center">
        <button {...props} className="p-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-surface-0 text-text-primary hover:bg-base-200 hover:text-brand-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-surface-1 shadow-sm border border-surface-2 w-14 h-14 flex items-center justify-center">
            {icon}
        </button>
        <div className="absolute left-full ml-3 px-3 py-2 bg-text-primary text-white text-sm font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-30">
            {tooltip}
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-text-primary rotate-45"></div>
        </div>
    </div>
);

const PopOutMenuButton: React.FC<{ onClick: () => void, disabled?: boolean, children: React.ReactNode }> = ({ onClick, disabled, children }) => (
    <button onClick={onClick} disabled={disabled} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-base-200 disabled:opacity-50 disabled:text-text-secondary rounded-md">
        {children}
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ onUploadSingle, onUploadMultiple, onOverlay, onDownloadCurrent, onDownloadAll, onReset, onToggleProperties, onFeedback, isLoading, hasChart, hasMultipleTabs }) => {
    const [isUploadMenuOpen, setUploadMenuOpen] = useState(false);
    const [isDownloadMenuOpen, setDownloadMenuOpen] = useState(false);
    const uploadTimerRef = useRef<number | null>(null);
    const downloadTimerRef = useRef<number | null>(null);

    const handleMenuEnter = (setter: React.Dispatch<React.SetStateAction<boolean>>, timerRef: React.MutableRefObject<number | null>) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setter(true);
    };

    const handleMenuLeave = (setter: React.Dispatch<React.SetStateAction<boolean>>, timerRef: React.MutableRefObject<number | null>) => {
        timerRef.current = window.setTimeout(() => {
            setter(false);
        }, 200);
    };

    return (
        <aside className="w-24 bg-surface-1 p-4 flex flex-col items-center space-y-4 shadow-lg z-20 border-r border-surface-2">
            <div className="flex flex-col space-y-4">
                <div 
                    className="relative" 
                    onMouseEnter={() => handleMenuEnter(setUploadMenuOpen, uploadTimerRef)} 
                    onMouseLeave={() => handleMenuLeave(setUploadMenuOpen, uploadTimerRef)}
                >
                    <SidebarButton tooltip="Upload" icon={<UploadIcon />} onClick={onUploadSingle} disabled={isLoading} />
                    {isUploadMenuOpen && (
                        <div className="absolute left-full top-0 ml-3 w-48 bg-surface-0 rounded-md shadow-lg border border-surface-2 p-1 z-30">
                            <PopOutMenuButton onClick={onUploadSingle} disabled={isLoading}>Upload Single File</PopOutMenuButton>
                            <PopOutMenuButton onClick={onUploadMultiple} disabled={isLoading}>Upload Multiple Files</PopOutMenuButton>
                        </div>
                    )}
                </div>
                <SidebarButton onClick={onOverlay} disabled={isLoading || !hasChart} icon={<OverlayIcon />} tooltip="Overlay File" />
                <SidebarButton onClick={onToggleProperties} disabled={isLoading || !hasChart} icon={<SettingsIcon />} tooltip="Graph Properties" />

                <div 
                    className="relative" 
                    onMouseEnter={() => handleMenuEnter(setDownloadMenuOpen, downloadTimerRef)}
                    onMouseLeave={() => handleMenuLeave(setDownloadMenuOpen, downloadTimerRef)}
                >
                    <SidebarButton tooltip="Download" icon={<DownloadIcon />} onClick={onDownloadCurrent} disabled={isLoading || !hasChart} />
                    {isDownloadMenuOpen && (
                        <div className="absolute left-full top-0 ml-3 w-48 bg-surface-0 rounded-md shadow-lg border border-surface-2 p-1 z-30">
                            <PopOutMenuButton onClick={onDownloadCurrent} disabled={isLoading || !hasChart}>Download Current PNG</PopOutMenuButton>
                            <PopOutMenuButton onClick={onDownloadAll} disabled={isLoading || !hasChart || !hasMultipleTabs}>Download All PNGs</PopOutMenuButton>
                        </div>
                    )}
                </div>

                <SidebarButton onClick={onReset} disabled={isLoading || !hasChart} icon={<ResetIcon />} tooltip="Clear All" />
                <SidebarButton onClick={onFeedback} icon={<FeedbackIcon />} tooltip="Provide Feedback" />
            </div>
            {isLoading && (
                <div className="flex justify-center pt-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
                </div>
            )}
        </aside>
    );
};

export default React.memo(Sidebar);