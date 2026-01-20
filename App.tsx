
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import type { ChartPoint, DataSet, AxisConfig, AxisDomain, TabState } from './types';
import Sidebar from './components/Sidebar';
import LegendSidebar from './components/LegendSidebar';
import FileUpload from './components/FileUpload';
import ChartDisplay from './components/ChartDisplay';
import FeedbackModal from './components/FeedbackModal';
import DownloadLegend from './components/DownloadLegend';
import Tabs from './components/Tabs';

const COLORS = [
  '#0891b2', '#d946ef', '#f97316', '#22c55e', '#ef4444', '#6366f1', '#84cc16',
  '#06b6d4', '#a855f7', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#eab308'
];

const DEFAULT_AXIS_CONFIG: Omit<AxisConfig, 'xDomain' | 'yDomain'> = {
  unit: 'mA',
  precision: 2,
  xAxis: {
    color: '#1e293b',
    width: 2.5,
    label: { text: 'Potential (V)', fontSize: 16, offset: -15, color: '#1e293b', bold: true, italic: false },
    ticks: { fontSize: 14, color: '#475569', bold: false, italic: false },
    stepSize: undefined,
  },
  yAxis: {
    color: '#1e293b',
    width: 2.5,
    label: { text: 'Current (mA)', fontSize: 16, offset: 10, color: '#1e293b', bold: true, italic: false },
    ticks: { fontSize: 14, color: '#475569', bold: false, italic: false },
    stepSize: undefined,
  },
};

/**
 * Generates synthetic "Duck" shaped CV data for demonstration
 */
const generateSampleCVData = (): ChartPoint[] => {
  const points: ChartPoint[] = [];
  const E_start = 0.6;
  const E_vertex = -0.2;
  const steps = 200;
  
  // Forward scan
  for (let i = 0; i <= steps; i++) {
    const E = E_start - (i / steps) * (E_start - E_vertex);
    const cathodic_peak = 0.005 * Math.exp(-Math.pow(E - 0.1, 2) / 0.02);
    const noise = (Math.random() - 0.5) * 0.0001;
    points.push({ potential: E, current: -cathodic_peak + noise });
  }
  // Reverse scan
  for (let i = 0; i <= steps; i++) {
    const E = E_vertex + (i / steps) * (E_start - E_vertex);
    const anodic_peak = 0.004 * Math.exp(-Math.pow(E - 0.3, 2) / 0.02);
    const noise = (Math.random() - 0.5) * 0.0001;
    points.push({ potential: E, current: anodic_peak + noise });
  }
  return points;
};

const calculateAxisProperties = (dataMin: number, dataMax: number, targetTickCount: number = 7): { domain: AxisDomain, ticks: number[], step: number } => {
    if (dataMin >= dataMax) {
        const val = dataMin;
        const offset = val === 0 ? 0.1 : Math.abs(val * 0.1) || 0.1;
        const domain: AxisDomain = [val - offset, val + offset];
        const step = (domain[1] as number - (domain[0] as number)) / 2;
        const ticks = [val - offset, val, val + offset];
        return { domain, ticks, step };
    }

    const range = dataMax - dataMin;
    const padding = range * 0.05; 
    
    const paddedMin = dataMin - padding;
    const paddedMax = dataMax + padding;
    const paddedRange = paddedMax - paddedMin;

    if (paddedRange === 0) {
        const domain: AxisDomain = [paddedMin - 0.1, paddedMax + 0.1];
        const step = 0.1;
        return { domain, ticks: [paddedMin - 0.1, paddedMin, paddedMin + 0.1], step };
    }

    const niceSteps = [1, 2, 2.5, 4, 5, 10];
    const rawStep = paddedRange / Math.max(1, targetTickCount - 1);
    
    const power = Math.floor(Math.log10(rawStep));
    const magnitude = 10 ** power;
    const normalizedStep = rawStep / magnitude;

    const niceNormalizedStep = niceSteps.reduce((prev, curr) => 
        Math.abs(curr - normalizedStep) < Math.abs(prev - normalizedStep) ? curr : prev
    );
    const step = niceNormalizedStep * magnitude;

    const domainMin = Math.floor(paddedMin / step) * step;
    const domainMax = Math.ceil(paddedMax / step) * step;
    
    const ticks: number[] = [];
    if (domainMin < domainMax && step > 0) {
        for (let currentTick = domainMin; currentTick <= domainMax + (step / 2); currentTick += step) {
             ticks.push(Number(currentTick.toPrecision(15)));
        }
    } else {
        ticks.push(domainMin, domainMax);
    }
    
    if (ticks.length < 2) {
      ticks.splice(0, ticks.length, domainMin, (domainMin + domainMax) / 2, domainMax);
    }

    return { domain: [domainMin, domainMax], ticks, step };
};

