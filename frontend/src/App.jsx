import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import LandingPage from './pages/LandingPage'
import SignIn from './pages/SignIn'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Creator from './pages/Creator'
import Analytics from './pages/Analytics'
import ContentLibrary from './pages/ContentLibrary'
import SocialScheduler from './pages/SocialScheduler'
import ContentOptimizer from './pages/ContentOptimizer'
import TeamCollaboration from './pages/TeamCollaboration'
import AboutUs from './pages/AboutUs'
// import GeneiLink from './pages/GeneiLink' // TODO: Enable in future

import './index.css'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/login" element={<Login />} />
              <Route path="/about" element={<AboutUs />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/creator" element={
                <ProtectedRoute>
                  <Creator />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="/library" element={
                <ProtectedRoute>
                  <ContentLibrary />
                </ProtectedRoute>
              } />
              <Route path="/scheduler" element={
                <ProtectedRoute>
                  <SocialScheduler />
                </ProtectedRoute>
              } />
              <Route path="/optimizer" element={
                <ProtectedRoute>
                  <ContentOptimizer />
                </ProtectedRoute>
              } />
              <Route path="/team" element={
                <ProtectedRoute>
                  <TeamCollaboration />
                </ProtectedRoute>
              } />
              {/* TODO: Enable GeneiLink in future */}
              {/* <Route path="/geneilink" element={
                <ProtectedRoute>
                  <GeneiLink />
                </ProtectedRoute>
              } /> */}
              
              {/* Redirect any unknown routes to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App