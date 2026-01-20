
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { DataSet, AxisConfig, AxisDomain, AxisStyle } from '../types';

const COLOR_PALETTE = [
  '#0891b2', '#ef4444', '#f97316', '#22c55e', '#84cc16', '#eab308', '#f43f5e',
  '#06b6d4', '#a855f7', '#f59e0b', '#10b981', '#6366f1', '#000000', '#ffffff'
];

const PencilIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

interface LegendSidebarProps {
  datasets: DataSet[];
  onColorChange: (datasetName: string, newColor: string) => void;
  onDeleteDataset: (datasetName: string) => void;
  onToggleVisibility: (datasetName: string) => void;
  onRenameDataset: (oldName: string, newName: string) => void;
  onDatasetStyleChange: (datasetName: string, styleChanges: Partial<DataSet>) => void;
  axisConfig: AxisConfig;
  onAxisConfigChange: (newConfig: AxisConfig) => void;
  width: number;
  onWidthChange: (newWidth: number) => void;
}

const StyleToggleButton: React.FC<{
  isPressed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ isPressed, onToggle, children, className = '' }) => {
  return (
    <button
      onClick={onToggle}
      aria-pressed={isPressed}
      className={`w-12 h-10 flex items-center justify-center rounded-md border text-base transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-surface-1 ${
        isPressed
          ? 'bg-brand-primary text-white border-brand-secondary'
          : 'bg-surface-0 text-text-primary border-surface-2 hover:bg-base-200'
      } ${className}`}
    >
      {children}
    </button>
  );
};

const ColorPickerPopup: React.FC<{
  color: string;
  onChange: (newColor: string) => void;
  label: string;
}> = ({ color, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [pickerRef]);
  
  return (
    <div className="relative h-10" ref={pickerRef}>
      <button
        type="button"
        className="w-full h-10 rounded-md border border-surface-2 flex items-center justify-between px-2 bg-surface-0"
        onClick={() => setIsOpen(p => !p)}
        aria-label={label}
      >
        <span className={`w-6 h-6 rounded border ${color.toLowerCase() === '#ffffff' ? 'border-slate-300' : 'border-surface-2'}`} style={{ backgroundColor: color }}></span>
        <span className="text-xs text-text-secondary uppercase">{color}</span>
      </button>
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-surface-0 p-2 rounded-lg shadow-2xl z-50 grid grid-cols-7 gap-1 w-max border border-surface-2">
            {COLOR_PALETTE.map(c => (
                <button
                    key={c}
                    type="button"
                    onClick={() => {
                        onChange(c);
                        setIsOpen(false);
                    }}
                    className={`w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-surface-0 ${c.toLowerCase() === '#ffffff' ? 'border border-slate-300' : ''}`}
                    style={{ backgroundColor: c }}
                    aria-label={`Select color ${c}`}
                />
            ))}
        </div>
      )}
    </div>
  );
};

const getNextNiceStep = (currentStep: number, direction: 'up' | 'down'): number => {
    if (currentStep <= 0) return 0.1;

    const niceSteps = [1, 2, 2.5, 4, 5, 10];
    const power = Math.floor(Math.log10(currentStep));
    const magnitude = 10 ** power;
    const normalizedStep = currentStep / magnitude;

    let nextNormalizedStep;
    if (direction === 'up') {
        nextNormalizedStep = niceSteps.find(s => s > normalizedStep + 1e-9) ?? niceSteps[0] * 10;
    } else {
        nextNormalizedStep = [...niceSteps].reverse().find(s => s < normalizedStep - 1e-9) ?? niceSteps[niceSteps.length-1] / 10;
    }
    
    let newMagnitude = magnitude;
    if (nextNormalizedStep >= 10) {
        newMagnitude *= 10;
        nextNormalizedStep /= 10;
    }
    if (nextNormalizedStep < 1) {
        newMagnitude /= 10;
        nextNormalizedStep *= 10;
    }
    
    return Number((nextNormalizedStep * newMagnitude).toPrecision(15));
};

