import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import ParticlesBackground from '../components/ParticlesBackground'
import FloatingEmojis from '../components/FloatingEmojis'
import Header from '../components/Header'
import Footer from '../components/Footer'

const AboutUs = () => {
  const titleRef = useRef(null)
  const missionRef = useRef(null)
  const visionRef = useRef(null)
  const teamRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 })
    
    tl.fromTo(titleRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
    )
    .fromTo([missionRef.current, visionRef.current],
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "power3.out" },
      "-=0.5"
    )
    .fromTo(teamRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
      "-=0.3"
    )
  }, [])

  const teamMembers = [
    {
      name: 'Pranav Ghodke',
      role: 'Full Stack Developer & Project Lead',
      initials: 'PG',
      color: 'from-blue-500 to-blue-600'
    },
    {
      name: 'Tanushree Pabale',
      role: 'Backend Developer & AI Specialist',
      initials: 'TP',
      color: 'from-purple-500 to-purple-600'
    },
    {
      name: 'Sakshi Pandey',
      role: 'Frontend Developer & UI/UX Designer',
      initials: 'SP',
      color: 'from-pink-500 to-pink-600'
    },
    {
      name: 'Kajol Khatri',
      role: 'Quality Assurance & Testing Lead',
      initials: 'KK',
      color: 'from-green-500 to-green-600'
    }
  ]

  return (
    <div className="min-h-screen theme-transition relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <ParticlesBackground />
      <FloatingEmojis />
      
      <Header />

      <main className="pt-24 pb-12 relative z-10 content-layer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title Section */}
          <div ref={titleRef} className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
              About <span className="gradient-text">ContentGenie</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              ContentGenie is a revolutionary platform that bridges the gap between content creators and AI technology. 
              Our mission is to make professional content creation accessible to every creator through cutting-edge AI.
            </p>
          </div>

          {/* Mission & Vision Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            {/* Mission Card */}
            <div ref={missionRef} className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <span className="text-4xl">🚀</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
                Our Mission
              </h2>
              <p className="text-gray-700 dark:text-gray-300 text-center leading-relaxed">
                To democratize access to AI-powered content creation tools and ensure no creator misses out on the benefits of advanced technology. We empower creators to produce high-quality content efficiently.
              </p>
            </div>

            {/* Vision Card */}
            <div ref={visionRef} className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <span className="text-4xl">👁️</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
                Our Vision
              </h2>
              <p className="text-gray-700 dark:text-gray-300 text-center leading-relaxed">
                A digitally empowered world where every creator can easily discover and access AI-powered tools tailored to their needs, enabling them to focus on creativity rather than repetitive tasks.
              </p>
            </div>
          </div>

          {/* Team Section */}
          <div ref={teamRef} className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
                Meet Our Team
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                The passionate individuals behind ContentGenie
              </p>
            </div>

            {/* Team Members Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-200 dark:border-gray-700"
                >
                  {/* Avatar */}
                  <div className="flex justify-center mb-6">
                    <div className={`w-24 h-24 bg-gradient-to-br ${member.color} rounded-full flex items-center justify-center shadow-lg`}>
                      <span className="text-3xl font-bold text-white">
                        {member.initials}
                      </span>
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                    {member.name}
                  </h3>

                  {/* Role */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed">
                    {member.role}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Values Section */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white text-center mb-6">
              Our Values
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 text-center max-w-4xl mx-auto leading-relaxed">
              Transparency, Accessibility, Innovation, and Creator-first approach drive everything we do. 
              We believe in building tools that empower creators while maintaining the highest standards of quality and ethics.
            </p>

            {/* Value Pills */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <span className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-semibold shadow-lg">
                🔍 Transparency
              </span>
              <span className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full font-semibold shadow-lg">
                ♿ Accessibility
              </span>
              <span className="px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-full font-semibold shadow-lg">
                💡 Innovation
              </span>
              <span className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-semibold shadow-lg">
                👥 Creator-First
              </span>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid md:grid-cols-4 gap-6 mt-16">
            <div className="text-center">
              <div className="text-4xl font-extrabold gradient-text mb-2">10K+</div>
              <div className="text-gray-700 dark:text-gray-300">Creators Empowered</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold gradient-text mb-2">1M+</div>
              <div className="text-gray-700 dark:text-gray-300">Content Generated</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold gradient-text mb-2">99.5%</div>
              <div className="text-gray-700 dark:text-gray-300">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold gradient-text mb-2">24/7</div>
              <div className="text-gray-700 dark:text-gray-300">Support</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default AboutUs
