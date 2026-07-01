'use client'

import React from 'react'
import AnalyticsNav from '@/components/AnalyticsNav'

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnalyticsNav />
      {children}
    </>
  )
}
