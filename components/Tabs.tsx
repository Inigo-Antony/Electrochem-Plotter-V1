import React, { useRef, useEffect } from 'react';
import type { TabState } from '../types';

interface TabsProps {
  tabs: TabState[];
  activeTabId: string;
  onTabClick: (id: string) => void;
  onAddTab: () => void;
  onCloseTab: (id: string) => void;
  onTabNameChange: (id: string, newName: string) => void;
  onSetEditing: (id: string, isEditing: boolean) => void;
}

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);


const Tabs: React.FC<TabsProps> = ({ tabs, activeTabId, onTabClick, onAddTab, onCloseTab, onTabNameChange, onSetEditing }) => {
  const activeTab = tabs.find(t => t.id === activeTabId);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab?.isEditingTabName && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, [activeTab?.isEditingTabName]);

  const handleNameChangeCommit = (e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => {
    const newName = e.currentTarget.value.trim();
    if (activeTabId && newName) {
      onTabNameChange(activeTabId, newName);
    } else {
      onSetEditing(activeTabId, false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameChangeCommit(e);
    } else if (e.key === 'Escape') {
      onSetEditing(activeTabId, false);
    }
  };

  return (
    <div className="bg-base-100 border-t border-surface-2">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2">
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => onTabClick(tab.id)}
              onDoubleClick={() => onSetEditing(tab.id, true)}
              className={`flex items-center space-x-2 pl-4 pr-2 py-2 border-b-2 text-sm font-medium cursor-pointer transition-colors ${
                tab.id === activeTabId
                  ? 'border-brand-primary text-brand-primary bg-base-200'
                  : 'border-transparent text-text-secondary hover:bg-base-200 hover:text-text-primary'
              }`}
            >
              {tab.isEditingTabName && tab.id === activeTabId ? (
                <input
                    ref={inputRef}
                    type="text"
                    defaultValue={tab.name}
                    onBlur={handleNameChangeCommit}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent outline-none ring-1 ring-brand-primary rounded-sm px-1"
                />
              ) : (
                <span className="truncate max-w-xs">{tab.name}</span>
              )}
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="p-1 rounded-full hover:bg-red-200 hover:text-red-700"
                  aria-label={`Close tab ${tab.name}`}
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          ))}
          {tabs.length < 10 && (
            <button
                onClick={onAddTab}
                className="p-2 rounded-md text-text-secondary hover:bg-base-200 hover:text-brand-primary"
                aria-label="Add new tab"
                title="Add new tab"
            >
                <PlusIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Tabs);