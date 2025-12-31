import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './Dashboard.css'
import './AdminDashboard.css'

const localizer = momentLocalizer(moment)

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [maintenance, setMaintenance] = useState([])
  const [equipment, setEquipment] = useState([])
  const [teams, setTeams] = useState([])
  const [stats, setStats] = useState({
    equipment: {
      total: 0,
      active: 0,
      underMaintenance: 0,
      scrapped: 0
    },
    maintenance: {
      open: 0,
      scheduled: 0,
      inProgress: 0,
      completed: 0,
      corrective: 0,
      preventive: 0
    }
  })
  const [loading, setLoading] = useState(true)

  // Modal states
  const [showEquipmentModal, setShowEquipmentModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedMaintenance, setSelectedMaintenance] = useState(null)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [availableTechnicians, setAvailableTechnicians] = useState([])
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    serialNumber: '',
    location: '',
    description: '',
    teamId: ''
  })
  const [newTeamName, setNewTeamName] = useState('')
  const [selectedTechnician, setSelectedTechnician] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchMaintenance(),
        fetchEquipment(),
        fetchTeams()
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchMaintenance = async () => {
    try {
      const response = await axios.get('/api/maintenance')
      setMaintenance(response.data)
    } catch (error) {
      console.error('Error fetching maintenance:', error)
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

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/api/team')
      setTeams(response.data)
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const fetchAvailableTechnicians = async () => {
    try {
      const response = await axios.get('/api/team/available')
      setAvailableTechnicians(response.data)
    } catch (error) {
      console.error('Error fetching available technicians:', error)
      setAvailableTechnicians([])
    }
  }

  const handleCreateTeam = async (e) => {
    e.preventDefault()
    if (!newTeamName.trim()) {
      alert('Please enter a team name')
      return
    }
    try {
      await axios.post('/api/team', { name: newTeamName })
      alert('Team created successfully!')
      setShowTeamModal(false)
      setNewTeamName('')
      fetchTeams()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create team')
    }
  }

  const handleAssignTechnician = async (e) => {
    e.preventDefault()
    if (!selectedTechnician) {
      alert('Please select a technician')
      return
    }
    try {
      await axios.post('/api/team/assign', {
        userId: selectedTechnician,
        teamId: selectedTeam._id
      })
      alert('Technician assigned successfully!')
      setShowAssignModal(false)
      setSelectedTechnician('')
      setSelectedTeam(null)
      fetchTeams()
      fetchAvailableTechnicians()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to assign technician')
    }
  }

  const handleRemoveTechnician = async (userId) => {
    if (!userId) {
      alert('Invalid user ID')
      return
    }
    if (window.confirm('Are you sure you want to remove this technician from the team?')) {
      try {
        await axios.put(`/api/team/remove/${userId}`)
        alert('Technician removed successfully!')
        fetchTeams()
        fetchAvailableTechnicians()
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to remove technician')
      }
    }
  }

  const calculateStats = (equipmentData, maintenanceData) => {
    const eqData = equipmentData || equipment
    const maintData = maintenanceData || maintenance

    const totalEquipment = eqData.length
    const activeEquipment = eqData.filter(e => e.status === 'ACTIVE').length
    const underMaintenance = eqData.filter(e => e.status === 'UNDER_MAINTENANCE').length
    const scrapped = eqData.filter(e => e.status === 'SCRAPPED').length

    const openMaintenance = maintData.filter(m => m.status === 'OPEN').length
    const scheduledMaintenance = maintData.filter(m => m.status === 'SCHEDULED').length
    const inProgressMaintenance = maintData.filter(m => m.status === 'IN_PROGRESS').length
    const completedMaintenance = maintData.filter(m => m.status === 'COMPLETED').length
    const correctiveMaintenance = maintData.filter(m => m.issueType === 'CORRECTIVE').length
    const preventiveMaintenance = maintData.filter(m => m.issueType === 'PREVENTIVE').length

    setStats({
      equipment: {
        total: totalEquipment,
        active: activeEquipment,
        underMaintenance: underMaintenance,
        scrapped: scrapped
      },
      maintenance: {
        open: openMaintenance,
        scheduled: scheduledMaintenance,
        inProgress: inProgressMaintenance,
        completed: completedMaintenance,
        corrective: correctiveMaintenance,
        preventive: preventiveMaintenance
      }
    })
  }

  useEffect(() => {
    // Always calculate stats, even if arrays are empty (will show 0)
    calculateStats(equipment, maintenance)
  }, [equipment, maintenance])

  const handleCreateEquipment = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/equipment', newEquipment)
      alert('Equipment created successfully!')
      setShowEquipmentModal(false)
      setNewEquipment({ name: '', serialNumber: '', location: '', description: '', teamId: '' })
      fetchEquipment()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create equipment')
    }
  }

  const handleSchedule = async (e) => {
    e.preventDefault()
    try {
      await axios.put('/api/maintenance/schedule', {
        maintenanceId: selectedMaintenance._id,
        scheduledDate
      })
      alert('Maintenance scheduled successfully!')
      setShowScheduleModal(false)
      setSelectedMaintenance(null)
      setScheduledDate('')
      fetchMaintenance()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to schedule maintenance')
    }
  }

  const getKanbanColumns = () => {
    return {
      OPEN: maintenance.filter(m => m.status === 'OPEN'),
      SCHEDULED: maintenance.filter(m => m.status === 'SCHEDULED'),
      IN_PROGRESS: maintenance.filter(m => m.status === 'IN_PROGRESS'),
      COMPLETED: maintenance.filter(m => m.status === 'COMPLETED')
    }
  }

  const getCalendarEvents = () => {
    return maintenance
      .filter(m => m.scheduledDate && m.status !== 'COMPLETED')
      .map(m => ({
        title: `${m.equipment?.name} - ${m.issueType}`,
        start: new Date(m.scheduledDate),
        end: new Date(new Date(m.scheduledDate).getTime() + 60 * 60 * 1000),
        resource: m
      }))
  }

  const kanbanColumns = getKanbanColumns()

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.name}</span>
          <button onClick={logout} className="btn-logout">Logout</button>
        </div>
      </header>

      <div className="tabs">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={activeTab === 'kanban' ? 'active' : ''}
          onClick={() => setActiveTab('kanban')}
        >
          Kanban Board
        </button>
        <button
          className={activeTab === 'equipment' ? 'active' : ''}
          onClick={() => setActiveTab('equipment')}
        >
          Equipment
        </button>
        <button
          className={activeTab === 'calendar' ? 'active' : ''}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar
        </button>
        <button
          className={activeTab === 'teams' ? 'active' : ''}
          onClick={() => {
            setActiveTab('teams')
            fetchAvailableTechnicians()
          }}
        >
          Team Management
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'dashboard' && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Equipment</h3>
              <p className="stat-number">{stats.equipment.total}</p>
            </div>
            <div className="stat-card">
              <h3>Active Equipment</h3>
              <p className="stat-number">{stats.equipment.active}</p>
            </div>
            <div className="stat-card">
              <h3>Under Maintenance</h3>
              <p className="stat-number">{stats.equipment.underMaintenance}</p>
            </div>
            <div className="stat-card">
              <h3>Open Requests</h3>
              <p className="stat-number">{stats.maintenance.open}</p>
            </div>
            <div className="stat-card">
              <h3>Scheduled</h3>
              <p className="stat-number">{stats.maintenance.scheduled}</p>
            </div>
            <div className="stat-card">
              <h3>In Progress</h3>
              <p className="stat-number">{stats.maintenance.inProgress}</p>
            </div>
            <div className="stat-card">
              <h3>Completed</h3>
              <p className="stat-number">{stats.maintenance.completed}</p>
            </div>
            <div className="stat-card">
              <h3>Corrective</h3>
              <p className="stat-number">{stats.maintenance.corrective}</p>
            </div>
            <div className="stat-card">
              <h3>Preventive</h3>
              <p className="stat-number">{stats.maintenance.preventive}</p>
            </div>
          </div>
        )}

        {activeTab === 'kanban' && (
          <div className="kanban-board">
            {Object.entries(kanbanColumns).map(([status, items]) => (
              <div key={status} className="kanban-column">
                <h3>{status} ({items.length})</h3>
                <div className="kanban-items">
                  {items.map((item) => (
                    <div key={item._id} className="kanban-card">
                      <h4>{item.equipment?.name}</h4>
                      <p><strong>Type:</strong> {item.issueType}</p>
                      <p><strong>Team:</strong> {item.assignedTeam?.name}</p>
                      <p><strong>Reported by:</strong> {item.reportedBy?.name}</p>
                      {item.scheduledDate && (
                        <p><strong>Scheduled:</strong> {new Date(item.scheduledDate).toLocaleDateString()}</p>
                      )}
                      {status === 'OPEN' && (
                        <button
                          onClick={() => {
                            setSelectedMaintenance(item)
                            setShowScheduleModal(true)
                          }}
                          className="btn-primary btn-sm"
                        >
                          Schedule
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'equipment' && (
          <div>
            <button
              onClick={() => setShowEquipmentModal(true)}
              className="btn-primary"
              style={{ marginBottom: '1rem' }}
            >
              Add Equipment
            </button>
            <div className="equipment-grid">
              {equipment.map((eq) => (
                <div key={eq._id} className="equipment-card">
                  <h3>{eq.name}</h3>
                  <p><strong>Serial:</strong> {eq.serialNumber}</p>
                  <p><strong>Location:</strong> {eq.location}</p>
                  <p><strong>Status:</strong> <span className={`status-badge status-${eq.status}`}>{eq.status}</span></p>
                  <p><strong>Team:</strong> {eq.teamId?.name || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="calendar-container">
            <Calendar
              localizer={localizer}
              events={getCalendarEvents()}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
            />
          </div>
        )}

        {activeTab === 'teams' && (
          <div>
            <div className="team-management-header">
              <h2>Team Management</h2>
              <button
                onClick={() => setShowTeamModal(true)}
                className="btn-primary"
                style={{ 
                  background: 'white',
                  color: '#667eea',
                  fontWeight: '700',
                  padding: '0.9rem 2rem',
                  fontSize: '1rem',
                  boxShadow: '0 4px 15px rgba(255, 255, 255, 0.3)'
                }}
              >
                + Create New Team
              </button>
            </div>
            
            <div className="teams-grid">
              {teams.map((team) => (
                <div key={team._id} className="team-card-admin">
                  <div className="team-card-header">
                    <h3>{team.name}</h3>
                    <button
                      onClick={() => {
                        setSelectedTeam(team)
                        fetchAvailableTechnicians()
                        setShowAssignModal(true)
                      }}
                      className="btn-primary btn-sm"
                    >
                      Assign Technician
                    </button>
                  </div>
                  
                    <div className="team-members-section">
                    <h4>Team Members ({team.members?.length || 0})</h4>
                    {team.members && team.members.length > 0 ? (
                      <div className="team-members-list">
                        {team.members.map((member, idx) => {
                          const memberId = member._id || (typeof member === 'object' ? member.id : null)
                          return (
                            <div key={memberId || member.email || idx} className="team-member-item">
                              <div>
                                <strong>{member.name || 'Unknown'}</strong>
                                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{member.email || 'No email'}</p>
                              </div>
                              {memberId && (
                                <button
                                  onClick={() => handleRemoveTechnician(memberId)}
                                  className="btn-remove"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p style={{ color: '#666', fontStyle: 'italic' }}>No members assigned</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {teams.length === 0 && (
              <div className="empty-state">
                <p>No teams created yet. Create your first team!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showEquipmentModal && (
        <div className="modal-overlay" onClick={() => setShowEquipmentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Equipment</h2>
            <form onSubmit={handleCreateEquipment}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Serial Number *</label>
                <input
                  type="text"
                  value={newEquipment.serialNumber}
                  onChange={(e) => setNewEquipment({ ...newEquipment, serialNumber: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  value={newEquipment.location}
                  onChange={(e) => setNewEquipment({ ...newEquipment, location: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Team *</label>
                <select
                  value={newEquipment.teamId}
                  onChange={(e) => setNewEquipment({ ...newEquipment, teamId: e.target.value })}
                  required
                >
                  <option value="">Select team</option>
                  {teams.map(team => (
                    <option key={team._id} value={team._id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newEquipment.description}
                  onChange={(e) => setNewEquipment({ ...newEquipment, description: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEquipmentModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScheduleModal && selectedMaintenance && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Schedule Maintenance</h2>
            <p><strong>Equipment:</strong> {selectedMaintenance.equipment?.name}</p>
            <p><strong>Type:</strong> {selectedMaintenance.issueType}</p>
            <form onSubmit={handleSchedule}>
              <div className="form-group">
                <label>Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTeamModal && (
        <div className="modal-overlay" onClick={() => setShowTeamModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Team</h2>
            <form onSubmit={handleCreateTeam}>
              <div className="form-group">
                <label>Team Name *</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  required
                  placeholder="Enter team name"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowTeamModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Create Team</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && selectedTeam && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Assign Technician to {selectedTeam.name}</h2>
            <form onSubmit={handleAssignTechnician}>
              <div className="form-group">
                <label>Select Available Technician *</label>
                {availableTechnicians.length === 0 ? (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>No available technicians</p>
                ) : (
                  <select
                    value={selectedTechnician}
                    onChange={(e) => setSelectedTechnician(e.target.value)}
                    required
                  >
                    <option value="">Select technician</option>
                    {availableTechnicians.map(tech => (
                      <option key={tech._id} value={tech._id}>
                        {tech.name} ({tech.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={availableTechnicians.length === 0}>
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard

