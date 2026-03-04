import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  Users, FileText, FolderKanban, Activity, Shield, TrendingUp,
  UserCheck, UserX, Crown, Ban, Trash2, Search, RefreshCw
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ParticlesBackground from '../components/ParticlesBackground'
import api from '../services/api'

const AdminDashboard = () => {
  const { currentUser, backendUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])
  const [recentContent, setRecentContent] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    // Check if user is admin
    if (backendUser && !backendUser.is_admin) {
      alert('⚠️ Admin access required')
      navigate('/dashboard')
      return
    }

    if (backendUser && backendUser.is_admin) {
      loadData()
    }
  }, [backendUser, navigate])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load dashboard stats
      const statsRes = await api.getAdminDashboardStats()
      if (statsRes.success) {
        setStats(statsRes.stats)
      }

      // Load users
      const usersRes = await api.getAdminUsers(currentPage, 20, searchQuery)
      if (usersRes.success) {
        setUsers(usersRes.users)
        setPagination(usersRes.pagination)
      }

      // Load projects
      const projectsRes = await api.getAdminProjects()
      if (projectsRes.success) {
        setProjects(projectsRes.projects)
      }

      // Load recent content
      const contentRes = await api.getAdminRecentContent(20)
      if (contentRes.success) {
        setRecentContent(contentRes.content)
      }

      // Load activity logs
      const logsRes = await api.getAdminActivityLogs(50)
      if (logsRes.success) {
        setActivityLogs(logsRes.logs)
      }

    } catch (error) {
      console.error('Error loading admin data:', error)
      alert('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAdmin = async (userId) => {
    if (!confirm('Toggle admin status for this user?')) return
    
    try {
      const response = await api.toggleAdminStatus(userId)
      if (response.success) {
        alert(response.message)
        loadData()
      }
    } catch (error) {
      alert('Failed to toggle admin status')
    }
  }

  const handleTogglePremium = async (userId) => {
    if (!confirm('Toggle premium status for this user?')) return
    
    try {
      const response = await api.togglePremiumStatus(userId)
      if (response.success) {
        alert(response.message)
        loadData()
      }
    } catch (error) {
      alert('Failed to toggle premium status')
    }
  }

  const handleToggleActive = async (userId) => {
    if (!confirm('Toggle active status for this user?')) return
    
    try {
      const response = await api.toggleActiveStatus(userId)
      if (response.success) {
        alert(response.message)
        loadData()
      }
    } catch (error) {
      alert('Failed to toggle active status')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('⚠️ Are you sure you want to delete this user? This action cannot be undone!')) return
    
    try {
      const response = await api.deleteUser(userId)
      if (response.success) {
        alert(response.message)
        loadData()
      }
    } catch (error) {
      alert('Failed to delete user')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 theme-transition">
        <ParticlesBackground />
        <Header />
        <div className="pt-24 flex items-center justify-center min-h-screen relative z-10">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-900 dark:text-white theme-transition">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 theme-transition">
      <ParticlesBackground />
      <Header />
      
      <main className="pt-24 pb-12 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center space-x-3 theme-transition">
                  <Shield className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
                  <span>Admin Dashboard</span>
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 theme-transition">Manage users, content, and platform settings</p>
              </div>
              <button
                onClick={loadData}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all flex items-center space-x-2 shadow-lg"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="glass-card bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-2xl p-6 text-white shadow-xl">
                <Users className="w-8 h-8 mb-3 opacity-90" />
                <div className="text-3xl font-bold mb-1">{stats.users.total}</div>
                <div className="text-sm opacity-90">Total Users</div>
                <div className="text-xs opacity-75 mt-2">+{stats.users.new_30d} this month</div>
              </div>
              
              <div className="glass-card bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-2xl p-6 text-white shadow-xl">
                <FileText className="w-8 h-8 mb-3 opacity-90" />
                <div className="text-3xl font-bold mb-1">{stats.content.total_generated}</div>
                <div className="text-sm opacity-90">Content Generated</div>
                <div className="text-xs opacity-75 mt-2">{stats.content.generated_30d} this month</div>
              </div>
              
              <div className="glass-card bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-2xl p-6 text-white shadow-xl">
                <FolderKanban className="w-8 h-8 mb-3 opacity-90" />
                <div className="text-3xl font-bold mb-1">{stats.teams.total_projects}</div>
                <div className="text-sm opacity-90">Total Projects</div>
                <div className="text-xs opacity-75 mt-2">{stats.teams.active_projects} active</div>
              </div>
              
              <div className="glass-card bg-gradient-to-br from-pink-500 to-pink-600 dark:from-pink-600 dark:to-pink-700 rounded-2xl p-6 text-white shadow-xl">
                <TrendingUp className="w-8 h-8 mb-3 opacity-90" />
                <div className="text-3xl font-bold mb-1">{stats.users.premium}</div>
                <div className="text-sm opacity-90">Premium Users</div>
                <div className="text-xs opacity-75 mt-2">{stats.users.admin} admins</div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex space-x-2 mb-6 glass-card bg-white/80 dark:bg-slate-800/80 rounded-xl p-2 shadow-lg theme-transition">
            {['overview', 'users', 'projects', 'content', 'logs'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 theme-transition'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="glass-card bg-white/90 dark:bg-slate-800/90 rounded-2xl p-6 shadow-xl theme-transition">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white theme-transition">User Management</h2>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && loadData()}
                      placeholder="Search users..."
                      className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 theme-transition"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium theme-transition">User</th>
                      <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium theme-transition">Email</th>
                      <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium theme-transition">Status</th>
                      <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium theme-transition">Roles</th>
                      <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium theme-transition">Joined</th>
                      <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium theme-transition">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 theme-transition">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900 dark:text-white theme-transition">{user.display_name || 'No name'}</div>
                        </td>
                        <td className="py-4 px-4 text-gray-700 dark:text-gray-300 theme-transition">{user.email}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.is_active
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700'
                          } theme-transition`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            {user.is_admin && (
                              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-700 rounded text-xs theme-transition">
                                Admin
                              </span>
                            )}
                            {user.is_premium && (
                              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700 rounded text-xs theme-transition">
                                Premium
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400 text-sm theme-transition">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleToggleAdmin(user.id)}
                              className="p-2 hover:bg-purple-100 dark:hover:bg-purple-600 rounded-lg transition-colors"
                              title="Toggle Admin"
                            >
                              <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </button>
                            <button
                              onClick={() => handleTogglePremium(user.id)}
                              className="p-2 hover:bg-yellow-100 dark:hover:bg-yellow-600 rounded-lg transition-colors"
                              title="Toggle Premium"
                            >
                              <Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(user.id)}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-600 rounded-lg transition-colors"
                              title="Toggle Active"
                            >
                              <Ban className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 hover:bg-red-200 dark:hover:bg-red-700 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4 text-red-700 dark:text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex justify-center space-x-2 mt-6">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => {
                        setCurrentPage(page)
                        loadData()
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 theme-transition'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="glass-card bg-white/90 dark:bg-slate-800/90 rounded-2xl p-6 shadow-xl theme-transition">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 theme-transition">Project Management</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(project => (
                  <div key={project.id} className="glass-card bg-gray-50 dark:bg-slate-700 rounded-xl p-4 border border-gray-200 dark:border-slate-600 shadow-md theme-transition">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 theme-transition">{project.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 theme-transition">Owner: {project.owner_email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-3 theme-transition">
                      {project.members?.length || 0} members • Created {new Date(project.created_at).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => {
                        if (confirm('Delete this project?')) {
                          api.deleteAdminProject(project.id).then(() => loadData())
                        }
                      }}
                      className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-all shadow-md"
                    >
                      Delete Project
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="glass-card bg-white/90 dark:bg-slate-800/90 rounded-2xl p-6 shadow-xl theme-transition">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 theme-transition">Recent Content</h2>
              <div className="space-y-3">
                {recentContent.map(content => (
                  <div key={content.id} className="glass-card bg-gray-50 dark:bg-slate-700 rounded-xl p-4 border border-gray-200 dark:border-slate-600 shadow-md theme-transition">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-700 rounded text-xs theme-transition">
                          {content.content_type}
                        </span>
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 theme-transition">by {content.user_email}</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-500 theme-transition">
                        {new Date(content.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 theme-transition">{content.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Logs Tab */}
          {activeTab === 'logs' && (
            <div className="glass-card bg-white/90 dark:bg-slate-800/90 rounded-2xl p-6 shadow-xl theme-transition">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 theme-transition">Activity Logs</h2>
              <div className="space-y-2">
                {activityLogs.map((log, index) => (
                  <div key={index} className="flex items-center justify-between py-3 px-4 glass-card bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 shadow-sm theme-transition">
                    <div className="flex items-center space-x-3">
                      <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <div>
                        <p className="text-gray-900 dark:text-white text-sm theme-transition">{log.description}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-500 theme-transition">{log.user_email}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 theme-transition">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  )
}

export default AdminDashboard
