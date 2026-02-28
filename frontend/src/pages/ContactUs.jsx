import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import ParticlesBackground from '../components/ParticlesBackground'
import FloatingEmojis from '../components/FloatingEmojis'
import Header from '../components/Header'
import Footer from '../components/Footer'
import emailjs from '@emailjs/browser'

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    issueType: 'bug'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)
  
  const titleRef = useRef(null)
  const formRef = useRef(null)
  const infoRef = useRef(null)

  // Initialize EmailJS on component mount
  useEffect(() => {
    emailjs.init('xYGTl9rCfD87MwImk')
  }, [])

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 })
    
    tl.fromTo(titleRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
    )
    .fromTo([formRef.current, infoRef.current],
      { y: 80, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 1.2, stagger: 0.2, ease: "back.out(1.1)" },
      "-=0.5"
    )
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setSubmitStatus({ type: 'error', message: '⚠️ Please fill in all required fields.' })
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setSubmitStatus({ type: 'error', message: '⚠️ Please enter a valid email address.' })
      return
    }

    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      // Create a form element to use with sendForm
      const form = document.createElement('form')
      
      // Add all form fields as hidden inputs
      // IMPORTANT: 'email' is used for To Email in template settings
      const fields = {
        email: 'spranav0812@gmail.com', // This goes to "To Email" field
        from_name: formData.name,
        from_email: formData.email,
        reply_to: formData.email,
        subject: formData.subject,
        issue_type: formData.issueType,
        message: formData.message
      }
      
      Object.keys(fields).forEach(key => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = fields[key]
        form.appendChild(input)
      })
      
      document.body.appendChild(form)

      // Send using sendForm method
      const response = await emailjs.sendForm(
        'service_8yub23k',
        'template_m4v462k',
        form,
        'xYGTl9rCfD87MwImk'
      )

      // Remove the temporary form
      document.body.removeChild(form)

      console.log('Email sent successfully:', response)

      setSubmitStatus({ 
        type: 'success', 
        message: '✅ Thank you! Your message has been sent successfully. We\'ll get back to you soon!' 
      })
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        issueType: 'bug'
      })
    } catch (error) {
      console.error('Error sending email:', error)
      console.error('Error details:', {
        status: error.status,
        text: error.text,
        message: error.message
      })
      setSubmitStatus({ 
        type: 'error', 
        message: `❌ Failed to send message: ${error.text || error.message || 'Unknown error'}. Please try again or email us directly at spranav0812@gmail.com` 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const issueTypes = [
    { value: 'bug', label: '🐛 Bug Report', icon: '🐛' },
    { value: 'feature', label: '💡 Feature Request', icon: '💡' },
    { value: 'support', label: '🆘 Technical Support', icon: '🆘' },
    { value: 'feedback', label: '💬 General Feedback', icon: '💬' },
    { value: 'other', label: '📝 Other', icon: '📝' }
  ]

  const contactInfo = [
    {
      icon: '📧',
      title: 'Email',
      value: 'spranav0812@gmail.com',
      link: 'mailto:spranav0812@gmail.com'
    },
    {
      icon: '⏰',
      title: 'Response Time',
      value: 'Within 24-48 hours',
      link: null
    },
    {
      icon: '🌍',
      title: 'Location',
      value: 'India',
      link: null
    }
  ]

  return (
    <div className="min-h-screen theme-transition relative">
      <ParticlesBackground />
      <FloatingEmojis />
      
      <Header />

      <main className="pt-24 pb-12 relative z-10 content-layer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title Section */}
          <div ref={titleRef} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
               <span className="gradient-text">Contact Us</span>
            </h1>
            <p className="text-gray-700 dark:text-blue-200 text-lg font-normal max-w-2xl mx-auto theme-transition">
              Have a question or facing an issue? We're here to help! Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div ref={formRef} className="lg:col-span-2 glass-card rounded-2xl p-8 theme-transition">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 dark:from-blue-500 dark:to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📬</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 theme-transition">
                  Send us a Message
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-2 theme-transition">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="form-input w-full p-3 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-2 theme-transition">
                    Your Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="form-input w-full p-3 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    required
                  />
                </div>

                {/* Issue Type */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-3 theme-transition">
                    Issue Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {issueTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, issueType: type.value })}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                          formData.issueType === type.value
                            ? 'border-gray-700 bg-gray-100 dark:border-blue-600 dark:bg-blue-900/30'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-600 dark:hover:border-blue-400'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{type.icon}</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {type.label.replace(/^[^\s]+\s/, '')}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-2 theme-transition">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Brief description of your issue"
                    className="form-input w-full p-3 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    required
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-200 mb-2 theme-transition">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Please describe your issue in detail..."
                    rows="6"
                    className="form-input w-full p-3 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                    required
                  />
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {formData.message.length} characters
                  </div>
                </div>

                {/* Submit Status */}
                {submitStatus && (
                  <div className={`p-4 rounded-xl border-2 ${
                    submitStatus.type === 'success' 
                      ? 'bg-gray-50 border-gray-400 dark:bg-green-900/20 dark:border-green-800' 
                      : 'bg-gray-50 border-gray-400 dark:bg-red-900/20 dark:border-red-800'
                  }`}>
                    <p className={`text-sm font-medium ${
                      submitStatus.type === 'success' 
                        ? 'text-gray-900 dark:text-green-300' 
                        : 'text-gray-900 dark:text-red-300'
                    }`}>
                      {submitStatus.message}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Sending Message...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span>📤</span>
                      <span>Send Message</span>
                    </div>
                  )}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div ref={infoRef} className="space-y-6">
              {/* Contact Details */}
              <div className="glass-card rounded-2xl p-6 theme-transition">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 theme-transition">
                  Contact Information
                </h3>
                <div className="space-y-4">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">{info.icon}</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 theme-transition">
                          {info.title}
                        </div>
                        {info.link ? (
                          <a 
                            href={info.link}
                            className="text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-blue-400 transition-colors font-medium"
                          >
                            {info.value}
                          </a>
                        ) : (
                          <div className="text-gray-900 dark:text-gray-100 font-medium theme-transition">
                            {info.value}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ Quick Links */}
              <div className="glass-card rounded-2xl p-6 theme-transition">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 theme-transition">
                  Quick Help
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-blue-900/20 rounded-xl border border-gray-300 dark:border-blue-800">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm">
                      📚 Documentation
                    </h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      Check our guides and tutorials
                    </p>
                  </div>
                  <div className="p-3 bg-gray-100 dark:bg-green-900/20 rounded-xl border border-gray-300 dark:border-green-800">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm">
                      💡 Common Issues
                    </h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      Find solutions to frequent problems
                    </p>
                  </div>
                  <div className="p-3 bg-gray-200 dark:bg-purple-900/20 rounded-xl border border-gray-300 dark:border-purple-800">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm">
                      🎯 Feature Requests
                    </h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      Suggest new features and improvements
                    </p>
                  </div>
                </div>
              </div>

              {/* Support Hours */}
              <div className="glass-card rounded-2xl p-6 theme-transition">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 theme-transition">
                  Support Hours
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Monday - Friday</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">9 AM - 6 PM IST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Saturday</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">10 AM - 4 PM IST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Sunday</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Closed</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gray-100 dark:bg-blue-900/20 rounded-lg border border-gray-300 dark:border-blue-800">
                  <p className="text-xs text-gray-700 dark:text-blue-200">
                    💬 We typically respond within 24-48 hours. For urgent issues, please mention "URGENT" in your subject line.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default ContactUs