const createNewTab = (name: string = 'New Tab'): TabState => ({
  id: Date.now().toString() + Math.random(),
  name,
  datasets: [],
  axisConfig: {
    ...DEFAULT_AXIS_CONFIG,
    xDomain: ['auto', 'auto'],
    yDomain: ['auto', 'auto'],
    xTickValues: undefined,
    yTickValues: undefined,
  },
  chartTitle: 'Cyclic Voltammetry Analysis',
  isEditingTitle: false,
  zoomHistory: [],
  isEditingTabName: false,
  initialXDomain: ['auto', 'auto'],
  initialYDomain: ['auto', 'auto'],
});


const parseCVData = (fileContent: string): ChartPoint[] => {
  const lines = fileContent.split('\n');
  const data: ChartPoint[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;

    const columns = trimmedLine.split(/\s+/);
    if (columns.length < 2) continue;

    const potential = parseFloat(columns[0]);
    const current = parseFloat(columns[1]); 

    if (isNaN(potential) || isNaN(current)) {
      continue;
    }

    data.push({ potential, current });
  }

  if (data.length === 0) {
    throw new Error("Could not parse any valid data. Ensure file has columns for Potential and Current.");
  }
  
  return data;
};

const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
};

const getMultiplier = (unit: AxisConfig['unit']) => {
  switch (unit) {
    case 'A': return 1;
    case 'mA': return 1e3;
    case 'µA': return 1e6;
    default: return 1;
  }
};

const smoothData = (data: ChartPoint[], windowSize: number): ChartPoint[] => {
    if (windowSize < 2) return data;
    const smoothed: ChartPoint[] = [];
    for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - Math.floor(windowSize / 2));
        const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
        const windowSlice = data.slice(start, end);
        const sum = windowSlice.reduce((acc, p) => acc + p.current, 0);
        smoothed.push({ ...data[i], current: sum / windowSlice.length });
    }
    return smoothed;
};

