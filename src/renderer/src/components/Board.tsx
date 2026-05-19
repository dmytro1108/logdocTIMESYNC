export default class Board {
    year: number
    totalMiles: number
    totalExpenses: number
    documentCount: number
    upcomingDeadlineCount: number
  
    constructor(year: number) {
      this.year = year
      this.totalMiles = 0
      this.totalExpenses = 0
      this.documentCount = 0
      this.upcomingDeadlineCount = 0
    }
  }