import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { GraduationCap, Hash, Users } from 'lucide-react'

const ClassSelector = ({ students, selectedClass, onClassChange, title = "Select Class" }) => {
  const [availableYears, setAvailableYears] = useState([])
  const [availableDivisions, setAvailableDivisions] = useState([])

  // Extract available years and divisions from students
  useEffect(() => {
    const years = [...new Set(students.map(s => s.year))].sort()
    setAvailableYears(years)

    if (selectedClass.year) {
      const divisions = [...new Set(
        students
          .filter(s => s.year === selectedClass.year)
          .map(s => s.division)
      )].sort()
      setAvailableDivisions(divisions)
    } else {
      setAvailableDivisions([])
    }
  }, [students, selectedClass.year])

  const handleYearChange = (year) => {
    onClassChange({ year, division: '' })
  }

  const handleDivisionChange = (division) => {
    onClassChange({ ...selectedClass, division })
  }

  // Get students count for selected class
  const getStudentCount = () => {
    if (!selectedClass.year || !selectedClass.division) return 0
    return students.filter(s => 
      s.year === selectedClass.year && s.division === selectedClass.division
    ).length
  }

  const studentCount = getStudentCount()

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <GraduationCap className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-blue-900">{title}</CardTitle>
        </div>
        <CardDescription>Choose the year and division for this session</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Year Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Academic Year</Label>
            <Select value={selectedClass.year} onValueChange={handleYearChange}>
              <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="h-4 w-4 text-blue-600" />
                      <span>{year}</span>
                      <Badge variant="secondary" className="ml-2">
                        {students.filter(s => s.year === year).length} students
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Division Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Division</Label>
            <Select 
              value={selectedClass.division} 
              onValueChange={handleDivisionChange}
              disabled={!selectedClass.year}
            >
              <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder={selectedClass.year ? "Select division" : "Select year first"} />
              </SelectTrigger>
              <SelectContent>
                {availableDivisions.map((division) => (
                  <SelectItem key={division} value={division}>
                    <div className="flex items-center space-x-2">
                      <Hash className="h-4 w-4 text-purple-600" />
                      <span>Division {division}</span>
                      <Badge variant="secondary" className="ml-2">
                        {students.filter(s => s.year === selectedClass.year && s.division === division).length} students
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selected Class Info */}
        {selectedClass.year && selectedClass.division && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedClass.year} - Division {selectedClass.division}
                  </p>
                  <p className="text-sm text-gray-600">
                    {studentCount} student{studentCount !== 1 ? 's' : ''} in this class
                  </p>
                </div>
              </div>
              <Badge className="bg-blue-600 text-white">
                Selected
              </Badge>
            </div>
          </div>
        )}

        {/* No Students Warning */}
        {selectedClass.year && selectedClass.division && studentCount === 0 && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-700">
                No students found in {selectedClass.year} - Division {selectedClass.division}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ClassSelector

