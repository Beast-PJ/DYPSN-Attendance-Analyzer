import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import Login from './Login'
import Signup from './Signup'
import { Button } from '@/components/ui/button.jsx'
import { LogOut, User } from 'lucide-react'

const AuthWrapper = ({ children }) => {
  const [isLoginMode, setIsLoginMode] = useState(true)
  const { currentUser, logout } = useAuth()

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode)
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Show login/signup if user is not authenticated
  if (!currentUser) {
    return isLoginMode ? (
      <Login onToggleMode={toggleMode} />
    ) : (
      <Signup onToggleMode={toggleMode} />
    )
  }

  // Show main app with user info and logout button
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with user info and logout */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Welcome, {currentUser.displayName || currentUser.email}
                </p>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main app content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

export default AuthWrapper

