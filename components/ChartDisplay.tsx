

import React, { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, Symbols } from 'recharts';
import type { DataSet, AxisConfig, AxisDomain } from '../types';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

const hexToRgba = (hex: string, alpha: number): string => {
    if(!hex) hex = '#000000';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatValue = (value: number, config: AxisConfig): string => {
    const { unit, precision } = config;
    let decimalPlaces: number;

    switch (unit) {
        case 'A':
            decimalPlaces = precision + 3;
            break;
        case 'mA':
            decimalPlaces = precision;
            break;
        case 'µA':
            decimalPlaces = Math.max(0, precision - 2);
            break;
        default:
            decimalPlaces = precision;
    }
    return value.toFixed(decimalPlaces);
};

interface CustomTooltipContentProps {
    active?: boolean;
    payload?: {
        name: NameType;
        value: ValueType;
        color: string;
        payload: {
            opacity: number;
        }
    }[];
    label?: string | number;
    axisConfig?: AxisConfig;
}

const CustomTooltip: React.FC<CustomTooltipContentProps> = ({ active, payload, label, axisConfig }) => {
    if (active && payload && payload.length && axisConfig) {
      return (
        <div className="p-3 bg-surface-0/95 backdrop-blur-sm border border-surface-2 rounded-lg shadow-xl text-sm text-text-primary">
          <p className="font-bold mb-2 pb-2 border-b border-surface-2">{`Potential: ${Number(label).toFixed(3)} V`}</p>
          {payload.map((entry, index) => (
             <div key={`item-${index}`} className="space-y-1">
              <p style={{ color: hexToRgba(entry.color as string, entry.payload.opacity ?? 1) }}>
                <span className="font-semibold">{`Current: `}</span>
                {formatValue(entry.value as number, axisConfig)} {axisConfig.unit}
              </p>
              <p className="text-text-secondary text-xs truncate max-w-xs">{entry.name}</p>
             </div>
          ))}
        </div>
      );
    }
    return null;
};

const CustomDot: React.FC<any> = (props) => {
    const { cx, cy, fill, shape, pointSize } = props;
    if (cx === null || cy === null) return null;

    const symbolSize = pointSize * pointSize * 2; // Approximate conversion from radius to area

    return (
        <Symbols 
            cx={cx} 
            cy={cy} 
            type={shape} 
            size={symbolSize} 
            fill={fill}
        />
    );
};

const ZoomOutIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
);

const calculateTicks = (domain: AxisDomain, stepSize?: number): number[] | undefined => {
  if (typeof stepSize !== 'number' || stepSize <= 0 || domain.some(d => d === 'auto')) {
    return undefined; // Let Recharts decide
  }

  const [min, max] = domain as [number, number];
  if (min >= max) {
    return [min];
  }

  const ticks: number[] = [];
  const startValue = Math.ceil(min / stepSize) * stepSize;

  for (let tick = startValue; tick <= max; tick += stepSize) {
    ticks.push(Number(tick.toPrecision(15)));
  }
  return ticks;
};

interface ChartDisplayProps {
  datasets: DataSet[];
  axisConfig: AxisConfig;
  onBoxZoom: (newDomains: { xDomain: AxisDomain, yDomain: AxisDomain }) => void;
  onWheelZoom: (newDomains: { xDomain: AxisDomain, yDomain: AxisDomain }) => void;
  onZoomOut: () => void;
  canZoomOut: boolean;
}

