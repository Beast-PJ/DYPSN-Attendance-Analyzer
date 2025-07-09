import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { BarChart3, Users, Calendar, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react'

const Analytics = ({ students, attendanceRecords, selectedClass }) => {
  const [dateRange, setDateRange] = useState('last7days')

  // Filter data based on date range
  const filteredRecords = useMemo(() => {
    const now = new Date()
    let startDate = new Date()

    switch (dateRange) {
      case 'last7days':
        startDate.setDate(now.getDate() - 7)
        break
      case 'last30days':
        startDate.setDate(now.getDate() - 30)
        break
      case 'last3months':
        startDate.setMonth(now.getMonth() - 3)
        break
      default:
        startDate = new Date(0) // All time
    }

    return attendanceRecords.filter(record => {
      const recordDate = new Date(record.date)
      return recordDate >= startDate && recordDate <= now
    })
  }, [attendanceRecords, dateRange])

  // Calculate overall statistics
  const stats = useMemo(() => {
    const totalRecords = filteredRecords.length
    const presentRecords = filteredRecords.filter(r => r.status === 'present').length
    const absentRecords = totalRecords - presentRecords
    const attendanceRate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0

    return {
      totalRecords,
      presentRecords,
      absentRecords,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      totalStudents: students.length,
      activeDays: [...new Set(filteredRecords.map(r => r.date))].length
    }
  }, [filteredRecords, students])

  // Daily attendance data for line chart
  const dailyData = useMemo(() => {
    const dailyStats = {}
    
    filteredRecords.forEach(record => {
      if (!dailyStats[record.date]) {
        dailyStats[record.date] = { date: record.date, present: 0, absent: 0, total: 0 }
      }
      
      if (record.status === 'present') {
        dailyStats[record.date].present++
      } else {
        dailyStats[record.date].absent++
      }
      dailyStats[record.date].total++
    })

    return Object.values(dailyStats)
      .map(day => ({
        ...day,
        attendanceRate: day.total > 0 ? Math.round((day.present / day.total) * 100) : 0
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [filteredRecords])

  // Student-wise attendance data
  const studentData = useMemo(() => {
    const studentStats = {}
    
    students.forEach(student => {
      studentStats[student.id] = {
        name: student.name,
        rollNumber: student.rollNumber,
        year: student.year,
        division: student.division,
        present: 0,
        absent: 0,
        total: 0
      }
    })

    filteredRecords.forEach(record => {
      if (studentStats[record.studentId]) {
        if (record.status === 'present') {
          studentStats[record.studentId].present++
        } else {
          studentStats[record.studentId].absent++
        }
        studentStats[record.studentId].total++
      }
    })

    return Object.values(studentStats)
      .map(student => ({
        ...student,
        attendanceRate: student.total > 0 ? Math.round((student.present / student.total) * 100) : 0
      }))
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
  }, [students, filteredRecords])

  // Pie chart data
  const pieData = [
    { name: 'Present', value: stats.presentRecords, color: '#10b981' },
    { name: 'Absent', value: stats.absentRecords, color: '#ef4444' }
  ]

  // Division-wise data (if no specific class is selected)
  const divisionData = useMemo(() => {
    if (selectedClass.year && selectedClass.division) return []
    
    const divisionStats = {}
    
    filteredRecords.forEach(record => {
      const key = `${record.year}-${record.division}`
      if (!divisionStats[key]) {
        divisionStats[key] = {
          class: `${record.year} ${record.division}`,
          present: 0,
          absent: 0,
          total: 0
        }
      }
      
      if (record.status === 'present') {
        divisionStats[key].present++
      } else {
        divisionStats[key].absent++
      }
      divisionStats[key].total++
    })

    return Object.values(divisionStats)
      .map(div => ({
        ...div,
        attendanceRate: div.total > 0 ? Math.round((div.present / div.total) * 100) : 0
      }))
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
  }, [filteredRecords, selectedClass])

  return (
    <div className="space-y-6">
      {/* Class Selection Info */}
      {selectedClass.year && selectedClass.division && (
        <Alert className="border-blue-200 bg-blue-50">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Showing analytics for {selectedClass.year} - Division {selectedClass.division}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-orange-600" />
            Attendance Analytics
          </CardTitle>
          <CardDescription>
            {selectedClass.year && selectedClass.division 
              ? `Analytics for ${selectedClass.year} - Division ${selectedClass.division}`
              : 'Overall attendance analytics across all classes'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="last3months">Last 3 Months</option>
                <option value="all">All Time</option>
              </select>
              
              {selectedClass.year && selectedClass.division && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  {selectedClass.year} - {selectedClass.division}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.attendanceRate}%</p>
                <p className="text-sm text-gray-600">Attendance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.activeDays}</p>
                <p className="text-sm text-gray-600">Active Days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
                <p className="text-sm text-gray-600">Total Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {stats.totalRecords > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Overview Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
              <CardDescription>Present vs Absent distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Daily Attendance Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Attendance Trend</CardTitle>
              <CardDescription>Attendance rate over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value, name) => [
                      name === 'attendanceRate' ? `${value}%` : value,
                      name === 'attendanceRate' ? 'Attendance Rate' : name
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="attendanceRate" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No attendance data available</p>
            <p className="text-gray-500 mt-2">
              {selectedClass.year && selectedClass.division 
                ? `No attendance records found for ${selectedClass.year} - Division ${selectedClass.division}`
                : 'Start taking attendance to see analytics here'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Division-wise Performance (only when no specific class is selected) */}
      {!selectedClass.year && !selectedClass.division && divisionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Class-wise Performance</CardTitle>
            <CardDescription>Attendance rates by class</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={divisionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'attendanceRate' ? `${value}%` : value,
                  name === 'attendanceRate' ? 'Attendance Rate' : name
                ]} />
                <Bar dataKey="attendanceRate" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Student Performance Table */}
      {studentData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Student Performance</CardTitle>
            <CardDescription>Individual attendance rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Roll Number</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Student Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Class</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Present</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Absent</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {studentData.slice(0, 10).map((student) => (
                    <tr key={student.rollNumber} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{student.rollNumber}</td>
                      <td className="py-3 px-4 text-gray-900">{student.name}</td>
                      <td className="py-3 px-4 text-gray-600">{student.year} {student.division}</td>
                      <td className="py-3 px-4 text-center text-green-600 font-medium">{student.present}</td>
                      <td className="py-3 px-4 text-center text-red-600 font-medium">{student.absent}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge 
                          variant={student.attendanceRate >= 75 ? 'default' : 'destructive'}
                          className={student.attendanceRate >= 75 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        >
                          {student.attendanceRate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {studentData.length > 10 && (
                <div className="text-center py-4 text-gray-600">
                  Showing top 10 students. Total: {studentData.length} students
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Analytics

