export interface DashboardPeriod {
  from: string;
  to: string;
  timezone: "America/Lima";
}

export interface DashboardSummary {
  created: number;
  resolved: number;
  active: number;
  unassigned: number;
  avgAssignmentHours: number;
  avgResolutionHours: number;
}

export interface DashboardMetricItem {
  key: string;
  count: number;
}

export interface DashboardWorkloadItem {
  agent: string;
  assigned: number;
  inProgress: number;
}

export interface DashboardDailyItem {
  date: string;
  created: number;
  resolved: number;
}

export interface SupportDashboardMetrics {
  period: DashboardPeriod;
  summary: DashboardSummary;
  byStatus: DashboardMetricItem[];
  byPriority: DashboardMetricItem[];
  byArea: DashboardMetricItem[];
  byCategory: DashboardMetricItem[];
  workload: DashboardWorkloadItem[];
  daily: DashboardDailyItem[];
}

export interface DashboardDateRange {
  from: string;
  to: string;
}
