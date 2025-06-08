import { BaseDescriptor } from './base-descriptor.model.js';

export interface ViewModelDescriptor extends BaseDescriptor {
  name: string;
  description?: string;
  formView?: FormViewDescriptor;
  listView?: ListViewDescriptor;
  detailView?: DetailViewDescriptor;
  gridView?: GridViewDescriptor;
  treeView?: TreeViewDescriptor;
  chartView?: ChartViewDescriptor;
  reportView?: ReportViewDescriptor;
  dashboardView?: DashboardViewDescriptor;
  customView?: CustomViewDescriptor;
  dataModelGuid?: string; // reference to CdModelDescriptor
  viewContext?: ViewContext; // e.g. frontend, admin, mobile
}

export type ViewContext =
  | 'frontend'
  | 'admin'
  | 'pwa'
  | 'cli'
  | 'mobile'
  | 'external';

// ---------------------- View Types ----------------------

export type FormLayout = 'vertical' | 'horizontal' | 'inline';

export interface FormViewDescriptor {
  layout: FormLayout;
  fields: ViewFieldDescriptor[];
  validationSchema?: Record<string, any>;
  submitAction?: string; // reference to controller action
}

export interface ListViewDescriptor {
  columns: ViewFieldDescriptor[];
  pageSize?: number;
  searchEnabled?: boolean;
  filters?: ViewFilterDescriptor[];
  rowAction?: string; // reference to controller action
}

export interface DetailViewDescriptor {
  sections: ViewSectionDescriptor[];
  readOnly?: boolean;
  fetchAction?: string;
}

export interface GridViewDescriptor {
  columns: ViewFieldDescriptor[];
  editable?: boolean;
  bulkActions?: string[]; // references to actions
}

export interface TreeViewDescriptor {
  nodeField: string;
  childRelationField: string;
  actions?: string[];
}

export interface ChartViewDescriptor {
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'radar';
  dataSource: string; // action or service reference
  xField: string;
  yFields: string[];
  options?: Record<string, any>;
}

export interface ReportViewDescriptor {
  title: string;
  description?: string;
  layout: ReportLayout;
  dataSource: string;
  filters?: ViewFilterDescriptor[];
}

export interface DashboardViewDescriptor {
  widgets: DashboardWidgetDescriptor[];
  layout?: DashboardLayoutDescriptor;
}

export interface CustomViewDescriptor {
  componentName: string;
  description?: string;
  props?: Record<string, any>;
}

// ---------------------- Common Reusables ----------------------

export interface ViewFieldDescriptor {
  field: string;
  label?: string;
  type?: string; // e.g. text, number, select, date
  visible?: boolean;
  editable?: boolean;
  width?: number | string;
  options?: any[] | string; // inline or dynamic source
  binding?: string; // two-way or one-way binding
}

export interface ViewFilterDescriptor {
  field: string;
  label?: string;
  type?: 'text' | 'select' | 'date' | 'range';
  options?: any[] | string; // inline or dynamic source
}

export interface ViewSectionDescriptor {
  title: string;
  fields: ViewFieldDescriptor[];
}

export interface ReportLayout {
  type: 'table' | 'grouped' | 'summary';
  columns?: string[];
}

export interface DashboardWidgetDescriptor {
  title: string;
  type: 'chart' | 'list' | 'stat' | 'custom';
  config: any;
  size?: 'small' | 'medium' | 'large';
}

export interface DashboardLayoutDescriptor {
  rows: number;
  columns: number;
  positions: Record<string, { row: number; col: number }>; // widget id => position
}
