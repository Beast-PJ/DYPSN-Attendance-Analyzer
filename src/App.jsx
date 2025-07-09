import { useState, useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import AuthWrapper from './components/auth/AuthWrapper'
import StudentManagement from './components/StudentManagement'
import CheckboxAttendance from './components/CheckboxAttendance'
import SwipeAttendance from './components/SwipeAttendance'
import Analytics from './components/Analytics'
import ExcelManager from './components/ExcelManager'
import ConnectionStatus from './components/ConnectionStatus'
import { subscribeToStudents, subscribeToAttendanceRecords } from './firebase/services'
import { useAuth } from './contexts/AuthContext'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { LogOut, Users, CheckSquare, CreditCard, BarChart3, FileSpreadsheet, GraduationCap, Settings } from 'lucide-react'
import './App.css'

function AppContent() {
  const { currentUser, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('students')
  const [students, setStudents] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [selectedClass, setSelectedClass] = useState({ year: '', division: '' })
  const [loading, setLoading] = useState(true)

  // Subscribe to students data
  useEffect(() => {
    if (!currentUser) return

    const unsubscribe = subscribeToStudents(currentUser.uid, (studentsData) => {
      setStudents(studentsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  // Subscribe to attendance data
  useEffect(() => {
    if (!currentUser) return

    const unsubscribe = subscribeToAttendanceRecords(currentUser.uid, (attendanceData) => {
      setAttendanceRecords(attendanceData)
    })

    return () => unsubscribe()
  }, [currentUser])

  // Filter students by selected class
  const filteredStudents = students.filter(student => {
    if (!selectedClass.year || !selectedClass.division) return true
    return student.year === selectedClass.year && student.division === selectedClass.division
  })

  // Filter attendance records by selected class
  const filteredAttendanceRecords = attendanceRecords.filter(record => {
    if (!selectedClass.year || !selectedClass.division) return true
    return record.year === selectedClass.year && record.division === selectedClass.division
  })

  // Get available years and divisions
  const availableYears = [...new Set(students.map(s => s.year))].sort()
  const availableDivisions = [...new Set(students.filter(s => s.year === selectedClass.year).map(s => s.division))].sort()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  const tabs = [
    { id: 'students', label: 'Students', icon: Users, color: 'bg-blue-500' },
    { id: 'checkbox', label: 'Checkbox', icon: CheckSquare, color: 'bg-green-500' },
    { id: 'swipe', label: 'Swipe Cards', icon: CreditCard, color: 'bg-purple-500' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'bg-orange-500' },
    { id: 'excel', label: 'Excel', icon: FileSpreadsheet, color: 'bg-pink-500' },
    { id: 'status', label: 'Status', icon: Settings, color: 'bg-gray-500' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GraduationCap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Attendance Analyzer</h1>
                <p className="text-sm text-gray-600">Modern student attendance management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Welcome, {currentUser?.displayName || 'Teacher'}</p>
                <p className="text-xs text-gray-600">{currentUser?.email}</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Class Selector */}
      <div className="bg-white border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Class Selection</h2>
              <p className="text-sm text-gray-600">Select year and division to filter all views</p>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={selectedClass.year}
                  onChange={(e) => setSelectedClass(prev => ({ ...prev, year: e.target.value, division: '' }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Years</option>
                  <option value="FirstYear">First Year</option>
                  <option value="SecondYear">Second Year</option>
                  <option value="ThirdYear">Third Year</option>
                  <option value="FourthYear">Fourth Year</option>
                </select>
              </div>
              
              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-700 mb-1">Division</label>
                <select
                  value={selectedClass.division}
                  onChange={(e) => setSelectedClass(prev => ({ ...prev, division: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!selectedClass.year}
                >
                  <option value="">All Divisions</option>
                  <option value="A">Division A</option>
                  <option value="B">Division B</option>
                  <option value="C">Division C</option>
                  <option value="D">Division D</option>
                </select>
              </div>
              
              {selectedClass.year && selectedClass.division && (
                <div className="flex items-end">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {selectedClass.year} - {selectedClass.division}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className={`p-1 rounded ${isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'students' && (
          <StudentManagement 
            students={filteredStudents} 
            selectedClass={selectedClass}
          />
        )}
        {activeTab === 'checkbox' && (
          <CheckboxAttendance 
            students={filteredStudents} 
            attendanceRecords={filteredAttendanceRecords}
            selectedClass={selectedClass}
          />
        )}
        {activeTab === 'swipe' && (
          <SwipeAttendance 
            students={filteredStudents} 
            attendanceRecords={filteredAttendanceRecords}
            selectedClass={selectedClass}
          />
        )}
        {activeTab === 'analytics' && (
          <Analytics 
            students={filteredStudents} 
            attendanceRecords={filteredAttendanceRecords}
            selectedClass={selectedClass}
          />
        )}
        {activeTab === 'excel' && (
          <ExcelManager 
            students={filteredStudents} 
            attendanceRecords={filteredAttendanceRecords}
            selectedClass={selectedClass}
          />
        )}
        {activeTab === 'status' && (
          <ConnectionStatus />
        )}
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AuthWrapper>
        <AppContent />
      </AuthWrapper>
    </AuthProvider>
  )
}

export default App

