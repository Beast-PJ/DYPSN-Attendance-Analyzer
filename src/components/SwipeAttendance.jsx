import { useState, useEffect } from 'react'
import { addAttendanceRecord } from '../firebase/services'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { CreditCard, Users, Calendar, Save, AlertCircle, CheckCircle, Clock, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react'
import { useSpring, animated } from 'react-spring'
import { useDrag } from '@use-gesture/react'

const SwipeAttendance = ({ students, attendanceRecords, selectedClass }) => {
  const { currentUser } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0)
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [swipeDirection, setSwipeDirection] = useState(null)

  // Spring animation for card
  const [{ x, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    rotate: 0,
    scale: 1,
    config: { tension: 300, friction: 30 }
  }))

  // Initialize attendance state when students or date changes
  useEffect(() => {
    const newAttendance = {}
    students.forEach(student => {
      const existingRecord = attendanceRecords.find(
        record => record.studentId === student.id && record.date === selectedDate
      )
      newAttendance[student.id] = existingRecord ? existingRecord.status : 'absent'
    })
    setAttendance(newAttendance)
  }, [students, attendanceRecords, selectedDate])

  // Reset current student index when students change
  useEffect(() => {
    setCurrentStudentIndex(0)
    api.start({ x: 0, rotate: 0, scale: 1 })
  }, [students, api])

  // Drag gesture handler
  const bind = useDrag(({ active, movement: [mx], direction: [xDir], velocity: [vx] }) => {
    const trigger = vx > 0.2 || Math.abs(mx) > 100
    const dir = xDir < 0 ? -1 : 1
    
    if (!active && trigger) {
      // Determine action based on direction
      if (dir === -1) {
        // Swipe left - mark absent
        handleSwipeAction('absent')
      } else {
        // Swipe right - mark present
        handleSwipeAction('present')
      }
    } else {
      // Update animation during drag
      api.start({
        x: active ? mx : 0,
        rotate: active ? mx / 10 : 0,
        scale: active ? 1.05 : 1,
        immediate: active
      })
      
      // Show swipe direction indicator
      if (active && Math.abs(mx) > 50) {
        setSwipeDirection(mx > 0 ? 'right' : 'left')
      } else {
        setSwipeDirection(null)
      }
    }
  }, {
    axis: 'x',
    bounds: { left: -300, right: 300 },
    rubberband: true
  })

  const handleSwipeAction = (status) => {
    const currentStudent = students[currentStudentIndex]
    if (!currentStudent) return

    // Mark attendance
    handleAttendanceChange(currentStudent.id, status)
    
    // Animate card out
    api.start({
      x: status === 'present' ? 300 : -300,
      rotate: status === 'present' ? 15 : -15,
      scale: 0.8,
      config: { tension: 200, friction: 20 }
    })

    // Move to next student after animation
    setTimeout(() => {
      if (currentStudentIndex < students.length - 1) {
        setCurrentStudentIndex(currentStudentIndex + 1)
      }
      api.start({ x: 0, rotate: 0, scale: 1 })
      setSwipeDirection(null)
    }, 300)
  }

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const nextStudent = () => {
    if (currentStudentIndex < students.length - 1) {
      setCurrentStudentIndex(currentStudentIndex + 1)
      api.start({ x: 0, rotate: 0, scale: 1 })
    }
  }

  const previousStudent = () => {
    if (currentStudentIndex > 0) {
      setCurrentStudentIndex(currentStudentIndex - 1)
      api.start({ x: 0, rotate: 0, scale: 1 })
    }
  }

  const handleSave = async () => {
    if (!selectedClass.year || !selectedClass.division) {
      setMessage({ 
        type: 'error', 
        text: 'Please select a year and division before taking attendance.' 
      })
      return
    }

    if (students.length === 0) {
      setMessage({ 
        type: 'error', 
        text: 'No students found for the selected class. Please add students first.' 
      })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const attendanceData = students.map(student => ({
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        year: student.year,
        division: student.division,
        date: selectedDate,
        status: attendance[student.id] || 'absent'
      }))

      // Save all attendance records
      for (const record of attendanceData) {
        await addAttendanceRecord(currentUser.uid, record)
      }

      setMessage({ 
        type: 'success', 
        text: `Attendance saved successfully for ${attendanceData.length} students!` 
      })
    } catch (error) {
      console.error('Error saving attendance:', error)
      setMessage({ 
        type: 'error', 
        text: 'Failed to save attendance. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const presentCount = Object.values(attendance).filter(status => status === 'present').length
  const absentCount = Object.values(attendance).filter(status => status === 'absent').length
  const totalStudents = students.length

  const currentStudent = students[currentStudentIndex]

  return (
    <div className="space-y-6">
      {/* Class Selection Warning */}
      {(!selectedClass.year || !selectedClass.division) && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Please select a year and division from the class selector above to take attendance for a specific class.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
            Swipe Card Attendance
          </CardTitle>
          <CardDescription>
            {selectedClass.year && selectedClass.division 
              ? `Taking attendance for ${selectedClass.year} - Division ${selectedClass.division}`
              : 'Select a class to take attendance'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                />
              </div>
              
              {selectedClass.year && selectedClass.division && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  {selectedClass.year} - {selectedClass.division}
                </Badge>
              )}
            </div>

            <Button
              onClick={handleSave}
              disabled={loading || totalStudents === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{presentCount}</p>
                <p className="text-sm text-gray-600">Present</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{absentCount}</p>
                <p className="text-sm text-gray-600">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-600">Attendance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message */}
      {message.text && (
        <Alert className={`${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          {message.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Swipe Instructions */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-8 text-sm">
            <div className="flex items-center space-x-2 text-green-700">
              <ArrowRight className="h-4 w-4" />
              <span>Swipe Right = Present</span>
            </div>
            <div className="flex items-center space-x-2 text-red-700">
              <ArrowLeft className="h-4 w-4" />
              <span>Swipe Left = Absent</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
              Student Card
            </span>
            {totalStudents > 0 && (
              <Badge variant="outline">
                {currentStudentIndex + 1} of {totalStudents}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Swipe the card left for absent or right for present. Use buttons or keyboard arrows to navigate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalStudents === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                {selectedClass.year && selectedClass.division 
                  ? `No students found in ${selectedClass.year} - Division ${selectedClass.division}`
                  : 'No students available. Please select a class or add students first.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Student Card with Swipe */}
              <div className="max-w-md mx-auto relative h-80 flex items-center justify-center">
                {/* Swipe Direction Indicators */}
                {swipeDirection && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className={`text-6xl font-bold ${
                      swipeDirection === 'right' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {swipeDirection === 'right' ? 'P' : 'A'}
                    </div>
                  </div>
                )}
                
                <animated.div
                  {...bind()}
                  style={{
                    x,
                    rotate: rotate.to(r => `${r}deg`),
                    scale,
                    touchAction: 'none'
                  }}
                  className="w-full cursor-grab active:cursor-grabbing"
                >
                  <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl p-6 text-white shadow-lg select-none">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Users className="h-6 w-6" />
                      </div>
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {currentStudent?.year}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">{currentStudent?.name}</h3>
                      <p className="text-purple-100">Roll Number: {currentStudent?.rollNumber}</p>
                      <p className="text-purple-100">Division: {currentStudent?.division}</p>
                      {currentStudent?.email && (
                        <p className="text-purple-100 text-sm">{currentStudent.email}</p>
                      )}
                    </div>
                    
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-purple-100">
                        Status: {attendance[currentStudent?.id] === 'present' ? 'Present' : 'Absent'}
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        attendance[currentStudent?.id] === 'present' ? 'bg-green-400' : 'bg-red-400'
                      }`}></div>
                    </div>
                  </div>
                </animated.div>
              </div>

              {/* Navigation and Actions */}
              <div className="flex items-center justify-center space-x-4">
                <Button
                  onClick={previousStudent}
                  disabled={currentStudentIndex === 0}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      handleAttendanceChange(currentStudent?.id, 'present')
                      if (currentStudentIndex < students.length - 1) {
                        setTimeout(() => nextStudent(), 200)
                      }
                    }}
                    className={`${
                      attendance[currentStudent?.id] === 'present'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Present
                  </Button>
                  
                  <Button
                    onClick={() => {
                      handleAttendanceChange(currentStudent?.id, 'absent')
                      if (currentStudentIndex < students.length - 1) {
                        setTimeout(() => nextStudent(), 200)
                      }
                    }}
                    className={`${
                      attendance[currentStudent?.id] === 'absent'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                    }`}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Absent
                  </Button>
                </div>

                <Button
                  onClick={nextStudent}
                  disabled={currentStudentIndex === totalStudents - 1}
                  variant="outline"
                  size="sm"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(((currentStudentIndex + 1) / totalStudents) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStudentIndex + 1) / totalStudents) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default SwipeAttendance

