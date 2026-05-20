export default class Dashboard {
    year: number
    totalMiles: number
    totalExpenses: number
    documentCount: number
    upcomingDeadlineCount: number
    id: number
  
    constructor(year: number) {
      this.year = year
      this.totalMiles = 0
      this.totalExpenses = 0
      this.documentCount = 0
      this.upcomingDeadlineCount = 0
      this.id = 0
    }
  }