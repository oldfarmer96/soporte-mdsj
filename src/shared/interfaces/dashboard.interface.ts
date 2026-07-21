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
  bySubarea: DashboardMetricItem[];
  byCategory: DashboardMetricItem[];
  byProblemType: DashboardMetricItem[];
  workload: DashboardWorkloadItem[];
  daily: DashboardDailyItem[];
}

export interface DashboardDateRange {
  from: string;
  to: string;
}

export interface DashboardTicketReportItem {
  code: string;
  createdAt: string;
  updatedAt: string;
  requesterName: string;
  requesterDni: string;
  areaName: string;
  subareaName: string;
  categoryName: string;
  problemTypeName: string | null;
  subject: string;
  description: string | null;
  impact: TicketImpact;
  workStopped: boolean;
  priority: TicketPriority;
  status: TicketStatus;
  assignedAgentName: string | null;
  assignedAt: string | null;
  startedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
}
import type { TicketPriority } from "./catalog.interface";
import type { TicketImpact, TicketStatus } from "./ticket.interface";
