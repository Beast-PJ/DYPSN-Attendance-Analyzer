import { useState, useEffect } from 'react'
import { addAttendanceRecord } from '../firebase/services'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { CheckSquare, Users, Calendar, Save, AlertCircle, CheckCircle, Clock } from 'lucide-react'

const CheckboxAttendance = ({ students, attendanceRecords, selectedClass }) => {
  const { currentUser } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

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

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const handleBulkAction = (status) => {
    const newAttendance = {}
    students.forEach(student => {
      newAttendance[student.id] = status
    })
    setAttendance(newAttendance)
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
            <CheckSquare className="h-5 w-5 mr-2 text-green-600" />
            Checkbox Attendance
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
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {selectedClass.year} - {selectedClass.division}
                </Badge>
              )}
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={() => handleBulkAction('present')}
                variant="outline"
                size="sm"
                className="border-green-200 text-green-700 hover:bg-green-50"
                disabled={totalStudents === 0}
              >
                Mark All Present
              </Button>
              <Button
                onClick={() => handleBulkAction('absent')}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-700 hover:bg-red-50"
                disabled={totalStudents === 0}
              >
                Mark All Absent
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
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

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Student Attendance
            </span>
            <Button
              onClick={handleSave}
              disabled={loading || totalStudents === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Attendance'}
            </Button>
          </CardTitle>
          <CardDescription>
            Mark attendance for each student. Changes are saved when you click "Save Attendance".
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalStudents === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {selectedClass.year && selectedClass.division 
                  ? `No students found in ${selectedClass.year} - Division ${selectedClass.division}`
                  : 'No students available. Please select a class or add students first.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Roll Number</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Student Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Year</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Division</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{student.rollNumber}</td>
                      <td className="py-3 px-4 text-gray-900">{student.name}</td>
                      <td className="py-3 px-4 text-gray-600">{student.year}</td>
                      <td className="py-3 px-4 text-gray-600">{student.division}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`attendance-${student.id}`}
                              value="present"
                              checked={attendance[student.id] === 'present'}
                              onChange={() => handleAttendanceChange(student.id, 'present')}
                              className="text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-green-700 font-medium">Present</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`attendance-${student.id}`}
                              value="absent"
                              checked={attendance[student.id] === 'absent'}
                              onChange={() => handleAttendanceChange(student.id, 'absent')}
                              className="text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm text-red-700 font-medium">Absent</span>
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CheckboxAttendance

