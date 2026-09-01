import React from 'react'
import ReportsPage from './ReportsPage'

/**
 * Intern-specific report page.
 * Re-uses the shared ReportsPage component which already filters
 * data based on the logged-in user's role (intern vs HR).
 */
const InternReportPage: React.FC = () => {
  return <ReportsPage />
}

export default InternReportPage
