import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import './Dashboard.css'
import './UserDashboard.css'

const UserDashboard = () => {
  const { user, logout } = useAuth()
  const [equipment, setEquipment] = useState([])
  const [myRequests, setMyRequests] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [issueType, setIssueType] = useState('')
  const [description, setDescription] = useState('')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  useEffect(() => {
    // Poll for updates every 10 seconds for live tracking (only if user is admin)
    if (user?.role === 'ADMIN') {
      const interval = setInterval(() => {
        fetchMyRequests()
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchEquipment(),
        fetchMyRequests(),
        fetchTeams()
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchEquipment = async () => {
    try {
      const response = await axios.get('/api/equipment')
      setEquipment(response.data)
    } catch (error) {
      console.error('Error fetching equipment:', error)
    }
  }

  const fetchMyRequests = async () => {
    // Don't fetch if user is not loaded yet
    if (!user) {
      const stored = localStorage.getItem('myMaintenanceRequests')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setMyRequests(parsed)
        } catch (e) {
          setMyRequests([])
        }
      }
      return
    }

    // Only ADMIN can access /api/maintenance
    if (user.role === 'ADMIN') {
      try {
        const response = await axios.get('/api/maintenance')
        const myReqs = response.data.filter(m => 
          m.reportedBy?._id === user.id || 
          m.reportedBy?.email === user.email ||
          (typeof m.reportedBy === 'string' && m.reportedBy === user.id)
        )
        setMyRequests(myReqs)
        if (myReqs.length > 0) {
          localStorage.setItem('myMaintenanceRequests', JSON.stringify(myReqs))
        }
      } catch (error) {
        // If API fails, use localStorage
        const stored = localStorage.getItem('myMaintenanceRequests')
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            setMyRequests(parsed)
          } catch (e) {
            setMyRequests([])
          }
        }
      }
    } else {
      // For non-admin users (EMPLOYEE), use localStorage only
      const stored = localStorage.getItem('myMaintenanceRequests')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setMyRequests(parsed)
        } catch (e) {
          setMyRequests([])
        }
      } else {
        setMyRequests([])
      }
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/api/team')
      setTeams(response.data)
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const handleSelectEquipment = (eq) => {
    setSelectedEquipment(eq)
    setShowModal(true)
  }

  const handleSubmitRequest = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post('/api/maintenance', {
        equipmentId: selectedEquipment._id,
        issueType,
        description
      })
      
      // Store in localStorage as backup
      const stored = JSON.parse(localStorage.getItem('myMaintenanceRequests') || '[]')
      stored.push(response.data.maintenance)
      localStorage.setItem('myMaintenanceRequests', JSON.stringify(stored))
      
      alert('Maintenance request created successfully!')
      setShowModal(false)
      setIssueType('')
      setDescription('')
      setSelectedEquipment(null)
      fetchMyRequests()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create request')
    }
  }

  const handleViewDetails = (req) => {
    setSelectedRequest(req)
    setShowDetailsModal(true)
  }

  const getStatusColor = (status) => {
    const colors = {
      OPEN: '#ff9800',
      SCHEDULED: '#2196f3',
      IN_PROGRESS: '#9c27b0',
      COMPLETED: '#4caf50'
    }
    return colors[status] || '#666'
  }

  const getCurrentStep = (status) => {
    const steps = ['OPEN', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED']
    return steps.indexOf(status)
  }

  const getTeamInfo = (teamId) => {
    if (!teamId) return null
    return teams.find(t => t._id === teamId)
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🔧 Equipment Maintenance Portal</h1>
        <div className="user-info">
          <span>👤 {user?.name}</span>
          <button onClick={logout} className="btn-logout">Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        <section className="section">
          <h2>📦 Available Equipment</h2>
          <div className="equipment-grid">
            {equipment.length === 0 ? (
              <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: '#666' }}>
                No equipment available
              </p>
            ) : (
              equipment.map((eq) => (
                <div key={eq._id} className="equipment-card">
                  <h3>{eq.name}</h3>
                  <p><strong>Serial:</strong> {eq.serialNumber}</p>
                  <p><strong>Location:</strong> {eq.location}</p>
                  <p><strong>Status:</strong> <span className={`status-badge status-${eq.status}`}>{eq.status}</span></p>
                  <p><strong>Team:</strong> {eq.teamId?.name || 'N/A'}</p>
                  <button
                    onClick={() => handleSelectEquipment(eq)}
                    className="btn-primary"
                    disabled={eq.status === 'UNDER_MAINTENANCE'}
                  >
                    {eq.status === 'UNDER_MAINTENANCE' ? 'Under Maintenance' : 'Request Maintenance'}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="section">
          <h2>📋 My Maintenance Requests</h2>
          {myRequests.length === 0 ? (
            <div className="empty-state">
              <p>No maintenance requests yet. Create one above! 👆</p>
            </div>
          ) : (
            <div className="requests-list">
              {myRequests.map((req) => {
                const teamInfo = getTeamInfo(req.assignedTeam?._id || req.assignedTeam)
                const currentStep = getCurrentStep(req.status)
                
                return (
                  <div key={req._id} className="request-card">
                    <div className="request-header">
                      <h3>{req.equipment?.name || 'Equipment'}</h3>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(req.status) }}
                      >
                        {req.status}
                      </span>
                    </div>
                    
                    <div className="request-details">
                      <p><strong>Type:</strong> {req.issueType}</p>
                      <p><strong>Description:</strong> {req.description || 'N/A'}</p>
                      {teamInfo && (
                        <div className="team-info-card">
                          <p><strong>Assigned Team:</strong> {teamInfo.name}</p>
                          {teamInfo.members && teamInfo.members.length > 0 && (
                            <div>
                              <p><strong>Team Members:</strong></p>
                              <div className="team-members">
                                {teamInfo.members.map((member, idx) => (
                                  <span key={idx} className="team-member-badge">
                                    {member.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {req.scheduledDate && (
                        <p><strong>📅 Scheduled:</strong> {new Date(req.scheduledDate).toLocaleString()}</p>
                      )}
                      <p><strong>Created:</strong> {new Date(req.createdAt).toLocaleString()}</p>
                    </div>

                    {/* Live Tracking */}
                    <div className="tracking-card">
                      <div className="tracking-header">
                        <h3>Live Tracking</h3>
                        <div className="live-indicator">
                          <span className="live-dot"></span>
                          <span>Live</span>
                        </div>
                      </div>
                      <div className="tracking-steps">
                        <div className="tracking-step">
                          <div className={`step-circle ${currentStep >= 0 ? 'active' : ''} ${currentStep > 0 ? 'completed' : ''}`}>
                            {currentStep > 0 ? '✓' : '1'}
                          </div>
                          <div className="step-label">Requested</div>
                        </div>
                        <div className="tracking-step">
                          <div className={`step-circle ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                            {currentStep > 1 ? '✓' : '2'}
                          </div>
                          <div className="step-label">Scheduled</div>
                        </div>
                        <div className="tracking-step">
                          <div className={`step-circle ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                            {currentStep > 2 ? '✓' : '3'}
                          </div>
                          <div className="step-label">In Progress</div>
                        </div>
                        <div className="tracking-step">
                          <div className={`step-circle ${currentStep >= 3 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                            {currentStep >= 3 ? '✓' : '4'}
                          </div>
                          <div className="step-label">Completed</div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewDetails(req)}
                      className="btn-secondary"
                      style={{ marginTop: '1rem', width: '100%' }}
                    >
                      View Full Details
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create Maintenance Request</h2>
            <p><strong>Equipment:</strong> {selectedEquipment?.name}</p>
            <form onSubmit={handleSubmitRequest}>
              <div className="form-group">
                <label>Issue Type *</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  required
                >
                  <option value="">Select type</option>
                  <option value="CORRECTIVE">Corrective</option>
                  <option value="PREVENTIVE">Preventive</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="4"
                  placeholder="Describe the issue or maintenance needed..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailsModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Maintenance Request Details</h2>
            <div className="details-content">
              <p><strong>Equipment:</strong> {selectedRequest.equipment?.name}</p>
              <p><strong>Serial Number:</strong> {selectedRequest.equipment?.serialNumber}</p>
              <p><strong>Location:</strong> {selectedRequest.equipment?.location}</p>
              <p><strong>Issue Type:</strong> {selectedRequest.issueType}</p>
              <p><strong>Status:</strong> <span className={`status-badge status-${selectedRequest.status}`}>{selectedRequest.status}</span></p>
              <p><strong>Description:</strong> {selectedRequest.description || 'N/A'}</p>
              {getTeamInfo(selectedRequest.assignedTeam?._id || selectedRequest.assignedTeam) && (
                <div className="team-info-card">
                  <p><strong>Assigned Team:</strong> {getTeamInfo(selectedRequest.assignedTeam?._id || selectedRequest.assignedTeam).name}</p>
                  {getTeamInfo(selectedRequest.assignedTeam?._id || selectedRequest.assignedTeam).members && (
                    <div>
                      <p><strong>Team Members:</strong></p>
                      <div className="team-members">
                        {getTeamInfo(selectedRequest.assignedTeam?._id || selectedRequest.assignedTeam).members.map((member, idx) => (
                          <span key={idx} className="team-member-badge">{member.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {selectedRequest.scheduledDate && (
                <p><strong>Scheduled Date:</strong> {new Date(selectedRequest.scheduledDate).toLocaleString()}</p>
              )}
              {selectedRequest.completedAt && (
                <p><strong>Completed At:</strong> {new Date(selectedRequest.completedAt).toLocaleString()}</p>
              )}
              <p><strong>Created:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}</p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowDetailsModal(false)} className="btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserDashboard
