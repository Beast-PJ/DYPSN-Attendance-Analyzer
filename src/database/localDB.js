// Local IndexedDB implementation for offline data storage
// This provides a fallback when Firebase is unavailable

const DB_NAME = 'attendance-analyzer-db'
const DB_VERSION = 1
const STUDENT_STORE = 'students'
const ATTENDANCE_STORE = 'attendance'

// Initialize IndexedDB
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error)
      reject(request.error)
    }
    
    request.onsuccess = () => {
      resolve(request.result)
    }
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      // Create students store if it doesn't exist
      if (!db.objectStoreNames.contains(STUDENT_STORE)) {
        const studentStore = db.createObjectStore(STUDENT_STORE, { keyPath: 'id' })
        studentStore.createIndex('year', 'year', { unique: false })
        studentStore.createIndex('division', 'division', { unique: false })
        studentStore.createIndex('rollNumber', 'rollNumber', { unique: false })
      }
      
      // Create attendance store if it doesn't exist
      if (!db.objectStoreNames.contains(ATTENDANCE_STORE)) {
        const attendanceStore = db.createObjectStore(ATTENDANCE_STORE, { keyPath: 'id' })
        attendanceStore.createIndex('date', 'date', { unique: false })
        attendanceStore.createIndex('year', 'year', { unique: false })
        attendanceStore.createIndex('division', 'division', { unique: false })
        attendanceStore.createIndex('studentId', 'studentId', { unique: false })
      }
    }
  })
}

// Student operations
export async function getLocalStudents() {
  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STUDENT_STORE], 'readonly')
      const store = transaction.objectStore(STUDENT_STORE)
      const request = store.getAll()
      
      request.onsuccess = () => {
        resolve(request.result || [])
      }
      
      request.onerror = () => {
        console.error('Failed to get local students:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('Error getting local students:', error)
    return []
  }
}

export async function saveLocalStudents(students) {
  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STUDENT_STORE], 'readwrite')
      const store = transaction.objectStore(STUDENT_STORE)
      
      // Clear existing data
      const clearRequest = store.clear()
      
      clearRequest.onsuccess = () => {
        // Add all students
        let completed = 0
        const total = students.length
        
        if (total === 0) {
          resolve()
          return
        }
        
        students.forEach(student => {
          const addRequest = store.add(student)
          
          addRequest.onsuccess = () => {
            completed++
            if (completed === total) {
              resolve()
            }
          }
          
          addRequest.onerror = () => {
            console.error('Failed to add student to local DB:', addRequest.error)
            completed++
            if (completed === total) {
              resolve()
            }
          }
        })
      }
      
      clearRequest.onerror = () => {
        console.error('Failed to clear local students:', clearRequest.error)
        reject(clearRequest.error)
      }
    })
  } catch (error) {
    console.error('Error saving local students:', error)
    throw error
  }
}

export async function addLocalStudent(student) {
  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STUDENT_STORE], 'readwrite')
      const store = transaction.objectStore(STUDENT_STORE)
      const request = store.add(student)
      
      request.onsuccess = () => {
        resolve(student)
      }
      
      request.onerror = () => {
        console.error('Failed to add local student:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('Error adding local student:', error)
    throw error
  }
}

export async function updateLocalStudent(studentId, updateData) {
  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STUDENT_STORE], 'readwrite')
      const store = transaction.objectStore(STUDENT_STORE)
      
      // Get the existing student first
      const getRequest = store.get(studentId)
      
      getRequest.onsuccess = () => {
        const existingStudent = getRequest.result
        if (existingStudent) {
          const updatedStudent = { ...existingStudent, ...updateData }
          const putRequest = store.put(updatedStudent)
          
          putRequest.onsuccess = () => {
            resolve(updatedStudent)
          }
          
          putRequest.onerror = () => {
            console.error('Failed to update local student:', putRequest.error)
            reject(putRequest.error)
          }
        } else {
          reject(new Error('Student not found'))
        }
      }
      
      getRequest.onerror = () => {
        console.error('Failed to get local student for update:', getRequest.error)
        reject(getRequest.error)
      }
    })
  } catch (error) {
    console.error('Error updating local student:', error)
    throw error
  }
}

