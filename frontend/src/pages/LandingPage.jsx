import ParticlesBackground from '../components/ParticlesBackground'
import FloatingEmojis from '../components/FloatingEmojis'
import Header from '../components/Header'
import Hero from '../components/Hero'
import ContentCreator from '../components/ContentCreator'
import Features from '../components/Features'
import Footer from '../components/Footer'

const LandingPage = () => {
  return (
    <div className="min-h-screen theme-transition relative">
      <ParticlesBackground />
      <FloatingEmojis />
      <div className="relative z-10">
        <Header />
        <main>
          <Hero />
          <ContentCreator />
          <Features />
        </main>
        <Footer />
      </div>
    </div>
  )
}

export default LandingPage