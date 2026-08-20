export interface DaySummary {
  date: string;
  completed: number;
  notCompleted: number;
  ignored: number;
  total: number;
  completionRate: number; // 0..1
}