const App: React.FC = () => {
  const [tabs, setTabs] = useState<TabState[]>([createNewTab('Tab 1')]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);
  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId)!, [tabs, activeTabId]);
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState<number>(320);
  const [isPropertiesVisible, setIsPropertiesVisible] = useState<boolean>(true);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  
  const mainContentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadActionRef = useRef<'single' | 'overlay' | 'multiple'>('single');
  
  const updateActiveTab = useCallback((props: Partial<TabState> | ((currentTab: TabState) => Partial<TabState>)) => {
    setTabs(prevTabs => prevTabs.map(tab => {
        if (tab.id === activeTabId) {
            const updates = typeof props === 'function' ? props(tab) : props;
            return { ...tab, ...updates };
        }
        return tab;
    }));
  }, [activeTabId]);


  useEffect(() => {
    if (activeTab?.isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [activeTab?.isEditingTitle]);

  const loadSampleData = useCallback(() => {
    setIsLoading(true);
    const sampleData = generateSampleCVData();
    const dataset: DataSet = {
      name: "Sample Ferrocyanide CV",
      data: sampleData,
      color: COLORS[0],
      visible: true,
      plotStyle: 'line',
      lineWidth: 2,
      pointSize: 3,
      opacity: 1,
      pointShape: 'circle',
      smoothingLevel: 3,
    };

    updateActiveTab(currentTab => {
      const multiplier = getMultiplier(currentTab.axisConfig.unit);
      const xMin = Math.min(...sampleData.map(p => p.potential));
      const xMax = Math.max(...sampleData.map(p => p.potential));
      const yMin = Math.min(...sampleData.map(p => p.current)) * multiplier;
      const yMax = Math.max(...sampleData.map(p => p.current)) * multiplier;

      const { domain: xDomain, ticks: xTickValues, step: xStep } = calculateAxisProperties(xMin, xMax);
      const { domain: yDomain, ticks: yTickValues, step: yStep } = calculateAxisProperties(yMin, yMax);

      return {
        datasets: [dataset],
        chartTitle: "Sample Cyclic Voltammetry",
        axisConfig: {
          ...currentTab.axisConfig,
          xDomain, yDomain, xTickValues, yTickValues,
          xAxis: { ...currentTab.axisConfig.xAxis, stepSize: xStep },
          yAxis: { ...currentTab.axisConfig.yAxis, stepSize: yStep },
        },
        initialXDomain: xDomain,
        initialYDomain: yDomain,
      };
    });
    setIsLoading(false);
  }, [updateActiveTab]);

  const processFiles = useCallback(async (files: File[], isOverlay: boolean) => {
    setIsLoading(true);
    setError(null);
    if (!isOverlay) updateActiveTab({ zoomHistory: [] });

    try {
        const results = await Promise.all(files.map(async file => {
            const content = await readFileAsText(file);
            const parsedData = parseCVData(content);
            let fileName = file.name.toLowerCase().endsWith('.txt') ? file.name.slice(0, -4) : file.name;
            return { name: fileName, data: parsedData };
        }));

        updateActiveTab(currentTab => {
            const baseDatasets = isOverlay ? currentTab.datasets : [];
            const newDatasets: DataSet[] = results.map((result, index) => ({
                ...result,
                color: COLORS[(baseDatasets.length + index) % COLORS.length],
                visible: true,
                plotStyle: 'line',
                lineWidth: 2,
                pointSize: 3,
                opacity: 1,
                pointShape: 'circle',
                smoothingLevel: 0,
            }));
            const finalDatasets = [...baseDatasets, ...newDatasets];
            
            let newAxisConfig = { ...currentTab.axisConfig };
            let initialXDomain: AxisDomain = ['auto', 'auto'];
            let initialYDomain: AxisDomain = ['auto', 'auto'];

            if (finalDatasets.length > 0) {
                const allPoints = finalDatasets.flatMap(ds => ds.data);
                const multiplier = getMultiplier(currentTab.axisConfig.unit);

                const xMin = Math.min(...allPoints.map(p => p.potential));
                const xMax = Math.max(...allPoints.map(p => p.potential));
                const yMin = Math.min(...allPoints.map(p => p.current)) * multiplier;
                const yMax = Math.max(...allPoints.map(p => p.current)) * multiplier;
                
                const { domain: xDomain, ticks: xTickValues, step: xStep } = calculateAxisProperties(xMin, xMax);
                const { domain: yDomain, ticks: yTickValues, step: yStep } = calculateAxisProperties(yMin, yMax);
                
                newAxisConfig = { ...newAxisConfig, xDomain, yDomain, xTickValues, yTickValues, 
                  xAxis: {...newAxisConfig.xAxis, stepSize: xStep},
                  yAxis: {...newAxisConfig.yAxis, stepSize: yStep},
                };
                initialXDomain = xDomain;
                initialYDomain = yDomain;
            }
            
            if (!isPropertiesVisible) setIsPropertiesVisible(true);
            
            return {
                datasets: finalDatasets,
                axisConfig: newAxisConfig,
                initialXDomain,
                initialYDomain
            };
        });

    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred during parsing.');
        }
        if (!isOverlay) {
          updateActiveTab({ datasets: [] });
        }
    } finally {
        setIsLoading(false);
    }
  }, [isPropertiesVisible, updateActiveTab]);

  const processMultipleFiles = useCallback(async (files: File[]) => {
    setIsLoading(true);
    setError(null);
    
    if (tabs.length + files.length > 10) {
      setError(`Cannot add ${files.length} tabs. Max 10 tabs allowed.`);
      setIsLoading(false);
      return;
    }

    const newTabs: TabState[] = [];
    let firstNewTabId: string | null = null;
    let fileError = false;

    for (const file of files) {
      try {
        const content = await readFileAsText(file);
        const parsedData = parseCVData(content);
        let fileName = file.name.toLowerCase().endsWith('.txt') ? file.name.slice(0, -4) : file.name;
        
        const newTab = createNewTab(fileName);
        const dataset: DataSet = {
          name: fileName,
          data: parsedData,
          color: COLORS[0],
          visible: true,
          plotStyle: 'line',
          lineWidth: 2,
          pointSize: 3,
          opacity: 1,
          pointShape: 'circle',
          smoothingLevel: 0,
        };
  
        const multiplier = getMultiplier(newTab.axisConfig.unit);
        const xMin = Math.min(...parsedData.map(p => p.potential));
        const xMax = Math.max(...parsedData.map(p => p.potential));
        const yMin = Math.min(...parsedData.map(p => p.current)) * multiplier;
        const yMax = Math.max(...parsedData.map(p => p.current)) * multiplier;

        const { domain: xDomain, ticks: xTickValues, step: xStep } = calculateAxisProperties(xMin, xMax);
        const { domain: yDomain, ticks: yTickValues, step: yStep } = calculateAxisProperties(yMin, yMax);
        
        newTab.datasets = [dataset];
        newTab.chartTitle = fileName;
        newTab.axisConfig = { 
            ...newTab.axisConfig, xDomain, yDomain, xTickValues, yTickValues,
            xAxis: {...newTab.axisConfig.xAxis, stepSize: xStep},
            yAxis: {...newTab.axisConfig.yAxis, stepSize: yStep},
        };
        newTab.initialXDomain = xDomain;
        newTab.initialYDomain = yDomain;
        
        newTabs.push(newTab);
        if (!firstNewTabId) firstNewTabId = newTab.id;

      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error.';
        setError(`Error in file ${file.name}: ${message}`);
        fileError = true;
        break;
      }
    }
    
    if (!fileError && newTabs.length > 0) {
      setTabs(prevTabs => [...prevTabs, ...newTabs]);
      setActiveTabId(firstNewTabId!);
    }
  
    setIsLoading(false);
  }, [tabs.length]);


  const displayDatasets = useMemo(() => {
    if (!activeTab) return [];
    const multiplier = getMultiplier(activeTab.axisConfig.unit);
    return activeTab.datasets
      .filter(ds => ds.visible)
      .map(ds => {
        const processedData = smoothData(ds.data, ds.smoothingLevel).map(point => ({
          ...point,
          current: point.current * multiplier
        }));
        return { ...ds, data: processedData };
    });
  }, [activeTab]);

  const handleReset = useCallback(() => {
    setError(null);
    setIsLoading(false);
    
    const newTabDefaults = createNewTab(activeTab.name);
    updateActiveTab({
      datasets: newTabDefaults.datasets,
      axisConfig: newTabDefaults.axisConfig,
      chartTitle: newTabDefaults.chartTitle,
      zoomHistory: newTabDefaults.zoomHistory,
      initialXDomain: newTabDefaults.initialXDomain,
      initialYDomain: newTabDefaults.initialYDomain,
    });

    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }, [activeTab, updateActiveTab]);

  const performDownloadForTab = async (tab: TabState) => {
    const visibleDatasets = tab.datasets.filter(d => d.visible);
    if (visibleDatasets.length === 0) return;

    const exportContainer = document.createElement('div');
    Object.assign(exportContainer.style, {
        position: 'absolute',
        left: '-9999px',
        top: '0px',
        width: '1200px',
        height: '800px',
    });
    document.body.appendChild(exportContainer);

    const multiplier = getMultiplier(tab.axisConfig.unit);
    const displayDatasetsForDownload = visibleDatasets.map(ds => ({
        ...ds,
        data: smoothData(ds.data, ds.smoothingLevel).map(point => ({
            ...point,
            current: point.current * multiplier
        }))
    }));

    const downloadContent = (
      <React.StrictMode>
        <div style={{
          width: '100%', height: '100%', backgroundColor: '#f0f9ff', padding: '24px', boxSizing: 'border-box'
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%', height: '100%' }}>
                <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontSize: '1.25rem', textAlign: 'center', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem', flexShrink: 0 }}>{tab.chartTitle}</h2>
                    <div style={{flex: 1, width: '100%'}}>
                        <ChartDisplay datasets={displayDatasetsForDownload} axisConfig={tab.axisConfig} onBoxZoom={() => {}} onWheelZoom={()=>{}} onZoomOut={() => {}} canZoomOut={false}/>
                    </div>
                </div>
                <DownloadLegend datasets={visibleDatasets} />
            </div>
        </div>
      </React.StrictMode>
    );
    
    const renderRoot = createRoot(exportContainer);

    try {
        renderRoot.render(downloadContent);

        await new Promise<void>((resolve, reject) => {
            const timeout = 10000;
            const interval = 100;
            let elapsedTime = 0;
            const checkForRender = () => {
                const chartSurface = exportContainer.querySelector('.recharts-surface');
                if (chartSurface && chartSurface.clientWidth > 100 && chartSurface.clientHeight > 100) {
                    setTimeout(resolve, 300);
                } else {
                    elapsedTime += interval;
                    if (elapsedTime > timeout) {
                        reject(new Error(`Rendering chart timed out for ${tab.name}`));
                    } else {
                        setTimeout(checkForRender, interval);
                    }
                }
            };
            setTimeout(checkForRender, 100);
        });

        const canvas = await html2canvas(exportContainer, {
            scale: 2,
            logging: false,
            useCORS: true,
        });

        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        const fileNames = visibleDatasets.map(d => d.name).join('_&_');
        link.download = `${tab.name.replace(/ /g, '_')}_${fileNames}.png`;
        link.href = dataUrl;
        link.click();
        link.remove();
    } finally {
        renderRoot.unmount();
        document.body.removeChild(exportContainer);
    }
  };

const handleDownloadCurrent = useCallback(async () => {
    if (!activeTab || activeTab.datasets.filter(ds => ds.visible).length === 0) {
        setError("Nothing to download. Please upload or load sample data.");
        return;
    }
    setError(null);
    setIsLoading(true);

    try {
        await performDownloadForTab(activeTab);
    } catch (err) {
        setError(err instanceof Error ? err.message : "Download failed.");
    } finally {
        setIsLoading(false);
    }
}, [activeTab]);

const handleDownloadAll = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    for (const tab of tabs) {
        try {
            await performDownloadForTab(tab);
            await new Promise(res => setTimeout(res, 500));
        } catch (err) {
            setError(`Error downloading "${tab.name}"`);
            break;
        }
    }
    setIsLoading(false);
}, [tabs]);

  const handleTriggerUpload = (mode: 'single' | 'overlay' | 'multiple') => {
    uploadActionRef.current = mode;
    if (fileInputRef.current) {
        fileInputRef.current.multiple = mode === 'overlay' || mode === 'multiple';
        fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const mode = uploadActionRef.current;
      if (mode === 'multiple') {
        processMultipleFiles(files);
      } else {
        processFiles(files, mode === 'overlay');
      }
      e.target.value = '';
    }
  };

  const handleColorChange = (datasetName: string, newColor: string) => {
    updateActiveTab(tab => ({
      datasets: tab.datasets.map(ds => ds.name === datasetName ? { ...ds, color: newColor } : ds)
    }));
  };
  
  const handleToggleProperties = () => setIsPropertiesVisible(prev => !prev);
  
  const handleDeleteDataset = useCallback((nameToDelete: string) => {
    updateActiveTab(tab => ({
        datasets: tab.datasets.filter(ds => ds.name !== nameToDelete)
    }));
  }, [updateActiveTab]);

  const handleToggleVisibility = useCallback((nameToToggle: string) => {
    updateActiveTab(tab => ({
        datasets: tab.datasets.map(ds => ds.name === nameToToggle ? { ...ds, visible: !ds.visible } : ds)
    }));
  }, [updateActiveTab]);

  const handleRenameDataset = useCallback((oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || activeTab.datasets.some(ds => ds.name === trimmed && ds.name !== oldName)) return;
    updateActiveTab(tab => ({
        datasets: tab.datasets.map(ds => ds.name === oldName ? { ...ds, name: trimmed } : ds)
    }));
  }, [activeTab, updateActiveTab]);
  
  const handleDatasetStyleChange = useCallback((datasetName: string, styleChanges: Partial<DataSet>) => {
      updateActiveTab(tab => ({
        datasets: tab.datasets.map(ds => ds.name === datasetName ? { ...ds, ...styleChanges } : ds)
      }));
  }, [updateActiveTab]);

  const handleSendFeedback = (feedback: string) => {
    const recipientEmail = "inigoantony16@gmail.com";
    const mailtoLink = `mailto:${recipientEmail}?subject=Feedback&body=${encodeURIComponent(feedback)}`;
    window.location.href = mailtoLink;
    setIsFeedbackModalOpen(false);
  };

  const ChartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );

  const handleTitleBlur = () => {
    if (titleInputRef.current) {
      updateActiveTab({ isEditingTitle: false, chartTitle: titleInputRef.current.value || 'Untitled' });
    } else {
      updateActiveTab({ isEditingTitle: false });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleTitleBlur();
    else if (e.key === 'Escape') {
      if (titleInputRef.current) titleInputRef.current.value = activeTab.chartTitle;
      updateActiveTab({ isEditingTitle: false });
    }
  };
  
  const handleBoxZoom = (newDomains: {xDomain: AxisDomain, yDomain: AxisDomain}) => {
    const { zoomHistory, axisConfig } = activeTab;
    const newHistory = [...zoomHistory, { xDomain: axisConfig.xDomain, yDomain: axisConfig.yDomain }];
    updateActiveTab({
      zoomHistory: newHistory,
      axisConfig: { ...axisConfig, ...newDomains, xTickValues: undefined, yTickValues: undefined },
    });
  };
  
  const handleWheelZoom = (newDomains: {xDomain: AxisDomain, yDomain: AxisDomain}) => {
    updateActiveTab({
      axisConfig: { ...activeTab.axisConfig, ...newDomains, xTickValues: undefined, yTickValues: undefined },
    });
  };

  const handleZoomOut = () => {
    if (activeTab.zoomHistory.length > 0) {
        const lastZoom = activeTab.zoomHistory[activeTab.zoomHistory.length - 1];
        const newHistory = activeTab.zoomHistory.slice(0, -1);
        updateActiveTab({
          axisConfig: { ...activeTab.axisConfig, ...lastZoom, xTickValues: undefined, yTickValues: undefined },
          zoomHistory: newHistory,
        });
    }
  };
  
  const addTab = () => {
    if (tabs.length >= 10) return;
    const newTab = createNewTab(`Tab ${tabs.length + 1}`);
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (tabIdToClose: string) => {
    const tabIndex = tabs.findIndex(t => t.id === tabIdToClose);
    const newTabs = tabs.filter(t => t.id !== tabIdToClose);
    if (newTabs.length === 0) {
      const defaultTab = createNewTab('Tab 1');
      setTabs([defaultTab]);
      setActiveTabId(defaultTab.id);
      return;
    }
    if (activeTabId === tabIdToClose) {
      const newActiveIndex = Math.max(0, tabIndex - 1);
      setActiveTabId(newTabs[newActiveIndex].id);
    }
    setTabs(newTabs);
  };
  
  const handleTabNameChange = (tabId: string, newName: string) => {
    setTabs(tabs.map(t => t.id === tabId ? {...t, name: newName, isEditingTabName: false } : t));
  };
  
  const handleSetEditingTabName = (tabId: string, isEditing: boolean) => {
    setTabs(tabs.map(t => t.id === tabId ? { ...t, isEditingTabName: isEditing } : t));
  }
  
  if (!activeTab) return null;

  return (
    <div className="h-screen bg-base-200 flex flex-col font-sans overflow-hidden selection:bg-brand-primary/20">
      <input id="fileInput" type="file" accept=".txt" onChange={handleFileChange} className="hidden" ref={fileInputRef} disabled={isLoading} />
      <header className="bg-surface-0 shadow-sm sticky top-0 z-30 border-b border-surface-2">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
                <div className="flex items-center space-x-3">
                  <ChartIcon className="h-7 w-7 text-brand-primary"/>
                  <h1 className="text-lg font-bold text-text-primary tracking-tight">ElectroChem Plotter</h1>
                </div>
                <div className="text-xs text-text-secondary font-medium bg-base-200 px-2 py-1 rounded">v1.0.0-release</div>
            </div>
        </div>
        <Tabs 
          tabs={tabs}
          activeTabId={activeTabId}
          onTabClick={setActiveTabId}
          onAddTab={addTab}
          onCloseTab={closeTab}
          onTabNameChange={handleTabNameChange}
          onSetEditing={handleSetEditingTabName}
        />
      </header>
      
      <div className="flex flex-1 min-h-0 relative">
        <Sidebar
          onUploadSingle={() => handleTriggerUpload('single')}
          onUploadMultiple={() => handleTriggerUpload('multiple')}
          onOverlay={() => handleTriggerUpload('overlay')}
          onDownloadCurrent={handleDownloadCurrent}
          onDownloadAll={handleDownloadAll}
          onReset={handleReset}
          onToggleProperties={handleToggleProperties}
          onFeedback={() => setIsFeedbackModalOpen(true)}
          isLoading={isLoading}
          hasChart={activeTab.datasets.length > 0}
          hasMultipleTabs={tabs.length > 1}
        />
        <main className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-center overflow-hidden">
            {error && (<div className="w-full max-w-4xl bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded shadow-sm mb-4 animate-in fade-in slide-in-from-top-4" role="alert"><p className="font-bold">Parsing Error</p><p className="text-sm">{error}</p></div>)}
            {activeTab.datasets.length > 0 ? (
                <div id="main-content-wrapper" ref={mainContentRef} className="bg-surface-0 rounded-xl shadow-xl p-4 sm:p-6 w-full h-full max-w-7xl flex flex-col transition-all duration-300">
                    {activeTab.isEditingTitle ? (
                        <input ref={titleInputRef} defaultValue={activeTab.chartTitle} onBlur={handleTitleBlur} onKeyDown={handleTitleKeyDown} className="text-xl font-bold text-center text-text-primary mb-2 bg-base-200 border border-brand-primary rounded-lg px-2 py-1 outline-none w-full max-w-2xl mx-auto"/>
                    ) : (
                        <h2 onDoubleClick={() => updateActiveTab({ isEditingTitle: true })} className="text-xl text-center font-bold text-text-primary mb-2 truncate cursor-pointer hover:text-brand-primary transition-colors" title="Double-click to edit title">
                           {activeTab.chartTitle}
                        </h2>
                    )}
                    <ChartDisplay datasets={displayDatasets} axisConfig={activeTab.axisConfig} onBoxZoom={handleBoxZoom} onWheelZoom={handleWheelZoom} onZoomOut={handleZoomOut} canZoomOut={activeTab.zoomHistory.length > 0} />
                </div>
            ) : (<FileUpload onFileUpload={(files) => processFiles(files, false)} onTrySample={loadSampleData} isLoading={isLoading} />)}
        </main>
        {isPropertiesVisible && activeTab.datasets.length > 0 && (
            <LegendSidebar datasets={activeTab.datasets} onColorChange={handleColorChange} onDeleteDataset={handleDeleteDataset} onToggleVisibility={handleToggleVisibility} onRenameDataset={handleRenameDataset} onDatasetStyleChange={handleDatasetStyleChange} axisConfig={activeTab.axisConfig} onAxisConfigChange={(newConfig) => updateActiveTab({axisConfig: newConfig})} width={sidebarWidth} onWidthChange={setSidebarWidth}/>
        )}
      </div>
      <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} onSend={handleSendFeedback}/>
    </div>
  );
};

export default App;