export async function deleteLocalStudent(studentId) {
  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STUDENT_STORE], 'readwrite')
      const store = transaction.objectStore(STUDENT_STORE)
      const request = store.delete(studentId)
      
      request.onsuccess = () => {
        resolve(studentId)
      }
      
      request.onerror = () => {
        console.error('Failed to delete local student:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('Error deleting local student:', error)
    throw error
  }
}

// Attendance operations
export async function getLocalAttendanceRecords() {
  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ATTENDANCE_STORE], 'readonly')
      const store = transaction.objectStore(ATTENDANCE_STORE)
      const request = store.getAll()
      
      request.onsuccess = () => {
        resolve(request.result || [])
      }
      
      request.onerror = () => {
        console.error('Failed to get local attendance records:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('Error getting local attendance records:', error)
    return []
  }
}

export async function saveLocalAttendanceRecords(records) {
  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ATTENDANCE_STORE], 'readwrite')
      const store = transaction.objectStore(ATTENDANCE_STORE)
      
      // Clear existing data
      const clearRequest = store.clear()
      
      clearRequest.onsuccess = () => {
        // Add all records
        let completed = 0
        const total = records.length
        
        if (total === 0) {
          resolve()
          return
        }
        
        records.forEach(record => {
          const addRequest = store.add(record)
          
          addRequest.onsuccess = () => {
            completed++
            if (completed === total) {
              resolve()
            }
          }
          
          addRequest.onerror = () => {
            console.error('Failed to add attendance record to local DB:', addRequest.error)
            completed++
            if (completed === total) {
              resolve()
            }
          }
        })
      }
      
      clearRequest.onerror = () => {
        console.error('Failed to clear local attendance records:', clearRequest.error)
        reject(clearRequest.error)
      }
    })
  } catch (error) {
    console.error('Error saving local attendance records:', error)
    throw error
  }
}

export async function addLocalAttendanceRecord(record) {
  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ATTENDANCE_STORE], 'readwrite')
      const store = transaction.objectStore(ATTENDANCE_STORE)
      const request = store.add(record)
      
      request.onsuccess = () => {
        resolve(record)
      }
      
      request.onerror = () => {
        console.error('Failed to add local attendance record:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('Error adding local attendance record:', error)
    throw error
  }
}

// Utility functions
export async function getLocalStudentsByClass(year, division) {
  try {
    const students = await getLocalStudents()
    return students.filter(student => student.year === year && student.division === division)
  } catch (error) {
    console.error('Error getting local students by class:', error)
    return []
  }
}

export async function getLocalAttendanceByDateAndClass(date, year, division) {
  try {
    const records = await getLocalAttendanceRecords()
    return records.filter(record => 
      record.date === date && 
      record.year === year && 
      record.division === division
    )
  } catch (error) {
    console.error('Error getting local attendance by date and class:', error)
    return []
  }
}

export async function clearLocalDB() {
  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STUDENT_STORE, ATTENDANCE_STORE], 'readwrite')
      
      const studentStore = transaction.objectStore(STUDENT_STORE)
      const attendanceStore = transaction.objectStore(ATTENDANCE_STORE)
      
      const clearStudents = studentStore.clear()
      const clearAttendance = attendanceStore.clear()
      
      let completed = 0
      
      clearStudents.onsuccess = () => {
        completed++
        if (completed === 2) resolve()
      }
      
      clearAttendance.onsuccess = () => {
        completed++
        if (completed === 2) resolve()
      }
      
      clearStudents.onerror = clearAttendance.onerror = (error) => {
        console.error('Failed to clear local DB:', error)
        reject(error)
      }
    })
  } catch (error) {
    console.error('Error clearing local DB:', error)
    throw error
  }
}

// Check if IndexedDB is supported
export function isLocalDBSupported() {
  return 'indexedDB' in window
}

// Get database info
export async function getLocalDBInfo() {
  try {
    const students = await getLocalStudents()
    const attendance = await getLocalAttendanceRecords()
    
    return {
      supported: isLocalDBSupported(),
      studentsCount: students.length,
      attendanceCount: attendance.length,
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error getting local DB info:', error)
    return {
      supported: isLocalDBSupported(),
      studentsCount: 0,
      attendanceCount: 0,
      lastUpdated: null,
      error: error.message
    }
  }
}

