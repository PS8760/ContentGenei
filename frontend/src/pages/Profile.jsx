import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { gsap } from 'gsap'
import { 
  User, MapPin, Briefcase, Edit2, Save, X, Check, AlertCircle,
  Linkedin, Twitter, Instagram, Youtube, TrendingUp, Clock, FileText,
  Target, Sparkles, Link as LinkIcon, Star, Trash2, MessageCircle, Users,
  Mail, Globe, Award, Zap, ChevronDown, ChevronUp, Settings, Brain,
  Lightbulb, BarChart3, Shield, Palette, Bell, Languages, BookOpen,
  Briefcase as BriefcaseIcon, GraduationCap, Building2, Hash
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import CloudAnimation from '../components/CloudAnimation'
import ParticlesBackground from '../components/ParticlesBackground'
import api from '../services/api'

const Profile = () => {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [profile, setProfile] = useState(null)
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    professional: false,
    content: false,
    skills: false,
    platforms: true,
    strategy: false,
    ai: false,
    collaboration: false,
    settings: false
  })

  const heroRef = useRef(null)
  const cardsRef = useRef([])

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await api.getProfile()
      if (response.success) {
        setProfile(response.profile)
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
      setMessage({ type: 'error', text: 'Failed to load profile' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await api.updateProfile(profile)
      if (response.success) {
        setProfile(response.profile)
        setIsEditing(false)
        setMessage({ type: 'success', text: '✨ Profile updated successfully!' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    loadProfile()
  }

  const updateField = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const updateNestedField = (parent, field, value) => {
    setProfile(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }))
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const addToArray = (field, value) => {
    if (value.trim() && !profile[field]?.includes(value.trim())) {
      setProfile(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), value.trim()]
      }))
    }
  }

  const removeFromArray = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== value)
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <CloudAnimation />
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-black dark:border-t-indigo-400 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">Loading your profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Header />
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Failed to load profile</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      <Header />
      <CloudAnimation />
      <ParticlesBackground />

      <main className="pt-24 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Message Toast */}
          {message.text && (
            <div className={`mb-6 p-5 rounded-2xl flex items-center space-x-4 animate-fadeIn shadow-xl border-2 backdrop-blur-sm ${
              message.type === 'success' ? 'bg-gray-50 dark:bg-green-900/30 border-gray-900 dark:border-green-700 text-gray-900 dark:text-green-300' :
              'bg-gray-50 dark:bg-red-900/30 border-gray-900 dark:border-red-700 text-gray-900 dark:text-red-300'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                message.type === 'success' ? 'bg-gray-900 dark:bg-green-600' : 'bg-gray-900 dark:bg-red-600'
              }`}>
                {message.type === 'success' ? <Check className="w-6 h-6 text-white" /> : <AlertCircle className="w-6 h-6 text-white" />}
              </div>
              <span className="font-semibold text-lg flex-1">{message.text}</span>
            </div>
          )}

          {/* Hero Section */}
          <div ref={heroRef} className="mb-8">
            <div className="relative bg-gradient-to-r from-gray-900 via-black to-gray-900 dark:from-indigo-700 dark:via-purple-700 dark:to-pink-700 rounded-3xl p-8 mb-6 overflow-hidden shadow-2xl">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '40px 40px'
                }}></div>
              </div>
              
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 text-center md:text-left">
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-gray-600 to-gray-800 dark:from-pink-600 dark:to-purple-600 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                      <div className="relative w-28 h-28 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center border-4 border-white/40 shadow-2xl">
                        <span className="text-white text-4xl font-bold">
                          {profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                        </span>
                      </div>
                      <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-400 border-4 border-white rounded-full shadow-lg"></div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
                        <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">{profile.full_name || 'User'}</h1>
                        <Award className="w-6 h-6 text-yellow-300" />
                      </div>
                      <p className="text-gray-200 dark:text-indigo-100 text-xl font-semibold mb-3 flex items-center justify-center md:justify-start space-x-2">
                        <Briefcase className="w-5 h-5" />
                        <span>{profile.professional_title || 'Professional'}</span>
                      </p>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-white/90">
                        {profile.location && (
                          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm font-medium">{profile.location}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                          <Mail className="w-4 h-4" />
                          <span className="text-sm font-medium">{profile.email}</span>
                        </div>
                        {profile.profile_completion_percentage !== undefined && (
                          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                            <Star className="w-4 h-4" />
                            <span className="text-sm font-medium">{profile.profile_completion_percentage}% Complete</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="group flex items-center space-x-2 px-8 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-2xl transition-all border-2 border-white/40 hover:border-white/60 shadow-xl hover:shadow-2xl hover:scale-105 transform duration-300"
                    >
                      <Edit2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      <span className="font-bold">Edit Profile</span>
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center space-x-2 px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl transition-all disabled:opacity-50 shadow-xl hover:shadow-2xl hover:scale-105 transform duration-300 font-bold"
                      >
                        <Save className="w-5 h-5" />
                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center space-x-2 px-8 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-2xl transition-all border-2 border-white/40 shadow-xl hover:shadow-2xl hover:scale-105 transform duration-300 font-bold"
                      >
                        <X className="w-5 h-5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Basic Information Section */}
            <CollapsibleSection
              title="Basic Information"
              icon={User}
              isExpanded={expandedSections.basic}
              onToggle={() => toggleSection('basic')}
              color="from-gray-800 to-black dark:from-indigo-500 dark:to-purple-600"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <InputField
                  label="Full Name"
                  value={profile.full_name || ''}
                  onChange={(e) => updateField('full_name', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Your full name"
                />
                <InputField
                  label="Professional Title"
                  value={profile.professional_title || ''}
                  onChange={(e) => updateField('professional_title', e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., Full Stack Developer"
                />
                <SelectField
                  label="Category"
                  value={profile.category || 'professional'}
                  onChange={(e) => updateField('category', e.target.value)}
                  disabled={!isEditing}
                  options={[
                    { value: 'student', label: 'Student' },
                    { value: 'professional', label: 'Professional' },
                    { value: 'freelancer', label: 'Freelancer' },
                    { value: 'entrepreneur', label: 'Entrepreneur' },
                    { value: 'creator', label: 'Content Creator' }
                  ]}
                />
                <InputField
                  label="Location"
                  value={profile.location || ''}
                  onChange={(e) => updateField('location', e.target.value)}
                  disabled={!isEditing}
                  placeholder="City, Country"
                />
                <InputField
                  label="Tagline"
                  value={profile.tagline || ''}
                  onChange={(e) => updateField('tagline', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Your professional tagline"
                  className="md:col-span-2"
                />
                <TextAreaField
                  label="Bio"
                  value={profile.bio || ''}
                  onChange={(e) => updateField('bio', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Tell your professional story..."
                  rows={4}
                  className="md:col-span-2"
                />
              </div>
            </CollapsibleSection>

            {/* Professional Details Section */}
            <CollapsibleSection
              title="Professional Details"
              icon={BriefcaseIcon}
              isExpanded={expandedSections.professional}
              onToggle={() => toggleSection('professional')}
              color="from-gray-700 to-gray-900 dark:from-purple-500 dark:to-pink-600"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <InputField
                  label="Company"
                  value={profile.company || ''}
                  onChange={(e) => updateField('company', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Current company"
                />
                <InputField
                  label="Current Role"
                  value={profile.current_role || ''}
                  onChange={(e) => updateField('current_role', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Your current role"
                />
                <InputField
                  label="Industry"
                  value={profile.industry || ''}
                  onChange={(e) => updateField('industry', e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., Technology, Marketing"
                />
                <InputField
                  label="Years of Experience"
                  type="number"
                  value={profile.years_of_experience || 0}
                  onChange={(e) => updateField('years_of_experience', parseInt(e.target.value) || 0)}
                  disabled={!isEditing}
                />
                <SelectField
                  label="Education Level"
                  value={profile.education_level || ''}
                  onChange={(e) => updateField('education_level', e.target.value)}
                  disabled={!isEditing}
                  options={[
                    { value: '', label: 'Select...' },
                    { value: 'high_school', label: 'High School' },
                    { value: 'bachelors', label: 'Bachelor\'s Degree' },
                    { value: 'masters', label: 'Master\'s Degree' },
                    { value: 'phd', label: 'PhD' },
                    { value: 'self_taught', label: 'Self-Taught' }
                  ]}
                />
                <InputField
                  label="Website"
                  value={profile.website || ''}
                  onChange={(e) => updateField('website', e.target.value)}
                  disabled={!isEditing}
                  placeholder="https://yourwebsite.com"
                />
                <InputField
                  label="Phone"
                  value={profile.phone || ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  disabled={!isEditing}
                  placeholder="+1 234 567 8900"
                />
                <InputField
                  label="Timezone"
                  value={profile.timezone || 'UTC'}
                  onChange={(e) => updateField('timezone', e.target.value)}
                  disabled={!isEditing}
                  placeholder="UTC"
                />
              </div>
            </CollapsibleSection>

            {/* Content Preferences Section */}
            <CollapsibleSection
              title="Content Preferences"
              icon={FileText}
              isExpanded={expandedSections.content}
              onToggle={() => toggleSection('content')}
              color="from-gray-600 to-gray-800 dark:from-pink-500 dark:to-rose-600"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <SelectField
                  label="Content Tone"
                  value={profile.content_tone || 'professional'}
                  onChange={(e) => updateField('content_tone', e.target.value)}
                  disabled={!isEditing}
                  options={[
                    { value: 'casual', label: 'Casual' },
                    { value: 'professional', label: 'Professional' },
                    { value: 'friendly', label: 'Friendly' },
                    { value: 'authoritative', label: 'Authoritative' },
                    { value: 'humorous', label: 'Humorous' }
                  ]}
                />
                <InputField
                  label="Target Audience"
                  value={profile.target_audience || ''}
                  onChange={(e) => updateField('target_audience', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Who is your audience?"
                />
                <SelectField
                  label="Primary Goal"
                  value={profile.primary_goal || ''}
                  onChange={(e) => updateField('primary_goal', e.target.value)}
                  disabled={!isEditing}
                  options={[
                    { value: '', label: 'Select...' },
                    { value: 'grow_audience', label: 'Grow Audience' },
                    { value: 'generate_leads', label: 'Generate Leads' },
                    { value: 'build_brand', label: 'Build Brand' },
                    { value: 'educate', label: 'Educate' },
                    { value: 'entertain', label: 'Entertain' }
                  ]}
                />
                <SelectField
                  label="Posting Frequency"
                  value={profile.posting_frequency || 'weekly'}
                  onChange={(e) => updateField('posting_frequency', e.target.value)}
                  disabled={!isEditing}
                  options={[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'bi-weekly', label: 'Bi-Weekly' },
                    { value: 'monthly', label: 'Monthly' }
                  ]}
                />
                <TextAreaField
                  label="Brand Voice"
                  value={profile.brand_voice || ''}
                  onChange={(e) => updateField('brand_voice', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Describe your brand voice..."
                  rows={3}
                  className="md:col-span-2"
                />
                <TextAreaField
                  label="Unique Value Proposition"
                  value={profile.unique_value_proposition || ''}
                  onChange={(e) => updateField('unique_value_proposition', e.target.value)}
                  disabled={!isEditing}
                  placeholder="What makes you unique?"
                  rows={3}
                  className="md:col-span-2"
                />
              </div>
            </CollapsibleSection>

            {/* Skills & Expertise Section */}
            <CollapsibleSection
              title="Skills & Expertise"
              icon={Sparkles}
              isExpanded={expandedSections.skills}
              onToggle={() => toggleSection('skills')}
              color="from-gray-500 to-gray-700 dark:from-yellow-500 dark:to-orange-600"
            >
              <TagArrayField
                label="Skills"
                items={profile.skills || []}
                onAdd={(value) => addToArray('skills', value)}
                onRemove={(value) => removeFromArray('skills', value)}
                disabled={!isEditing}
                placeholder="Add a skill"
              />
              <TagArrayField
                label="Expertise Areas"
                items={profile.expertise_areas || []}
                onAdd={(value) => addToArray('expertise_areas', value)}
                onRemove={(value) => removeFromArray('expertise_areas', value)}
                disabled={!isEditing}
                placeholder="Add expertise area"
              />
              <TagArrayField
                label="Languages"
                items={profile.languages || ['English']}
                onAdd={(value) => addToArray('languages', value)}
                onRemove={(value) => removeFromArray('languages', value)}
                disabled={!isEditing}
                placeholder="Add language"
              />
              <TagArrayField
                label="Certifications"
                items={profile.certifications || []}
                onAdd={(value) => addToArray('certifications', value)}
                onRemove={(value) => removeFromArray('certifications', value)}
                disabled={!isEditing}
                placeholder="Add certification"
              />
              <TagArrayField
                label="Niche Tags"
                items={profile.niche_tags || []}
                onAdd={(value) => addToArray('niche_tags', value)}
                onRemove={(value) => removeFromArray('niche_tags', value)}
                disabled={!isEditing}
                placeholder="Add niche tag"
              />
            </CollapsibleSection>

            {/* Social Platforms Section */}
            <CollapsibleSection
              title="Social Platforms"
              icon={LinkIcon}
              isExpanded={expandedSections.platforms}
              onToggle={() => toggleSection('platforms')}
              color="from-gray-400 to-gray-600 dark:from-blue-500 dark:to-cyan-600"
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {['linkedin', 'twitter', 'instagram', 'youtube', 'facebook', 'tiktok', 'medium', 'substack'].map(platform => (
                  <div key={platform} className="glass-card rounded-2xl p-4 border-2 border-gray-300 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-900 dark:text-white capitalize">{platform}</span>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        profile.platforms?.[platform] 
                          ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
                      }`}>
                        {profile.platforms?.[platform] ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    <button
                      onClick={() => isEditing && updateNestedField('platforms', platform, !profile.platforms?.[platform])}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        profile.platforms?.[platform]
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-gray-900 dark:bg-indigo-600 hover:bg-black dark:hover:bg-indigo-700 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {profile.platforms?.[platform] ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* AI Preferences Section */}
            <CollapsibleSection
              title="AI Preferences"
              icon={Brain}
              isExpanded={expandedSections.ai}
              onToggle={() => toggleSection('ai')}
              color="from-gray-300 to-gray-500 dark:from-green-500 dark:to-teal-600"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <SelectField
                  label="Writing Style"
                  value={profile.ai_writing_style || 'balanced'}
                  onChange={(e) => updateField('ai_writing_style', e.target.value)}
                  disabled={!isEditing}
                  options={[
                    { value: 'creative', label: 'Creative' },
                    { value: 'balanced', label: 'Balanced' },
                    { value: 'factual', label: 'Factual' }
                  ]}
                />
                <SelectField
                  label="Content Length"
                  value={profile.ai_content_length || 'medium'}
                  onChange={(e) => updateField('ai_content_length', e.target.value)}
                  disabled={!isEditing}
                  options={[
                    { value: 'short', label: 'Short' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'long', label: 'Long' }
                  ]}
                />
                <SelectField
                  label="Personalization Level"
                  value={profile.ai_personalization_level || 'medium'}
                  onChange={(e) => updateField('ai_personalization_level', e.target.value)}
                  disabled={!isEditing}
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' }
                  ]}
                />
                <div className="space-y-3">
                  <CheckboxField
                    label="Use Emojis"
                    checked={profile.ai_use_emojis ?? true}
                    onChange={(e) => updateField('ai_use_emojis', e.target.checked)}
                    disabled={!isEditing}
                  />
                  <CheckboxField
                    label="Use Hashtags"
                    checked={profile.ai_use_hashtags ?? true}
                    onChange={(e) => updateField('ai_use_hashtags', e.target.checked)}
                    disabled={!isEditing}
                  />
                  <CheckboxField
                    label="Include Call-to-Action"
                    checked={profile.ai_include_cta ?? true}
                    onChange={(e) => updateField('ai_include_cta', e.target.checked)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Collaboration Section */}
            <CollapsibleSection
              title="Collaboration Settings"
              icon={Users}
              isExpanded={expandedSections.collaboration}
              onToggle={() => toggleSection('collaboration')}
              color="from-gray-200 to-gray-400 dark:from-violet-500 dark:to-purple-600"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <CheckboxField
                  label="Open to Collaboration"
                  checked={profile.open_to_collaboration ?? true}
                  onChange={(e) => updateField('open_to_collaboration', e.target.checked)}
                  disabled={!isEditing}
                />
                <InputField
                  label="Team Size"
                  type="number"
                  value={profile.team_size || 1}
                  onChange={(e) => updateField('team_size', parseInt(e.target.value) || 1)}
                  disabled={!isEditing}
                />
                <InputField
                  label="Management Style"
                  value={profile.management_style || ''}
                  onChange={(e) => updateField('management_style', e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., Collaborative, Directive"
                  className="md:col-span-2"
                />
                <TagArrayField
                  label="Collaboration Interests"
                  items={profile.collaboration_interests || []}
                  onAdd={(value) => addToArray('collaboration_interests', value)}
                  onRemove={(value) => removeFromArray('collaboration_interests', value)}
                  disabled={!isEditing}
                  placeholder="Add collaboration interest"
                  className="md:col-span-2"
                />
              </div>
            </CollapsibleSection>

            {/* Settings Section */}
            <CollapsibleSection
              title="Settings & Preferences"
              icon={Settings}
              isExpanded={expandedSections.settings}
              onToggle={() => toggleSection('settings')}
              color="from-gray-100 to-gray-300 dark:from-slate-500 dark:to-slate-700"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <SelectField
                  label="Language"
                  value={profile.language || 'en'}
                  onChange={(e) => updateField('language', e.target.value)}
                  disabled={!isEditing}
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'es', label: 'Spanish' },
                    { value: 'fr', label: 'French' },
                    { value: 'de', label: 'German' },
                    { value: 'zh', label: 'Chinese' }
                  ]}
                />
                <SelectField
                  label="Theme Preference"
                  value={profile.theme_preference || 'system'}
                  onChange={(e) => updateField('theme_preference', e.target.value)}
                  disabled={!isEditing}
                  options={[
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'system', label: 'System' }
                  ]}
                />
                <InputField
                  label="Profile Color"
                  type="color"
                  value={profile.profile_color || '#6366f1'}
                  onChange={(e) => updateField('profile_color', e.target.value)}
                  disabled={!isEditing}
                />
                <div className="md:col-span-2">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Notification Preferences</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {Object.keys(profile.notification_preferences || {}).map(key => (
                      <CheckboxField
                        key={key}
                        label={key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        checked={profile.notification_preferences?.[key] ?? true}
                        onChange={(e) => updateNestedField('notification_preferences', key, e.target.checked)}
                        disabled={!isEditing}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          </div>

          {/* Stats Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-3">
              <BarChart3 className="w-6 h-6 text-gray-900 dark:text-indigo-400" />
              <span>Your Stats</span>
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <StatCard
                icon={FileText}
                label="Content Generated"
                value={profile.total_content_generated || 0}
                color="from-indigo-500 to-indigo-600"
              />
              <StatCard
                icon={Users}
                label="Projects"
                value={profile.total_projects || 0}
                color="from-purple-500 to-purple-600"
              />
              <StatCard
                icon={MessageCircle}
                label="Collaborations"
                value={profile.total_collaborations || 0}
                color="from-pink-500 to-pink-600"
              />
              <StatCard
                icon={TrendingUp}
                label="Profile Complete"
                value={`${profile.profile_completion_percentage || 0}%`}
                color="from-green-500 to-green-600"
              />
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}

// Helper Components
const CollapsibleSection = ({ title, icon: Icon, isExpanded, onToggle, color, children }) => (
  <div className="mb-6">
    <button
      onClick={onToggle}
      className="w-full glass-card rounded-2xl p-6 border-2 border-gray-300 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-600 transition-all shadow-xl flex items-center justify-between"
    >
      <div className="flex items-center space-x-3">
        <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {isExpanded ? <ChevronUp className="w-6 h-6 text-gray-900 dark:text-white" /> : <ChevronDown className="w-6 h-6 text-gray-900 dark:text-white" />}
    </button>
    {isExpanded && (
      <div className="mt-4 glass-card rounded-2xl p-6 border-2 border-gray-300 dark:border-slate-700 shadow-xl">
        {children}
      </div>
    )}
  </div>
)

const InputField = ({ label, value, onChange, disabled, placeholder, type = 'text', className = '' }) => (
  <div className={className}>
    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-indigo-500 focus:border-transparent disabled:opacity-70 transition-all"
    />
  </div>
)

const TextAreaField = ({ label, value, onChange, disabled, placeholder, rows = 3, className = '' }) => (
  <div className={className}>
    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{label}</label>
    <textarea
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-indigo-500 focus:border-transparent disabled:opacity-70 resize-none transition-all"
    />
  </div>
)

const SelectField = ({ label, value, onChange, disabled, options, className = '' }) => (
  <div className={className}>
    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{label}</label>
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-indigo-500 focus:border-transparent disabled:opacity-70 transition-all"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
)

const CheckboxField = ({ label, checked, onChange, disabled }) => (
  <label className="flex items-center space-x-3 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-indigo-600 focus:ring-2 focus:ring-gray-900 dark:focus:ring-indigo-500 disabled:opacity-50"
    />
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
  </label>
)

const TagArrayField = ({ label, items, onAdd, onRemove, disabled, placeholder, className = '' }) => {
  const [inputValue, setInputValue] = useState('')
  
  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue)
      setInputValue('')
    }
  }

  return (
    <div className={`mb-6 ${className}`}>
      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">{label}</label>
      <div className="flex flex-wrap gap-2 mb-3">
        {items.map((item, index) => (
          <span
            key={index}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-indigo-900/50 border-2 border-gray-800 dark:border-indigo-700 text-gray-900 dark:text-indigo-200 rounded-xl text-sm font-semibold"
          >
            <span>{item}</span>
            {!disabled && (
              <button
                onClick={() => onRemove(item)}
                className="hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </span>
        ))}
      </div>
      {!disabled && (
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={placeholder}
            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-gradient-to-r from-gray-800 to-black dark:from-indigo-600 dark:to-purple-600 hover:from-gray-900 hover:to-gray-800 dark:hover:from-indigo-700 dark:hover:to-purple-700 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105 transform duration-300"
          >
            Add
          </button>
        </div>
      )}
    </div>
  )
}

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="glass-card rounded-2xl p-6 border-2 border-gray-300 dark:border-slate-700 shadow-xl">
    <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-4`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
    <div className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</div>
  </div>
)

export default Profile
