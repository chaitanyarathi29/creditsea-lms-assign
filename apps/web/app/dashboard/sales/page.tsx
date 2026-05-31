'use client'

import React, { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import LoadingSpinner from '../../components/LoadingSpinner'
import StatusBadge from '../../components/StatusBadge'
import type { Lead, LeadsResponse } from '../../lib/types'

export default function SalesPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    async function fetchLeads() {
      try {
        const data = await api.get<LeadsResponse>('/dashboard/sales/leads')
        setLeads(data.leads || [])
      } catch (err: any) {
        showToast(err.message || 'Failed to fetch leads', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchLeads()
  }, [showToast])

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <LoadingSpinner size={40} />
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1>Sales Dashboard</h1>
          <p>Track registered users and borrower application leads.</p>
        </div>
        <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
          <input
            type="text"
            className="input"
            placeholder="Search leads by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="card empty-state">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A2.25 2.25 0 0112.75 21.5h-1.5a2.25 2.25 0 01-2.25-2.263V19.13m0 0a9.337 9.337 0 01-4.121-.952 4.125 4.125 0 00-7.533 2.493M9 19.128v-.003c0-1.113.285-2.16.786-3.07M15 7.5a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <h3>No Leads Found</h3>
          <p className="text-sm text-muted">
            {searchTerm ? 'No results match your search criteria.' : 'There are currently no registered borrower leads.'}
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Borrower Name</th>
                <th>Email Address</th>
                <th>Registration Date</th>
                <th>Profile Status</th>
                <th>Salary Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => {
                const profile = lead.profile
                return (
                  <tr key={lead._id}>
                    <td>
                      <div className="font-semibold">{lead.name}</div>
                    </td>
                    <td>{lead.email}</td>
                    <td>
                      {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td>
                      {profile ? (
                        <StatusBadge status={profile.breStatus} />
                      ) : (
                        <span className="badge badge-pending">NO PROFILE</span>
                      )}
                    </td>
                    <td>
                      {profile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span className="font-medium text-xs">
                            ₹{profile.monthlySalary.toLocaleString('en-IN')} / mo
                          </span>
                          <span className="text-muted" style={{ fontSize: '10px' }}>
                            {profile.employmentMode}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
