// Professional Toast Notification System for Content Genie
// Replaces all alert() calls with beautiful, non-blocking notifications

class ToastManager {
  static toastContainer = null
  static toastCount = 0

  // Initialize toast container
  static init() {
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div')
      this.toastContainer.id = 'toast-container'
      this.toastContainer.className = 'fixed top-6 right-6 z-[9999] space-y-3 pointer-events-none'
      this.toastContainer.style.maxWidth = '420px'
      document.body.appendChild(this.toastContainer)
    }
  }

  // Create toast element
  static createToast(type, title, message, actions = [], duration = 5000) {
    this.init()
    this.toastCount++

    const toastId = `toast-${this.toastCount}-${Date.now()}`
    const toast = document.createElement('div')
    toast.id = toastId
    toast.className = 'pointer-events-auto animate-slide-in'

    // Icon and color based on type
    const config = {
      success: {
        icon: '✅',
        gradient: 'from-green-500 to-emerald-600',
        border: 'border-green-500 dark:border-green-400'
      },
      error: {
        icon: '❌',
        gradient: 'from-red-500 to-rose-600',
        border: 'border-red-500 dark:border-red-400'
      },
      warning: {
        icon: '⚠️',
        gradient: 'from-yellow-500 to-orange-600',
        border: 'border-yellow-500 dark:border-yellow-400'
      },
      info: {
        icon: '💡',
        gradient: 'from-blue-500 to-indigo-600',
        border: 'border-blue-500 dark:border-blue-400'
      },
      loading: {
        icon: '⏳',
        gradient: 'from-gray-500 to-gray-600',
        border: 'border-gray-500 dark:border-gray-400'
      }
    }

    const { icon, gradient, border } = config[type] || config.info

    // Build actions HTML
    const actionsHTML = actions.length > 0
      ? `<div class="flex space-x-2 mt-3">
          ${actions.map(action => `
            <button 
              onclick="${action.onClick}" 
              class="px-4 py-2 ${action.primary ? `bg-gradient-to-r ${gradient}` : 'bg-gray-600 hover:bg-gray-700'} text-white rounded-2xl text-sm font-medium transition-all hover:shadow-lg"
            >
              ${action.label}
            </button>
          `).join('')}
        </div>`
      : ''

    toast.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-2 ${border} p-6 max-w-sm transition-all hover:shadow-3xl">
        <div class="flex items-start space-x-4">
          <div class="w-12 h-12 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
            <span class="text-2xl">${icon}</span>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-gray-900 dark:text-gray-100 text-lg mb-1 leading-tight">${title}</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">${message}</p>
            ${actionsHTML}
          </div>
          <button 
            onclick="document.getElementById('${toastId}').remove()" 
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    `

    this.toastContainer.appendChild(toast)

    // Auto-remove after duration (unless it's a loading toast)
    if (type !== 'loading' && duration > 0) {
      setTimeout(() => {
        this.removeToast(toastId)
      }, duration)
    }

    return toastId
  }

  // Remove toast with animation
  static removeToast(toastId) {
    const toast = document.getElementById(toastId)
    if (toast) {
      toast.style.opacity = '0'
      toast.style.transform = 'translateX(100%)'
      setTimeout(() => toast.remove(), 300)
    }
  }

  // Success toast
  static success(title, message, actions = [], duration = 5000) {
    return this.createToast('success', title, message, actions, duration)
  }

  // Error toast
  static error(title, message, actions = [], duration = 7000) {
    return this.createToast('error', title, message, actions, duration)
  }

  // Warning toast
  static warning(title, message, actions = [], duration = 6000) {
    return this.createToast('warning', title, message, actions, duration)
  }

  // Info toast
  static info(title, message, actions = [], duration = 5000) {
    return this.createToast('info', title, message, actions, duration)
  }

  // Loading toast (doesn't auto-dismiss)
  static loading(title, message) {
    return this.createToast('loading', title, message, [], 0)
  }

  // Update existing toast (useful for loading -> success/error)
  static update(toastId, type, title, message, actions = [], duration = 5000) {
    this.removeToast(toastId)
    return this.createToast(type, title, message, actions, duration)
  }

  // Clear all toasts
  static clearAll() {
    if (this.toastContainer) {
      this.toastContainer.innerHTML = ''
    }
  }

  // Specialized toasts for common scenarios
  static saveSuccess(itemName = 'Content') {
    return this.success(
      `${itemName} Saved!`,
      `Your ${itemName.toLowerCase()} has been saved successfully.`,
      [
        {
          label: 'View Library',
          onClick: "window.location.href='/dashboard'",
          primary: true
        },
        {
          label: 'Continue',
          onClick: `document.getElementById(arguments[0]).remove()`,
          primary: false
        }
      ],
      8000
    )
  }

  static copySuccess() {
    return this.success(
      'Copied!',
      'Content copied to clipboard.',
      [],
      2000
    )
  }

  static processingFile(fileType = 'file') {
    return this.loading(
      `Processing ${fileType}...`,
      'This may take a moment. Please wait.'
    )
  }

  static extractionSuccess(wordCount, additionalInfo = '') {
    return this.success(
      'Extraction Complete!',
      `Found ${wordCount} words.${additionalInfo}`,
      [],
      4000
    )
  }

  static validationError(field, requirement) {
    return this.warning(
      `Invalid ${field}`,
      requirement,
      [],
      4000
    )
  }

  static networkError() {
    return this.error(
      'Connection Error',
      'Failed to connect to server. Please check your connection and try again.',
      [
        {
          label: 'Retry',
          onClick: 'window.location.reload()',
          primary: true
        }
      ],
      0 // Don't auto-dismiss
    )
  }
}

export default ToastManager
