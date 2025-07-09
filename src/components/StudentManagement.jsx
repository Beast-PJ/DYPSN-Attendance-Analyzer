import { useState, useEffect } from 'react'
import { addStudent, addMultipleStudents, deleteStudent, deleteMultipleStudents } from '../firebase/services'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { 
  Users, 
  UserPlus, 
  Upload, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Trash2, 
  UserMinus,
  AlertTriangle
} from 'lucide-react'

const StudentManagement = ({ students, selectedClass }) => {
  const { currentUser } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    year: selectedClass.year || '',
    division: selectedClass.division || '',
    email: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [csvFile, setCsvFile] = useState(null)
  const [selectedStudents, setSelectedStudents] = useState(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState(null)
  const [deleteMode, setDeleteMode] = useState(false)

  // Update form when selected class changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      year: selectedClass.year || '',
      division: selectedClass.division || ''
    }))
  }, [selectedClass])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.rollNumber || !formData.year || !formData.division) {
      setMessage({ type: 'error', text: 'Please fill in all required fields.' })
      return
    }

    // Check for duplicate roll number
    const existingStudent = students.find(s => s.rollNumber === formData.rollNumber)
    if (existingStudent) {
      setMessage({ type: 'error', text: 'A student with this roll number already exists.' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await addStudent(currentUser.uid, formData)
      setMessage({ type: 'success', text: 'Student added successfully!' })
      setFormData({
        name: '',
        rollNumber: '',
        year: selectedClass.year || '',
        division: selectedClass.division || '',
        email: '',
        phone: ''
      })
    } catch (error) {
      console.error('Error adding student:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to add student. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      const requiredHeaders = ['name', 'rollnumber', 'year', 'division']
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
      
      if (missingHeaders.length > 0) {
        setMessage({ 
          type: 'error', 
          text: `Missing required columns: ${missingHeaders.join(', ')}. Please check your CSV format.` 
        })
        return
      }

      const studentsData = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        if (values.length < requiredHeaders.length) continue

        const studentData = {}
        headers.forEach((header, index) => {
          if (header === 'rollnumber') {
            studentData.rollNumber = values[index]
          } else {
            studentData[header] = values[index]
          }
        })

        // Validate required fields
        if (studentData.name && studentData.rollNumber && studentData.year && studentData.division) {
          studentsData.push(studentData)
        }
      }

      if (studentsData.length === 0) {
        setMessage({ type: 'error', text: 'No valid student data found in the CSV file.' })
        return
      }

      await addMultipleStudents(currentUser.uid, studentsData)
      setMessage({ 
        type: 'success', 
        text: `Successfully added ${studentsData.length} students!` 
      })
      setCsvFile(null)
      e.target.value = ''
    } catch (error) {
      console.error('Error uploading CSV:', error)
      setMessage({ type: 'error', text: 'Failed to process CSV file. Please check the format and try again.' })
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = 'name,rollnumber,year,division,email,phone\nJohn Doe,2024001,FirstYear,A,john@example.com,1234567890\nJane Smith,2024002,FirstYear,A,jane@example.com,0987654321'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'student_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Delete functionality
  const handleDeleteSingle = (student) => {
    setStudentToDelete(student)
    setShowDeleteConfirm(true)
  }

  const handleDeleteMultiple = () => {
    if (selectedStudents.size === 0) {
      setMessage({ type: 'error', text: 'Please select students to delete.' })
      return
    }
    setStudentToDelete(null)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      if (studentToDelete) {
        // Delete single student
        await deleteStudent(currentUser.uid, studentToDelete.id)
        setMessage({ type: 'success', text: `Student ${studentToDelete.name} deleted successfully!` })
      } else {
        // Delete multiple students
        const studentIds = Array.from(selectedStudents)
        await deleteMultipleStudents(currentUser.uid, studentIds)
        setMessage({ type: 'success', text: `${studentIds.length} students deleted successfully!` })
        setSelectedStudents(new Set())
      }
    } catch (error) {
      console.error('Error deleting student(s):', error)
      setMessage({ type: 'error', text: error.message || 'Failed to delete student(s). Please try again.' })
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
      setStudentToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setStudentToDelete(null)
  }

  const toggleStudentSelection = (studentId) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const selectAllStudents = () => {
    const allStudentIds = displayStudents.map(s => s.id)
    setSelectedStudents(new Set(allStudentIds))
  }

  const deselectAllStudents = () => {
    setSelectedStudents(new Set())
  }

  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode)
    setSelectedStudents(new Set())
    setMessage({ type: '', text: '' })
  }

  // Filter students by selected class for display
  const displayStudents = students.filter(student => {
    if (!selectedClass.year || !selectedClass.division) return true
    return student.year === selectedClass.year && student.division === selectedClass.division
  })

  // Group students by year and division
  const groupedStudents = displayStudents.reduce((acc, student) => {
    const key = `${student.year}-${student.division}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(student)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{displayStudents.length}</p>
                <p className="text-sm text-gray-600">Filtered Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{Object.keys(groupedStudents).length}</p>
                <p className="text-sm text-gray-600">Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {[...new Set(students.map(s => s.year))].length}
                </p>
                <p className="text-sm text-gray-600">Years</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              {studentToDelete 
                ? `Are you sure you want to delete student "${studentToDelete.name}"? This action cannot be undone.`
                : `Are you sure you want to delete ${selectedStudents.size} selected students? This action cannot be undone.`
              }
            </p>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={cancelDelete} disabled={loading}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete} 
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2 text-blue-600" />
            Add New Student
          </CardTitle>
          <CardDescription>
            Add individual students to your class. Required fields are marked with *.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message.text && (
            <Alert className={`mb-4 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter student's full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="rollNumber">Roll Number *</Label>
                <Input
                  id="rollNumber"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleInputChange}
                  placeholder="Enter roll number"
                  required
                />
              </div>

              <div>
                <Label htmlFor="year">Year *</Label>
                <select
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Year</option>
                  <option value="FirstYear">First Year</option>
                  <option value="SecondYear">Second Year</option>
                  <option value="ThirdYear">Third Year</option>
                  <option value="FourthYear">Fourth Year</option>
                </select>
              </div>

              <div>
                <Label htmlFor="division">Division *</Label>
                <select
                  id="division"
                  name="division"
                  value={formData.division}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Division</option>
                  <option value="A">Division A</option>
                  <option value="B">Division B</option>
                  <option value="C">Division C</option>
                  <option value="D">Division D</option>
                </select>
              </div>

              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? 'Adding Student...' : 'Add Student'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Bulk Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2 text-green-600" />
            Bulk Import Students
          </CardTitle>
          <CardDescription>
            Upload a CSV file to add multiple students at once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={downloadTemplate}
                variant="outline"
                className="flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              
              <div className="flex-1">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  disabled={loading}
                  className="cursor-pointer"
                />
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p><strong>CSV Format:</strong> name, rollnumber, year, division, email, phone</p>
              <p><strong>Required columns:</strong> name, rollnumber, year, division</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Directory */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Student Directory
              </CardTitle>
              <CardDescription>
                {selectedClass.year && selectedClass.division 
                  ? `Showing students from ${selectedClass.year} - ${selectedClass.division}`
                  : 'All students grouped by year and division'
                }
              </CardDescription>
            </div>
            
            {displayStudents.length > 0 && (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={toggleDeleteMode}
                  variant={deleteMode ? "destructive" : "outline"}
                  size="sm"
                  className={deleteMode ? "bg-red-600 hover:bg-red-700" : ""}
                >
                  {deleteMode ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Cancel Delete
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Students
                    </>
                  )}
                </Button>
                
                {deleteMode && (
                  <>
                    <Button
                      onClick={selectAllStudents}
                      variant="outline"
                      size="sm"
                    >
                      Select All
                    </Button>
                    <Button
                      onClick={deselectAllStudents}
                      variant="outline"
                      size="sm"
                    >
                      Deselect All
                    </Button>
                    <Button
                      onClick={handleDeleteMultiple}
                      variant="destructive"
                      size="sm"
                      disabled={selectedStudents.size === 0}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Selected ({selectedStudents.size})
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedStudents).length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No students found for the selected criteria.</p>
              <p className="text-sm text-gray-500 mt-2">Add students using the form above.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedStudents).map(([classKey, classStudents]) => {
                const [year, division] = classKey.split('-')
                return (
                  <div key={classKey} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {year} - Division {division}
                      </h3>
                      <Badge variant="secondary">
                        {classStudents.length} students
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {classStudents.map((student) => (
                        <div key={student.id} className={`bg-gray-50 rounded-lg p-4 relative ${
                          deleteMode ? 'border-2 border-dashed border-gray-300' : ''
                        } ${
                          selectedStudents.has(student.id) ? 'border-red-500 bg-red-50' : ''
                        }`}>
                          {deleteMode && (
                            <div className="absolute top-2 left-2">
                              <Checkbox
                                checked={selectedStudents.has(student.id)}
                                onCheckedChange={() => toggleStudentSelection(student.id)}
                                className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                              />
                            </div>
                          )}
                          
                          <div className="flex items-start justify-between">
                            <div className={`flex-1 ${deleteMode ? 'ml-8' : ''}`}>
                              <h4 className="font-medium text-gray-900">{student.name}</h4>
                              <p className="text-sm text-gray-600">Roll: {student.rollNumber}</p>
                              {student.email && (
                                <p className="text-xs text-gray-500 mt-1">{student.email}</p>
                              )}
                              {student.phone && (
                                <p className="text-xs text-gray-500">{student.phone}</p>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {student.year}
                              </Badge>
                              
                              {!deleteMode && (
                                <Button
                                  onClick={() => handleDeleteSingle(student)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StudentManagement

