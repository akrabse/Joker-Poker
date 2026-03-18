/**
 * UITLEG VOOR DOCENT EN LEERLINGEN (OPDRACHT):
 * Dit bestand fungeert als de hoofdapplicatie (entry point) voor de gebruikersinterface.
 * Het beheert de navigatieroutes (welke pagina je ziet) en houdt bij of de gebruiker is ingelogd
 * en over hoeveel chips (fiches) deze beschikt. 
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import RoomEntry from './pages/RoomEntry'
import GameTable from './pages/GameTable'
import AdminPanel from './pages/AdminPanel'
import './styles/tailwind.css'

function App() {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // UITLEG: Deze code controleert bij het openen of de gebruiker nog ingelogd was in de browser (localStorage).
    // Check for stored auth token
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      const parsedUser = JSON.parse(userData)
      // If old format (with nested user object), extract it
      // This handles migration from old data structure
      setUser(parsedUser.user ? parsedUser.user : parsedUser)
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (userData) => {
    // UITLEG: Wordt uitgevoerd als de gebruiker succesvol inlogt. Het bewaart de gegevens en de token.
    // Extract the actual user object from the response
    // Backend returns: { token: "...", user: { id, username, chips } }
    const userInfo = userData.user
    setUser(userInfo)
    setIsAuthenticated(true)
    localStorage.setItem('token', userData.token)
    // Store only the user object, not the whole response
    localStorage.setItem('user', JSON.stringify(userInfo))
  }

  const handleUserUpdate = (updatedUser) => {
    // Update user state and localStorage when chips change
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  const handleLogout = () => {
    // UITLEG: Wordt uitgevoerd als de gebruiker uitlogt. Het verwijdert alle gegevens uit het geheugen.
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated ? 
            <Navigate to="/room-entry" /> : 
            <Login onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/room-entry" 
          element={
            isAuthenticated ? 
            <RoomEntry user={user} onLogout={handleLogout} /> : 
            <Navigate to="/" />
          } 
        />
        <Route 
          path="/game/:roomId" 
          element={
            isAuthenticated ? 
            <GameTable 
              user={user} 
              onLogout={handleLogout} 
              onUserUpdate={handleUserUpdate}
            /> : 
            <Navigate to="/" />
          } 
        />
        {/* Admin panel - separate authentication, no redirect */}
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  )
}

export default App