'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import LoadingSpinner from '../../components/LoadingSpinner'
import type { BorrowerProfile, ProfileResponse } from '../../lib/types'

export default function SalarySlipPage() {
  const [profile, setProfile] = useState<BorrowerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await api.get<ProfileResponse>('/borrower/profile')
        if (data.profile) {
          setProfile(data.profile)
          if (data.profile.breStatus !== 'PASSED') {
            showToast('Please pass the eligibility checks first', 'warning')
            router.push('/apply')
          }
        } else {
          router.push('/apply')
        }
      } catch {
        showToast('Please complete your personal details first', 'warning')
        router.push('/apply')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [router, showToast])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const validateFile = (file: File): boolean => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      showToast('Only PDF, JPG, and PNG files are allowed', 'error')
      return false
    }
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      showToast('File size must be less than 5MB', 'error')
      return false
    }
    return true
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    const formData = new FormData()
    formData.append('salarySlip', selectedFile)

    try {
      const data = await api.post<ProfileResponse>('/borrower/salary-slip', formData)
      setProfile(data.profile)
      setSelectedFile(null)
      showToast('Salary slip uploaded successfully!', 'success')
    } catch (err) {
      const error = err as Error
      showToast(error.message || 'File upload failed. Make sure the S3 service is running.', 'error')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner size={40} />
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Upload Salary Slip</h1>
        <p>Provide your latest net salary slip for income verification.</p>
      </div>

      <div className="card flex flex-col gap-6">
        {profile?.salarySlipUrl && (
          <div className="alert alert-success">
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div>
                <span className="font-semibold">Salary Slip Verified</span>
                <p className="text-xs text-success mt-1">A valid salary slip is already on file.</p>
              </div>
              <a
                href={profile.salarySlipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderColor: 'rgba(0,0,0,0.1)' }}
              >
                View Uploaded File
              </a>
            </div>
          </div>
        )}

        <div
          style={{
            border: dragActive ? '2px dashed var(--color-accent)' : '2px dashed var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-8)',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: dragActive ? 'var(--color-accent-subtle)' : 'var(--color-surface)',
            transition: 'all 0.15s ease'
          }}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-text-muted)"
            strokeWidth="1.5"
            style={{ margin: '0 auto var(--space-4)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
          </svg>

          {selectedFile ? (
            <div>
              <div className="font-semibold text-accent">{selectedFile.name}</div>
              <div className="text-xs text-muted mt-1">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          ) : (
            <div>
              <div className="font-semibold">Drag & drop your file here, or click to browse</div>
              <div className="text-xs text-muted mt-2">Supports PDF, JPG, PNG up to 5MB</div>
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="flex justify-end gap-3">
            <button
              className="btn btn-ghost"
              onClick={() => setSelectedFile(null)}
              disabled={uploading}
            >
              Clear
            </button>
            <button
              className="btn className btn-primary"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        )}

        <div className="flex justify-between mt-4" style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-6)' }}>
          <button
            className="btn btn-ghost"
            onClick={() => router.push('/apply')}
          >
            Back
          </button>
          
          <button
            className="btn btn-primary"
            onClick={() => router.push('/apply/loan')}
            disabled={!profile?.salarySlipUrl}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
