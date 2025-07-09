import { useState, useRef } from 'react'
import { addMultipleStudents } from '../firebase/services'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { FileSpreadsheet, Upload, Download, AlertCircle, CheckCircle, Calendar, Filter } from 'lucide-react'

const ExcelManager = ({ students, attendanceRecords, selectedClass }) => {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [exportDateRange, setExportDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const fileInputRef = useRef(null)

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
        text: `Successfully imported ${studentsData.length} students!` 
      })
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error uploading CSV:', error)
      setMessage({ type: 'error', text: 'Failed to process CSV file. Please check the format and try again.' })
    } finally {
      setLoading(false)
    }
  }

  const downloadStudentTemplate = () => {
    const csvContent = 'name,rollnumber,year,division,email,phone\nJohn Doe,2024001,FirstYear,A,john@example.com,1234567890\nJane Smith,2024002,FirstYear,A,jane@example.com,0987654321'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'student_import_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportAttendanceData = () => {
    // Filter students by selected class if specified
    const filteredStudents = selectedClass.year && selectedClass.division 
      ? students.filter(s => s.year === selectedClass.year && s.division === selectedClass.division)
      : students

    if (filteredStudents.length === 0) {
      setMessage({ 
        type: 'error', 
        text: selectedClass.year && selectedClass.division 
          ? `No students found in ${selectedClass.year} - Division ${selectedClass.division}`
          : 'No students available to export'
      })
      return
    }

    // Filter attendance records by date range and selected class
    const filteredRecords = attendanceRecords.filter(record => {
      const recordDate = new Date(record.date)
      const startDate = new Date(exportDateRange.startDate)
      const endDate = new Date(exportDateRange.endDate)
      
      const dateInRange = recordDate >= startDate && recordDate <= endDate
      const classMatch = selectedClass.year && selectedClass.division 
        ? record.year === selectedClass.year && record.division === selectedClass.division
        : true
      
      return dateInRange && classMatch
    })

    // Get unique dates and sort them
    const uniqueDates = [...new Set(filteredRecords.map(r => r.date))].sort()
    
    if (uniqueDates.length === 0) {
      setMessage({ 
        type: 'error', 
        text: 'No attendance records found for the selected date range and class.' 
      })
      return
    }

    // Create CSV headers: Roll Number, Name, Year, Division, then dates
    const headers = ['Roll Number', 'Name', 'Year', 'Division', ...uniqueDates]
    
    // Create CSV rows
    const csvRows = [headers.join(',')]
    
    filteredStudents.forEach(student => {
      const row = [
        student.rollNumber,
        `"${student.name}"`, // Quote name to handle commas
        student.year,
        student.division
      ]
      
      // Add attendance for each date
      uniqueDates.forEach(date => {
        const attendanceRecord = filteredRecords.find(
          r => r.studentId === student.id && r.date === date
        )
        
        if (attendanceRecord) {
          // Use P for present, A for absent
          row.push(attendanceRecord.status === 'present' ? 'P' : 'A')
        } else {
          // Use dash for no record
          row.push('-')
        }
      })
      
      csvRows.push(row.join(','))
    })
    
    // Add summary rows
    csvRows.push('') // Empty row
    csvRows.push('SUMMARY')
    
    // Total present for each date
    const presentRow = ['', 'Total Present', '', '']
    uniqueDates.forEach(date => {
      const presentCount = filteredRecords.filter(
        r => r.date === date && r.status === 'present'
      ).length
      presentRow.push(presentCount)
    })
    csvRows.push(presentRow.join(','))
    
    // Total absent for each date
    const absentRow = ['', 'Total Absent', '', '']
    uniqueDates.forEach(date => {
      const absentCount = filteredRecords.filter(
        r => r.date === date && r.status === 'absent'
      ).length
      absentRow.push(absentCount)
    })
    csvRows.push(absentRow.join(','))
    
    // Attendance rate for each date
    const rateRow = ['', 'Attendance Rate (%)', '', '']
    uniqueDates.forEach(date => {
      const dateRecords = filteredRecords.filter(r => r.date === date)
      const presentCount = dateRecords.filter(r => r.status === 'present').length
      const rate = dateRecords.length > 0 ? Math.round((presentCount / dateRecords.length) * 100) : 0
      rateRow.push(`${rate}%`)
    })
    csvRows.push(rateRow.join(','))

    // Create and download file
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    const className = selectedClass.year && selectedClass.division 
      ? `_${selectedClass.year}_${selectedClass.division}`
      : '_All_Classes'
    const dateStr = `${exportDateRange.startDate}_to_${exportDateRange.endDate}`
    a.download = `attendance_export${className}_${dateStr}.csv`
    
    a.click()
    window.URL.revokeObjectURL(url)
    
    setMessage({ 
      type: 'success', 
      text: `Attendance data exported successfully! ${filteredStudents.length} students, ${uniqueDates.length} dates.` 
    })
  }

  const exportStudentList = () => {
    // Filter students by selected class if specified
    const filteredStudents = selectedClass.year && selectedClass.division 
      ? students.filter(s => s.year === selectedClass.year && s.division === selectedClass.division)
      : students

    if (filteredStudents.length === 0) {
      setMessage({ 
        type: 'error', 
        text: selectedClass.year && selectedClass.division 
          ? `No students found in ${selectedClass.year} - Division ${selectedClass.division}`
          : 'No students available to export'
      })
      return
    }

    const headers = ['Roll Number', 'Name', 'Year', 'Division', 'Email', 'Phone']
    const csvRows = [headers.join(',')]
    
    filteredStudents.forEach(student => {
      const row = [
        student.rollNumber,
        `"${student.name}"`,
        student.year,
        student.division,
        student.email || '',
        student.phone || ''
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    const className = selectedClass.year && selectedClass.division 
      ? `_${selectedClass.year}_${selectedClass.division}`
      : '_All_Classes'
    a.download = `student_list${className}.csv`
    
    a.click()
    window.URL.revokeObjectURL(url)
    
    setMessage({ 
      type: 'success', 
      text: `Student list exported successfully! ${filteredStudents.length} students.` 
    })
  }

  // Calculate statistics for display
  const filteredStudents = selectedClass.year && selectedClass.division 
    ? students.filter(s => s.year === selectedClass.year && s.division === selectedClass.division)
    : students

  const filteredRecords = attendanceRecords.filter(record => {
    const recordDate = new Date(record.date)
    const startDate = new Date(exportDateRange.startDate)
    const endDate = new Date(exportDateRange.endDate)
    
    const dateInRange = recordDate >= startDate && recordDate <= endDate
    const classMatch = selectedClass.year && selectedClass.division 
      ? record.year === selectedClass.year && record.division === selectedClass.division
      : true
    
    return dateInRange && classMatch
  })

  const uniqueDates = [...new Set(filteredRecords.map(r => r.date))].length

  return (
    <div className="space-y-6">
      {/* Class Selection Info */}
      {selectedClass.year && selectedClass.division && (
        <Alert className="border-blue-200 bg-blue-50">
          <Filter className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Excel operations are filtered for {selectedClass.year} - Division {selectedClass.division}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2 text-green-600" />
            Excel Import/Export
          </CardTitle>
          <CardDescription>
            Import students from CSV files and export attendance data in Excel-compatible format
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileSpreadsheet className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{filteredStudents.length}</p>
                <p className="text-sm text-gray-600">
                  {selectedClass.year && selectedClass.division ? 'Class Students' : 'Total Students'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{uniqueDates}</p>
                <p className="text-sm text-gray-600">Available Dates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{filteredRecords.length}</p>
                <p className="text-sm text-gray-600">Total Records</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Download className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {[...new Set(students.map(s => `${s.year}-${s.division}`))].length}
                </p>
                <p className="text-sm text-gray-600">Total Classes</p>
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

      {/* Import Students */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2 text-blue-600" />
            Import Students
          </CardTitle>
          <CardDescription>
            Upload a CSV file to add multiple students at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={downloadStudentTemplate}
                variant="outline"
                className="flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              
              <div className="flex-1">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  disabled={loading}
                  className="cursor-pointer"
                />
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">CSV Format Requirements:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><strong>Required columns:</strong> name, rollnumber, year, division</li>
                <li><strong>Optional columns:</strong> email, phone</li>
                <li><strong>Year values:</strong> FirstYear, SecondYear, ThirdYear, FourthYear</li>
                <li><strong>Division values:</strong> A, B, C, D</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2 text-green-600" />
            Export Data
          </CardTitle>
          <CardDescription>
            Export attendance data and student lists in Excel-compatible format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Date Range Selection */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Date Range for Attendance Export</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={exportDateRange.startDate}
                    onChange={(e) => setExportDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={exportDateRange.endDate}
                    onChange={(e) => setExportDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                onClick={exportAttendanceData}
                className="bg-green-600 hover:bg-green-700 h-auto py-4"
                disabled={loading}
              >
                <div className="text-center">
                  <Download className="h-5 w-5 mx-auto mb-1" />
                  <div className="font-medium">Export Attendance</div>
                  <div className="text-xs opacity-90">
                    Dates as columns, P/A format
                  </div>
                </div>
              </Button>

              <Button
                onClick={exportStudentList}
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50 h-auto py-4"
                disabled={loading}
              >
                <div className="text-center">
                  <Download className="h-5 w-5 mx-auto mb-1" />
                  <div className="font-medium">Export Student List</div>
                  <div className="text-xs opacity-90">
                    Complete student information
                  </div>
                </div>
              </Button>
            </div>

            {/* Export Format Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Enhanced Excel Export Format:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Attendance Export:</strong> Dates as column headers, P for present, A for absent, - for no record</li>
                <li>• <strong>Summary Rows:</strong> Total present/absent counts and attendance rates for each date</li>
                <li>• <strong>Class Filtering:</strong> Export data for selected class or all classes</li>
                <li>• <strong>Excel Compatible:</strong> Opens perfectly in Microsoft Excel and Google Sheets</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ExcelManager

