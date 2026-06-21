import React from 'react'

type MyDashboardProps = {
  onClose: () => void
}

type MyDashboardState = {
  year: number,
  totalMiles: number,
  totalExpenses: number,
  documentCount: number,
  upcomingDeadlineCount: number,
  id: number
}


export class Dashboard extends React.Component<MyDashboardProps, MyDashboardState> {
    year: number
    totalMiles: number
    totalExpenses: number
    documentCount: number
    upcomingDeadlineCount: number
    id: number

    constructor(props: MyDashboardProps) {
      super(props)
      this.year = 0
      this.totalMiles = 0
      this.totalExpenses = 0
      this.documentCount = 0
      this.upcomingDeadlineCount = 0
      this.id = 0

      this.state = {
        year: 0,
        totalMiles: 0,
        totalExpenses: 0,
        documentCount: 0,
        upcomingDeadlineCount: 0,
        id: 0
      }
    }
    
  render() {

    return (
      <div style = {{ "fontSize": "25px"}}>

        <header style = {{ "fontSize": "45px", "gap": "4px"}}>Dashboard</header>
        <div>
          <div>
            <label htmlFor="export-year">Export Year: </label>
            <span>{this.state.year}</span>
          </div>
          <div>
            <label htmlFor="total-miles">Total Miles: </label>
            <span>{this.state.totalMiles}</span>
          </div>
          <div>
            <label htmlFor="total-expenses">Total Expenses: </label>
            <span>{this.state.totalExpenses}</span>
          </div>
          <div>
            <label htmlFor="documents">Documents: </label>
            <span>{this.state.documentCount}</span>
          </div>
          <div>
            <label htmlFor="upcoming-deadlines">Upcoming Deadlines: </label>
            <span>{this.state.upcomingDeadlineCount}</span>
          </div>
        </div>

      </div>
    )
  }
}