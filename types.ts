export interface ChartPoint {
  potential: number;
  current: number; // Stored in base unit (Amperes)
}

export interface DataSet {
  name: string;
  data: ChartPoint[];
  color: string;
  visible: boolean;
  plotStyle: 'line' | 'scatter' | 'line-scatter';
  lineWidth: number;
  pointSize: number;
  opacity: number;
  pointShape: 'circle' | 'cross' | 'diamond' | 'square' | 'triangle';
  smoothingLevel: number;
}

export type AxisDomain = [number | 'auto', number | 'auto'];

export interface AxisLabelConfig {
  text: string;
  fontSize: number;
  offset: number;
  color: string;
  bold: boolean;
  italic: boolean;
}

export interface AxisStyle {
  color: string;
  width: number;
  label: AxisLabelConfig;
  ticks: {
    fontSize: number;
    color: string;
    bold: boolean;
    italic: boolean;
  };
  stepSize?: number;
}

export interface AxisConfig {
  unit: 'A' | 'mA' | 'µA';
  precision: number;
  xDomain: AxisDomain;
  yDomain: AxisDomain;
  xAxis: AxisStyle;
  yAxis: AxisStyle;
  xTickValues?: number[];
  yTickValues?: number[];
}

export interface TabState {
  id: string;
  name: string;
  datasets: DataSet[];
  axisConfig: AxisConfig;
  chartTitle: string;
  isEditingTitle: boolean;
  zoomHistory: {xDomain: AxisDomain, yDomain: AxisDomain}[];
  isEditingTabName: boolean;
  initialXDomain: AxisDomain;
  initialYDomain: AxisDomain;
}