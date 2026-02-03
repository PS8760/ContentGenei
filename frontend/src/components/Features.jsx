import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const Features = () => {
  const sectionRef = useRef(null)
  const cardsRef = useRef([])
  const ctaRef = useRef(null)

  const features = [
    {
      icon: '✏️',
      title: 'AI Content Creation',
      description: 'Generate articles, images and videos instantly with advanced AI technology that understands your brand voice'
    },
    {
      icon: '📱',
      title: 'Social Media Assistant',
      description: 'Plan, schedule & optimize posts for any platform with smart automation and performance insights'
    },
    {
      icon: '🎯',
      title: 'Personalized Campaigns',
      description: 'Create content tailored to your audience with precision targeting and behavioral analysis'
    },
    {
      icon: '📊',
      title: 'Insights & Optimization',
      description: 'Analyze performance and enhance reach with detailed analytics and actionable recommendations'
    }
  ]

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(cardsRef.current,
        { y: 120, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.2,
          stagger: 0.2,
          ease: "back.out(1.1)",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          }
        }
      )

      gsap.fromTo(ctaRef.current,
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 85%",
          }
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="features-gradient section-padding-lg theme-transition bg-transition">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 content-layer">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
          {features.map((feature, index) => (
            <div 
              key={index} 
              ref={el => cardsRef.current[index] = el}
              className="glass-card rounded-3xl p-8 lg:p-10 text-center feature-card group theme-transition"
            >
              <div className="w-18 h-18 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-105 transition-transform duration-300">
                <span className="text-3xl">{feature.icon}</span>
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight theme-transition">{feature.title}</h3>
              <p className="text-gray-900 dark:text-gray-300 leading-relaxed text-lg font-normal theme-transition">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div ref={ctaRef} className="text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-6 sm:space-y-0 sm:space-x-16 mb-16">
            <div className="flex items-center space-x-5">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center theme-transition">
                <span className="text-blue-600 dark:text-blue-400 text-2xl">👥</span>
              </div>
              <span className="text-gray-900 dark:text-gray-200 font-semibold text-xl theme-transition">Team Collaboration</span>
            </div>
            <div className="flex items-center space-x-5">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center theme-transition">
                <span className="text-indigo-600 dark:text-indigo-400 text-2xl">💼</span>
              </div>
              <span className="text-gray-900 dark:text-gray-200 font-semibold text-xl theme-transition">Business Solutions</span>
            </div>
          </div>
          
          <button className="btn-primary btn-ripple text-white px-12 py-5 rounded-2xl font-bold text-xl transition-all duration-75">
            Start Creating Today
          </button>
        </div>
      </div>
    </section>
  )
}

export default Features