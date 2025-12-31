import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './Dashboard.css'
import './TechnicianDashboard.css'

const localizer = momentLocalizer(moment)

const TechnicianDashboard = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('calendar')
  const [maintenance, setMaintenance] = useState([])
  const [teams, setTeams] = useState([])
  const [selectedMaintenance, setSelectedMaintenance] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchMaintenance(),
        fetchTeams()
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchMaintenance = async () => {
    try {
      const response = await axios.get('/api/maintenance/my')
      setMaintenance(response.data)
    } catch (error) {
      console.error('Error fetching maintenance:', error)
      // If 404, it means technician is not assigned to a team
      if (error.response?.status === 404) {
        setMaintenance([])
        // Show a helpful message
        if (error.response?.data?.message?.includes('not assigned')) {
          console.log('Technician not assigned to any team. Please contact admin.')
        }
      } else {
        setMaintenance([])
      }
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/api/team')
      setTeams(response.data)
      // Find user's team from teams list
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const getMyTeam = () => {
    // Find team where user is a member
    // Members array has _id, name, email from getAllTeams
    return teams.find(team => {
      return team.members && team.members.some(m => m._id === user.id || m.email === user.email)
    })
  }

  const getTeamMembers = () => {
    const myTeam = getMyTeam()
    if (!myTeam) return []
    // Members have _id, name, email (role not included in backend response)
    return myTeam.members.map(m => ({
      ...m,
      role: (m._id === user.id || m.email === user.email) ? user.role : 'Member'
    }))
  }

  const handleStartMaintenance = async (maintenanceId) => {
    try {
      await axios.put(`/api/maintenance/start/${maintenanceId}`)
      alert('Maintenance started!')
      fetchMaintenance()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to start maintenance')
    }
  }

  const handleCompleteMaintenance = async (maintenanceId) => {
    try {
      await axios.put(`/api/maintenance/complete/${maintenanceId}`)
      alert('Maintenance completed!')
      fetchMaintenance()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to complete maintenance')
    }
  }

  const handleViewDetails = (maintenanceItem) => {
    setSelectedMaintenance(maintenanceItem)
    setShowDetailsModal(true)
  }

  const getCalendarEvents = () => {
    return maintenance
      .filter(m => m.scheduledDate)
      .map(m => ({
        title: `${m.equipment?.name} - ${m.issueType}`,
        start: new Date(m.scheduledDate),
        end: new Date(new Date(m.scheduledDate).getTime() + 60 * 60 * 1000),
        resource: m
      }))
  }

  const handleEventClick = (event) => {
    handleViewDetails(event.resource)
  }

  const myTeam = getMyTeam()
  const teamMembers = getTeamMembers()

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Technician Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.name}</span>
          <button onClick={logout} className="btn-logout">Logout</button>
        </div>
      </header>

      <div className="tabs">
        <button
          className={activeTab === 'calendar' ? 'active' : ''}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar
        </button>
        <button
          className={activeTab === 'maintenance' ? 'active' : ''}
          onClick={() => setActiveTab('maintenance')}
        >
          My Maintenance
        </button>
        <button
          className={activeTab === 'team' ? 'active' : ''}
          onClick={() => setActiveTab('team')}
        >
          Team Info
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'calendar' && (
          <div className="calendar-container">
            <Calendar
              localizer={localizer}
              events={getCalendarEvents()}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              onSelectEvent={handleEventClick}
            />
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="maintenance-list">
            {maintenance.length === 0 ? (
              <p>No maintenance tasks assigned</p>
            ) : (
              maintenance.map((m) => (
                <div key={m._id} className="maintenance-card">
                  <div className="maintenance-header">
                    <h3>{m.equipment?.name}</h3>
                    <span className={`status-badge status-${m.status}`}>{m.status}</span>
                  </div>
                  <p><strong>Location:</strong> {m.equipment?.location}</p>
                  <p><strong>Type:</strong> {m.issueType}</p>
                  <p><strong>Description:</strong> {m.description || 'N/A'}</p>
                  <p><strong>Reported by:</strong> {m.reportedBy?.name}</p>
                  {m.scheduledDate && (
                    <p><strong>Scheduled:</strong> {new Date(m.scheduledDate).toLocaleString()}</p>
                  )}
                  <div className="maintenance-actions">
                    <button
                      onClick={() => handleViewDetails(m)}
                      className="btn-secondary"
                    >
                      View Details
                    </button>
                    {m.status === 'SCHEDULED' && (
                      <button
                        onClick={() => handleStartMaintenance(m._id)}
                        className="btn-primary"
                      >
                        Start
                      </button>
                    )}
                    {m.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleCompleteMaintenance(m._id)}
                        className="btn-success"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'team' && (
          <div className="team-info">
            {myTeam ? (
              <>
                <div className="team-card">
                  <h2>Team: {myTeam.name}</h2>
                  <h3>Team Members</h3>
                  <div className="members-list">
                    {teamMembers.map((member) => (
                      <div key={member._id} className="member-card">
                        <p><strong>Name:</strong> {member.name}</p>
                        <p><strong>Email:</strong> {member.email}</p>
                        <p><strong>Role:</strong> {member.role}</p>
                        {member._id === user.id && <span className="badge-you">You</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p>Not assigned to any team or team information not available</p>
            )}
          </div>
        )}
      </div>

      {showDetailsModal && selectedMaintenance && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Maintenance Details</h2>
            <div className="details-content">
              <p><strong>Equipment:</strong> {selectedMaintenance.equipment?.name}</p>
              <p><strong>Location:</strong> {selectedMaintenance.equipment?.location}</p>
              <p><strong>Issue Type:</strong> {selectedMaintenance.issueType}</p>
              <p><strong>Status:</strong> <span className={`status-badge status-${selectedMaintenance.status}`}>{selectedMaintenance.status}</span></p>
              <p><strong>Description:</strong> {selectedMaintenance.description || 'N/A'}</p>
              <p><strong>Reported by:</strong> {selectedMaintenance.reportedBy?.name} ({selectedMaintenance.reportedBy?.email})</p>
              {selectedMaintenance.scheduledDate && (
                <p><strong>Scheduled Date:</strong> {new Date(selectedMaintenance.scheduledDate).toLocaleString()}</p>
              )}
              <p><strong>Created:</strong> {new Date(selectedMaintenance.createdAt).toLocaleString()}</p>
            </div>
            <div className="modal-actions">
              {selectedMaintenance.status === 'SCHEDULED' && (
                <button
                  onClick={() => {
                    handleStartMaintenance(selectedMaintenance._id)
                    setShowDetailsModal(false)
                  }}
                  className="btn-primary"
                >
                  Start Maintenance
                </button>
              )}
              {selectedMaintenance.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => {
                    handleCompleteMaintenance(selectedMaintenance._id)
                    setShowDetailsModal(false)
                  }}
                  className="btn-success"
                >
                  Complete Maintenance
                </button>
              )}
              <button onClick={() => setShowDetailsModal(false)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TechnicianDashboard