const ChartDisplay: React.FC<ChartDisplayProps> = ({ datasets, axisConfig, onBoxZoom, onWheelZoom, onZoomOut, canZoomOut }) => {
  const [selection, setSelection] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [isShiftDown, setIsShiftDown] = useState(false);
  const [isZooming, setIsZooming] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Shift') setIsShiftDown(true); };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.key === 'Shift') setIsShiftDown(false); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const getChartScales = () => {
    const chart = chartRef.current?.chart;
    if (!chart || !chart.props.xAxisMap || !chart.props.yAxisMap) return null;
    const xAxis = Object.values(chart.props.xAxisMap)[0] as any;
    const yAxis = Object.values(chart.props.yAxisMap)[0] as any;
    if (!xAxis?.scale?.invert || !yAxis?.scale?.invert) return null;
    return { xScale: xAxis.scale, yScale: yAxis.scale };
  };
  
  const tickFormatter = (tick: number) => formatValue(tick, axisConfig);
  const { xAxis, yAxis } = axisConfig;
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isShiftDown || !containerRef.current) return;
    e.preventDefault();
    setIsZooming(true);
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSelection({ x1: x, y1: y, x2: x, y2: y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selection || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setSelection({ ...selection, x2: e.clientX - rect.left, y2: e.clientY - rect.top });
  };

  const handleMouseUp = () => {
    setIsZooming(false);
    if (!selection) return;

    if (Math.abs(selection.x1 - selection.x2) < 10 && Math.abs(selection.y1 - selection.y2) < 10) {
      setSelection(null);
      return;
    }
    
    const scales = getChartScales();
    if (!scales) {
        setSelection(null);
        return;
    }
    const { xScale, yScale } = scales;
    
    const newXDomain = [
        xScale.invert(selection.x1),
        xScale.invert(selection.x2)
    ].sort((a,b) => a-b).filter(isFinite) as AxisDomain;
    
    const newYDomain = [
        yScale.invert(selection.y1),
        yScale.invert(selection.y2)
    ].sort((a,b) => a-b).filter(isFinite) as AxisDomain;

    if (newXDomain.length === 2 && newYDomain.length === 2) {
        onBoxZoom({xDomain: newXDomain, yDomain: newYDomain});
    }
    
    setSelection(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const scales = getChartScales();
    if (!scales || !containerRef.current) return;

    const { xScale, yScale } = scales;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.2 : 1 / 1.2;

    const [xMin, xMax] = axisConfig.xDomain as [number, number];
    const [yMin, yMax] = axisConfig.yDomain as [number, number];
    
    const mouseXVal = xScale.invert(mouseX);
    const mouseYVal = yScale.invert(mouseY);

    const newXMin = mouseXVal - (mouseXVal - xMin) / zoomFactor;
    const newXMax = mouseXVal + (xMax - mouseXVal) / zoomFactor;
    const newYMin = mouseYVal - (mouseYVal - yMin) / zoomFactor;
    const newYMax = mouseYVal + (yMax - mouseYVal) / zoomFactor;

    onWheelZoom({ xDomain: [newXMin, newXMax], yDomain: [newYMin, newYMax] });
  };
  
  const selectionRectStyle = selection ? {
    position: 'absolute' as const,
    left: Math.min(selection.x1, selection.x2),
    top: Math.min(selection.y1, selection.y2),
    width: Math.abs(selection.x2 - selection.x1),
    height: Math.abs(selection.y2 - selection.y1),
    border: '1px dashed #0891b2',
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
    pointerEvents: 'none' as const,
    zIndex: 10,
  } : {};
  
  const xStepTicks = calculateTicks(axisConfig.xDomain, xAxis.stepSize);
  const yStepTicks = calculateTicks(axisConfig.yDomain, yAxis.stepSize);
  
  const xTicks = xStepTicks ?? axisConfig.xTickValues;
  const yTicks = yStepTicks ?? axisConfig.yTickValues;

  return (
    <div className="flex flex-col w-full h-full">
      <div 
        className="flex-grow w-full relative" 
        ref={containerRef}
        style={{ cursor: isShiftDown ? 'crosshair' : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setSelection(null); setIsZooming(false); }}
        onWheel={handleWheel}
      >
        <ResponsiveContainer width="100%" height="100%" debounce={1}>
          <LineChart
            ref={chartRef}
            data={datasets.length > 0 ? datasets[0].data : []}
            margin={{ top: 5, right: 30, left: 30, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" horizontal={true} />
            <XAxis 
              dataKey="potential" 
              type="number" 
              allowDuplicatedCategory={false}
              domain={axisConfig.xDomain}
              stroke={xAxis.color}
              strokeWidth={xAxis.width}
              tick={{ 
                fill: xAxis.ticks.color, 
                fontSize: xAxis.ticks.fontSize,
                fontWeight: xAxis.ticks.bold ? 'bold' : 'normal',
                fontStyle: xAxis.ticks.italic ? 'italic' : 'normal',
              }}
              tickFormatter={(tick) => tick.toFixed(2)}
              ticks={xTicks}
            >
               <Label 
                  value={xAxis.label.text} 
                  offset={xAxis.label.offset} 
                  position="insideBottom" 
                  style={{ 
                    fill: xAxis.label.color,
                    fontWeight: xAxis.label.bold ? 'bold' : 'normal',
                    fontStyle: xAxis.label.italic ? 'italic' : 'normal',
                    fontSize: xAxis.label.fontSize,
                  }}
                />
            </XAxis>
            <YAxis 
              yAxisId="left"
              stroke={yAxis.color}
              strokeWidth={yAxis.width}
              tick={{ 
                  fill: yAxis.ticks.color, 
                  fontSize: yAxis.ticks.fontSize,
                  fontWeight: yAxis.ticks.bold ? 'bold' : 'normal',
                  fontStyle: yAxis.ticks.italic ? 'italic' : 'normal',
              }}
              tickFormatter={tickFormatter}
              width={80}
              domain={axisConfig.yDomain}
              ticks={yTicks}
            >
              <Label 
                value={yAxis.label.text} 
                angle={-90} 
                position="insideLeft"
                offset={yAxis.label.offset}
                style={{ 
                  textAnchor: 'middle', 
                  fill: yAxis.label.color,
                  fontWeight: yAxis.label.bold ? 'bold' : 'normal',
                  fontStyle: yAxis.label.italic ? 'italic' : 'normal',
                  fontSize: yAxis.label.fontSize,
                }}
              />
            </YAxis>
            <Tooltip content={<CustomTooltip axisConfig={axisConfig} />} cursor={isZooming ? false : { stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }} />
            {datasets.map((ds) => {
              const plotStyle = ds.plotStyle ?? 'line';
              const lineWidth = ds.lineWidth ?? 2;
              const pointSize = ds.pointSize ?? 3;
              const opacity = ds.opacity ?? 1;
              const pointShape = ds.pointShape ?? 'circle';

              const showLine = plotStyle === 'line' || plotStyle === 'line-scatter';
              const showDots = plotStyle === 'scatter' || plotStyle === 'line-scatter';
              
              const strokeColor = hexToRgba(ds.color, opacity);
              
              const dotElement = showDots ? 
                <CustomDot shape={pointShape} pointSize={pointSize} fill={strokeColor} /> 
                : false;
              
              // The active dot should always be visible on hover, regardless of plot style.
              const activeDotElement = (
                <CustomDot shape={pointShape} pointSize={pointSize + 2} fill={strokeColor} />
              );

              return (
                <Line
                  key={ds.name}
                  yAxisId="left"
                  type="monotone"
                  data={ds.data}
                  dataKey="current"
                  name={ds.name}
                  stroke={showLine ? strokeColor : 'transparent'}
                  strokeWidth={showLine ? lineWidth : 0}
                  dot={dotElement}
                  activeDot={activeDotElement}
                  isAnimationActive={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
        {selection && <div style={selectionRectStyle} />}
      </div>
      <div className="flex items-center justify-end p-2 pr-8">
        {canZoomOut && (
            <button
                onClick={onZoomOut}
                className="p-2 rounded-md text-text-secondary bg-surface-1 hover:bg-base-200 shadow-md border border-surface-2"
                aria-label="Zoom out"
                title="Zoom Out"
            >
                <ZoomOutIcon />
            </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(ChartDisplay);