// Type definitions for Board, Column, and Card
export interface Dashboard {
    year: number
    totalMiles: number
    totalExpenses: number
    documentCount: number
    upcomingDeadlineCount: number
    id: number
}

// Type definitions for JSON export feature
export interface DashboardExport {
    dashboard: Dashboard
}