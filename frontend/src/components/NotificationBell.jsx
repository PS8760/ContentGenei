import { useState, useEffect, useRef } from 'react'
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  // Load notifications on mount and poll every 30 seconds
  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const loadNotifications = async () => {
    try {
      const response = await api.getNotifications()
      if (response.success) {
        setNotifications(response.notifications || [])
        setUnreadCount(response.unread_count || 0)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation()
    try {
      const response = await api.markNotificationRead(notificationId)
      if (response.success) {
        await loadNotifications()
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true)
      const response = await api.markAllNotificationsRead()
      if (response.success) {
        await loadNotifications()
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation()
    try {
      const response = await api.deleteNotification(notificationId)
      if (response.success) {
        await loadNotifications()
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all notifications?')) return
    
    try {
      setLoading(true)
      const response = await api.clearAllNotifications()
      if (response.success) {
        await loadNotifications()
      }
    } catch (error) {
      console.error('Failed to clear notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      await handleMarkAsRead(notification.id, { stopPropagation: () => {} })
    }

    // Navigate to link if provided
    if (notification.link) {
      setIsOpen(false)
      navigate(notification.link)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'team_invite':
        return '👥'
      case 'project_update':
        return '📋'
      case 'mention':
        return '💬'
      case 'system':
        return '🔔'
      default:
        return '📢'
    }
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({unreadCount} unread)
                </span>
              )}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading || unreadCount === 0}
                className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark all read</span>
              </button>
              <button
                onClick={handleClearAll}
                disabled={loading}
                className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear all</span>
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  No notifications yet
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 text-center mt-1">
                  We'll notify you when something happens
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <button
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              className="ml-2 p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          <button
                            onClick={(e) => handleDeleteNotification(notification.id, e)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={() => {
                  setIsOpen(false)
                  navigate('/notifications')
                }}
                className="w-full text-sm text-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