const StepperInput: React.FC<{
  value: number | undefined;
  onChange: (newValue: number | undefined) => void;
  label: string;
}> = ({ value, onChange, label }) => {
    const handleStep = (direction: 'up' | 'down') => {
        const nextStep = getNextNiceStep(value || 1, direction);
        onChange(nextStep);
    };

    return (
        <div className="relative">
            <input
                type="number"
                min="0"
                step="any"
                placeholder="Auto"
                value={value?.toString() ?? ''}
                onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full p-2 h-10 border border-surface-2 rounded-md bg-surface-0 text-text-primary pr-8"
                aria-label={label}
            />
            <div className="absolute right-0 top-0 h-10 flex flex-col items-center justify-center">
                <button onClick={() => handleStep('up')} className="h-5 px-1 text-text-secondary hover:text-text-primary" aria-label="Increase step">▲</button>
                <button onClick={() => handleStep('down')} className="h-5 px-1 text-text-secondary hover:text-text-primary" aria-label="Decrease step">▼</button>
            </div>
        </div>
    );
}

const LegendSidebar: React.FC<LegendSidebarProps> = ({ datasets, onColorChange, onDeleteDataset, onToggleVisibility, onRenameDataset, onDatasetStyleChange, axisConfig, onAxisConfigChange, width, onWidthChange }) => {
  const [pickerVisibleFor, setPickerVisibleFor] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing || !sidebarRef.current) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth >= 280 && newWidth <= 600) { // Min and max width
        onWidthChange(newWidth);
    }
  }, [isResizing, onWidthChange]);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleResize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', stopResizing);
    };
  }, [handleResize, stopResizing]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setPickerVisibleFor(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (editingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingName]);

  const handleRenameCommit = () => {
    if (editingName && draftName.trim()) {
      onRenameDataset(editingName, draftName.trim());
    }
    setEditingName(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleRenameCommit();
    } else if (event.key === 'Escape') {
      setEditingName(null);
    }
  };

  const handleStartEditing = (ds: DataSet) => {
    setEditingName(ds.name);
    setDraftName(ds.name);
  };


  if (datasets.length === 0) {
    return null;
  }
  
  const handleConfigChange = <K extends keyof AxisConfig>(key: K, value: AxisConfig[K]) => {
    onAxisConfigChange({...axisConfig, [key]: value});
  };
  
  const handleDomainChange = (axis: 'x' | 'y', index: 0 | 1, value: string) => {
    const key = axis === 'x' ? 'xDomain' : 'yDomain';
    const newDomain = [...axisConfig[key]] as AxisDomain;
    
    if (value.trim() === '') {
        newDomain[index] = 'auto';
    } else {
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue)) {
            newDomain[index] = numericValue;
        }
    }

    const newConfig: Partial<AxisConfig> = { [key]: newDomain };
    if(axis === 'x') {
      newConfig.xTickValues = undefined;
    } else {
      newConfig.yTickValues = undefined;
    }
    onAxisConfigChange({...axisConfig, ...newConfig});
  };
  
  const formatDomainValue = (value: number | 'auto'): string => {
    if (value === 'auto' || typeof value !== 'number') return '';
    return value.toFixed(2);
  };

  const getYStep = () => {
    switch (axisConfig.unit) {
        case 'A': return 0.00001;
        case 'mA': return 0.01;
        case 'µA': return 1;
        default: return 0.01;
    }
  };
  
  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value as AxisConfig['unit'];
    const oldUnit = axisConfig.unit;
    if (newUnit === oldUnit) return;
    
    const getMultiplier = (unit: AxisConfig['unit']) => ({'A': 1, 'mA': 1e3, 'µA': 1e6}[unit]);
    const conversionFactor = getMultiplier(newUnit)! / getMultiplier(oldUnit)!;
    const newYDomain = axisConfig.yDomain.map(v => typeof v === 'number' ? v * conversionFactor : v) as AxisDomain;
    
    const oldUnitDisplay = `(${oldUnit})`;
    const newUnitDisplay = `(${newUnit})`;
    let newYAxisLabelText = axisConfig.yAxis.label.text;
    if(newYAxisLabelText.includes(oldUnitDisplay)) {
        newYAxisLabelText = newYAxisLabelText.replace(oldUnitDisplay, newUnitDisplay);
    }

    onAxisConfigChange({
        ...axisConfig, 
        unit: newUnit, 
        yDomain: newYDomain,
        yTickValues: undefined, // Recalculate ticks on unit change
        yAxis: {
            ...axisConfig.yAxis,
            label: {
                ...axisConfig.yAxis.label,
                text: newYAxisLabelText,
            }
        }
    });
  };

  const AxisStyleEditor: React.FC<{
    axis: 'xAxis' | 'yAxis';
    config: AxisStyle;
    onChange: (newAxisConfig: AxisStyle) => void;
  }> = ({ axis, config, onChange }) => {
    
    const handleStyleChange = <K extends keyof AxisStyle>(key: K, value: AxisStyle[K]) => {
      onChange({ ...config, [key]: value });
    };

    const handleLabelChange = <K extends keyof AxisStyle['label']>(key: K, value: AxisStyle['label'][K]) => {
      handleStyleChange('label', { ...config.label, [key]: value });
    };
    
    const handleTicksChange = <K extends keyof AxisStyle['ticks']>(key: K, value: AxisStyle['ticks'][K]) => {
      handleStyleChange('ticks', { ...config.ticks, [key]: value });
    };

    const onStepSizeChange = (newStepSize: number | undefined) => {
        // Also clear the auto-generated ticks when user provides a manual step
        if (axis === 'xAxis') {
            onAxisConfigChange({ ...axisConfig, xAxis: { ...config, stepSize: newStepSize }, xTickValues: undefined });
        } else {
            onAxisConfigChange({ ...axisConfig, yAxis: { ...config, stepSize: newStepSize }, yTickValues: undefined });
        }
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Axis Line</label>
          <div className="grid grid-cols-2 gap-2">
             <ColorPickerPopup color={config.color} onChange={(c) => handleStyleChange('color', c)} label="Axis line color" />
            <input type="number" min="0" max="10" step="0.5" value={config.width} onChange={(e) => handleStyleChange('width', parseFloat(e.target.value))} className="w-full h-10 p-2 border border-surface-2 rounded-md bg-surface-0 text-text-primary" aria-label="Axis line width"/>
          </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Axis Title</label>
            <input type="text" value={config.label.text} onChange={(e) => handleLabelChange('text', e.target.value)} className="w-full p-2 border border-surface-2 rounded-md bg-surface-0 text-text-primary" />
        </div>
        <div className="grid grid-cols-2 gap-2">
            <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Font Size</label>
                <input type="number" min="8" max="24" value={config.label.fontSize} onChange={(e) => handleLabelChange('fontSize', parseInt(e.target.value))} className="w-full h-10 p-2 border border-surface-2 rounded-md bg-surface-0 text-text-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Title Color</label>
              <ColorPickerPopup color={config.label.color} onChange={(c) => handleLabelChange('color', c)} label="Axis title color" />
            </div>
        </div>
         <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Offset</label>
            <input type="number" value={config.label.offset} onChange={(e) => handleLabelChange('offset', parseInt(e.target.value))} className="w-full p-2 border border-surface-2 rounded-md bg-surface-0 text-text-primary" />
          </div>
          <div className="flex items-end space-x-2">
             <StyleToggleButton
                isPressed={config.label.bold}
                onToggle={() => handleLabelChange('bold', !config.label.bold)}
              >
                <b className="font-bold">B</b>
              </StyleToggleButton>
              <StyleToggleButton
                isPressed={config.label.italic}
                onToggle={() => handleLabelChange('italic', !config.label.italic)}
              >
                <i className="italic">I</i>
              </StyleToggleButton>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Tick Labels</label>
          <div className="grid grid-cols-2 gap-2">
            <ColorPickerPopup color={config.ticks.color} onChange={(c) => handleTicksChange('color', c)} label="Tick label color"/>
            <input type="number" min="8" max="16" value={config.ticks.fontSize} onChange={(e) => handleTicksChange('fontSize', parseInt(e.target.value))} className="w-full h-10 p-2 border border-surface-2 rounded-md bg-surface-0 text-text-primary" aria-label="Tick label font size" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
            <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Tick Step</label>
                <StepperInput
                    value={config.stepSize}
                    onChange={onStepSizeChange}
                    label="Axis tick step size"
                />
            </div>
             <div className="flex items-end space-x-2">
                 <StyleToggleButton
                    isPressed={config.ticks.bold}
                    onToggle={() => handleTicksChange('bold', !config.ticks.bold)}
                  >
                    <b className="font-bold">B</b>
                  </StyleToggleButton>
                  <StyleToggleButton
                    isPressed={config.ticks.italic}
                    onToggle={() => handleTicksChange('italic', !config.ticks.italic)}
                  >
                    <i className="italic">I</i>
                  </StyleToggleButton>
              </div>
        </div>
      </div>
    );
  };


  return (
    <aside 
      ref={sidebarRef}
      className="bg-surface-1 flex-shrink-0 flex flex-col shadow-lg z-10 border-l border-surface-2 relative"
      style={{ width: `${width}px` }}
    >
      <div 
        className="absolute top-0 left-0 w-2 h-full cursor-col-resize z-30"
        onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
      >
        <div className="w-0.5 h-full bg-transparent hover:bg-brand-primary/50 transition-colors mx-auto"></div>
      </div>
      
      <div className="p-4 flex-grow overflow-y-auto">
        <h3 className="text-lg font-bold text-text-primary px-2 mb-2">Legend</h3>
        <ul className="space-y-1 mb-6">
            {datasets.map((ds) => (
                <li key={ds.name} className={`group flex items-center justify-between space-x-3 p-2 rounded-md hover:bg-base-200 transition-all duration-200 ${!ds.visible ? 'opacity-50' : ''}`}>
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="relative">
                          <button 
                              className="w-4 h-4 rounded-sm flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-surface-1" 
                              style={{ backgroundColor: ds.color, opacity: ds.opacity }}
                              onClick={() => setPickerVisibleFor(pickerVisibleFor === ds.name ? null : ds.name)}
                              aria-label={`Change color for ${ds.name}`}
                          ></button>
                          {pickerVisibleFor === ds.name && (
                            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-surface-0 p-2 rounded-lg shadow-2xl z-50 grid grid-cols-7 gap-2 w-max border border-surface-2">
                               {COLOR_PALETTE.map(color => (
                                <button
                                    key={color}
                                    onClick={() => {
                                        onColorChange(ds.name, color);
                                        setPickerVisibleFor(null);
                                    }}
                                    className={`w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-surface-0 ${color.toLowerCase() === '#ffffff' ? 'border border-slate-300' : ''}`}
                                    style={{ backgroundColor: color }}
                                    aria-label={`Select color ${color}`}
                                />
                            ))}
                            </div>
                          )}
                        </div>
                        {editingName === ds.name ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={draftName}
                                onChange={(e) => setDraftName(e.target.value)}
                                onBlur={handleRenameCommit}
                                onKeyDown={handleKeyDown}
                                className="text-sm text-text-primary font-medium bg-base-200 border border-brand-primary rounded px-1 py-0.5 w-full focus:outline-none"
                                aria-label={`Editing name for ${ds.name}`}
                            />
                        ) : (
                            <span className="text-sm text-text-secondary truncate font-medium flex-1" title={ds.name} onDoubleClick={() => handleStartEditing(ds)}>
                                {ds.name}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                          onClick={() => handleStartEditing(ds)}
                          className="p-1 rounded-md text-text-secondary hover:bg-base-300 hover:text-text-primary"
                          aria-label={`Rename ${ds.name}`}
                      >
                          <PencilIcon />
                      </button>
                      <button 
                          onClick={() => onToggleVisibility(ds.name)}
                          className="p-1 rounded-md text-text-secondary hover:bg-base-300 hover:text-text-primary"
                          aria-label={ds.visible ? 'Hide dataset' : 'Show dataset'}
                      >
                          {ds.visible ? <EyeIcon /> : <EyeOffIcon />}
                      </button>
                      <button
                          onClick={() => onDeleteDataset(ds.name)}
                          className="p-1 rounded-md text-text-secondary hover:bg-red-100 hover:text-red-600"
                          aria-label="Delete dataset"
                      >
                          <TrashIcon />
                      </button>
                    </div>
                </li>
            ))}
        </ul>
        
        <h3 className="text-lg font-bold text-text-primary px-2 mb-4 pt-4 border-t border-surface-2">Graph Properties</h3>
        <div className="space-y-6 px-2">
           <details open className="space-y-4">
              <summary className="font-bold text-text-primary cursor-pointer">General</summary>
              <div className="pl-2 pt-2 space-y-4">
                <div>
                  <label htmlFor="y-axis-unit" className="block text-sm font-medium text-text-primary mb-1">Current Unit</label>
                  <select id="y-axis-unit" value={axisConfig.unit} onChange={handleUnitChange} className="w-full p-2 border border-surface-2 rounded-md bg-surface-0 text-text-primary focus:ring-brand-primary focus:border-brand-primary">
                      <option value="A">Amperes (A)</option>
                      <option value="mA">Milliamps (mA)</option>
                      <option value="µA">Microamps (µA)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="y-axis-precision" className="block text-sm font-medium text-text-primary mb-1">Precision</label>
                  <input type="number" id="y-axis-precision" value={axisConfig.precision} onChange={(e) => handleConfigChange('precision', parseInt(e.target.value))} min="0" max="7" className="w-full p-2 border border-surface-2 rounded-md bg-surface-0 text-text-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">X-Axis Range (V)</label>
                  <div className="grid grid-cols-2 gap-2">
                      <input type="number" step="0.01" placeholder="Min" value={formatDomainValue(axisConfig.xDomain[0])} onChange={(e) => handleDomainChange('x', 0, e.target.value)} className="w-full p-2 border border-surface-2 rounded-md bg-surface-0 text-text-primary" aria-label="X-axis minimum"/>
                      <input type="number" step="0.01" placeholder="Max" value={formatDomainValue(axisConfig.xDomain[1])} onChange={(e) => handleDomainChange('x', 1, e.target.value)} className="w-full p-2 border border-surface-2 rounded-md bg-surface-0 text-text-primary" aria-label="X-axis maximum"/>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Y-Axis Range ({axisConfig.unit})</label>
                  <div className="grid grid-cols-2 gap-2">
                      <input type="number" step={getYStep()} placeholder="Min" value={formatDomainValue(axisConfig.yDomain[0])} onChange={(e) => handleDomainChange('y', 0, e.target.value)} className="w-full p-2 border border-surface-2 rounded-md bg-surface-0 text-text-primary" aria-label="Y-axis minimum"/>
                      <input type="number" step={getYStep()} placeholder="Max" value={formatDomainValue(axisConfig.yDomain[1])} onChange={(e) => handleDomainChange('y', 1, e.target.value)} className="w-full p-2 border border-surface-2 rounded-md bg-surface-0 text-text-primary" aria-label="Y-axis maximum"/>
                  </div>
                </div>
              </div>
           </details>
           <details className="space-y-4" open>
              <summary className="font-bold text-text-primary cursor-pointer">Plot Styles</summary>
              <div className="pl-2 pt-2 space-y-4">
                {datasets.map(ds => {
                   const plotStyle = ds.plotStyle ?? 'line';
                   const showLineControls = plotStyle === 'line' || plotStyle === 'line-scatter';
                   const showPointControls = plotStyle === 'scatter' || plotStyle === 'line-scatter';
                  
                   return (
                     <div key={ds.name} className="p-3 rounded-md border border-surface-2 bg-surface-0">
                       <p className="text-sm font-bold text-text-primary truncate mb-3" title={ds.name}>{ds.name}</p>
                       <div className="space-y-3">
                         <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">Style</label>
                            <select 
                              value={plotStyle} 
                              onChange={(e) => onDatasetStyleChange(ds.name, { plotStyle: e.target.value as DataSet['plotStyle']})}
                              className="w-full p-2 h-10 border border-surface-2 rounded-md bg-surface-0 text-text-primary focus:ring-brand-primary focus:border-brand-primary"
                            >
                              <option value="line">Line Only</option>
                              <option value="scatter">Scatter Only</option>
                              <option value="line-scatter">Line & Scatter</option>
                            </select>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                            <div>
                               <label className="block text-xs font-medium text-text-secondary mb-1">Color</label>
                               <ColorPickerPopup color={ds.color} onChange={(c) => onColorChange(ds.name, c)} label={`Plot color for ${ds.name}`} />
                            </div>
                            <div>
                                <label htmlFor={`opacity-${ds.name}`} className="block text-xs font-medium text-text-secondary mb-1">Opacity</label>
                                <input
                                  id={`opacity-${ds.name}`}
                                  type="range" min="0" max="1" step="0.05"
                                  value={ds.opacity ?? 1}
                                  onChange={(e) => onDatasetStyleChange(ds.name, { opacity: parseFloat(e.target.value) })}
                                  className="w-full h-10 p-0 bg-surface-0 accent-brand-primary"
                                />
                            </div>
                         </div>
                         {showLineControls && (
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1">Line Width</label>
                                <input 
                                  type="number" 
                                  min="0.5" max="10" step="0.5" 
                                  value={ds.lineWidth ?? 2} 
                                  onChange={(e) => onDatasetStyleChange(ds.name, { lineWidth: parseFloat(e.target.value)})} 
                                  className="w-full h-10 p-2 border border-surface-2 rounded-md bg-surface-0 text-text-primary"
                                />
                            </div>
                         )}
                         {showPointControls && (
                            <>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-text-secondary mb-1">Point Shape</label>
                                        <select
                                            value={ds.pointShape ?? 'circle'}
                                            onChange={(e) => onDatasetStyleChange(ds.name, { pointShape: e.target.value as DataSet['pointShape'] })}
                                            className="w-full p-2 h-10 border border-surface-2 rounded-md bg-surface-0 text-text-primary focus:ring-brand-primary focus:border-brand-primary"
                                        >
                                            <option value="circle">Circle</option>
                                            <option value="cross">Cross</option>
                                            <option value="diamond">Diamond</option>
                                            <option value="square">Square</option>
                                            <option value="triangle">Triangle</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-text-secondary mb-1">Point Size</label>
                                        <input 
                                          type="number" 
                                          min="1" max="10" step="1" 
                                          value={ds.pointSize ?? 3} 
                                          onChange={(e) => onDatasetStyleChange(ds.name, { pointSize: parseInt(e.target.value, 10)})} 
                                          className="w-full h-10 p-2 border border-surface-2 rounded-md bg-surface-0 text-text-primary"
                                        />
                                    </div>
                                </div>
                            </>
                         )}
                         <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">Smoothing ({ds.smoothingLevel})</label>
                            <input
                                type="range" min="0" max="10" step="1"
                                value={ds.smoothingLevel ?? 0}
                                onChange={(e) => onDatasetStyleChange(ds.name, { smoothingLevel: parseInt(e.target.value, 10) })}
                                className="w-full h-10 p-0 bg-surface-0 accent-brand-primary"
                            />
                         </div>
                       </div>
                     </div>
                   )
                })}
              </div>
            </details>
           <details className="space-y-4">
              <summary className="font-bold text-text-primary cursor-pointer">X-Axis Style</summary>
              <div className="pl-2 pt-2">
                <AxisStyleEditor axis="xAxis" config={axisConfig.xAxis} onChange={(newConf) => onAxisConfigChange({ ...axisConfig, xAxis: newConf })} />
              </div>
           </details>
           <details className="space-y-4">
              <summary className="font-bold text-text-primary cursor-pointer">Y-Axis Style</summary>
              <div className="pl-2 pt-2">
                <AxisStyleEditor axis="yAxis" config={axisConfig.yAxis} onChange={(newConf) => onAxisConfigChange({ ...axisConfig, yAxis: newConf })} />
              </div>
           </details>
        </div>
      </div>
    </aside>
  );
};

export default React.memo(LegendSidebar);