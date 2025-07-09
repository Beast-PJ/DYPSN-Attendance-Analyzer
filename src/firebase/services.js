import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore'
import { db } from './config'
import { 
  getLocalStudents, 
  saveLocalStudents, 
  addLocalStudent,
  updateLocalStudent,
  deleteLocalStudent,
  getLocalAttendanceRecords, 
  saveLocalAttendanceRecords,
  addLocalAttendanceRecord,
  getLocalStudentsByClass,
  getLocalAttendanceByDateAndClass,
  isLocalDBSupported
} from '../database/localDB'

// Connection status tracking
let isOnline = navigator.onLine
let firebaseConnected = true

// Update online status
window.addEventListener('online', () => {
  isOnline = true
  console.log('Network connection restored')
})

window.addEventListener('offline', () => {
  isOnline = false
  console.log('Network connection lost')
})

// Helper function to check if Firebase is available
async function checkFirebaseConnection() {
  try {
    // Try a simple read operation to test connection
    const testRef = collection(db, 'test')
    await getDocs(testRef)
    firebaseConnected = true
    return true
  } catch (error) {
    console.warn('Firebase connection check failed:', error)
    firebaseConnected = false
    return false
  }
}

// Helper function to generate unique IDs for local storage
function generateLocalId() {
  return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// Students collection functions
export const addStudent = async (userId, studentData) => {
  const studentWithId = {
    ...studentData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  try {
    // Try Firebase first
    if (isOnline && await checkFirebaseConnection()) {
      const docRef = await addDoc(collection(db, 'users', userId, 'students'), studentWithId)
      const firebaseStudent = { id: docRef.id, ...studentWithId }
      
      // Update local DB with Firebase data
      try {
        const allStudents = await getStudents(userId)
        await saveLocalStudents(allStudents)
      } catch (localError) {
        console.warn('Failed to update local DB after Firebase add:', localError)
      }
      
      return firebaseStudent
    } else {
      throw new Error('Firebase unavailable')
    }
  } catch (error) {
    console.warn('Firebase add failed, using local storage:', error)
    
    // Fallback to local storage
    if (isLocalDBSupported()) {
      const localStudent = { ...studentWithId, id: generateLocalId() }
      await addLocalStudent(localStudent)
      return localStudent
    } else {
      throw new Error('Failed to add student. Please check your connection and try again.')
    }
  }
}

export const addMultipleStudents = async (userId, studentsData) => {
  const studentsWithMetadata = studentsData.map(studentData => ({
    ...studentData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))

  try {
    // Try Firebase first
    if (isOnline && await checkFirebaseConnection()) {
      const batch = writeBatch(db)
      const studentsRef = collection(db, 'users', userId, 'students')
      
      studentsWithMetadata.forEach((studentData) => {
        const docRef = doc(studentsRef)
        batch.set(docRef, studentData)
      })
      
      await batch.commit()
      
      // Update local DB with Firebase data
      try {
        const allStudents = await getStudents(userId)
        await saveLocalStudents(allStudents)
      } catch (localError) {
        console.warn('Failed to update local DB after Firebase batch add:', localError)
      }
      
      return studentsWithMetadata
    } else {
      throw new Error('Firebase unavailable')
    }
  } catch (error) {
    console.warn('Firebase batch add failed, using local storage:', error)
    
    // Fallback to local storage
    if (isLocalDBSupported()) {
      const localStudents = studentsWithMetadata.map(student => ({
        ...student,
        id: generateLocalId()
      }))
      
      // Add each student to local DB
      for (const student of localStudents) {
        await addLocalStudent(student)
      }
      
      return localStudents
    } else {
      throw new Error('Failed to add students. Please check your connection and try again.')
    }
  }
}

export const getStudents = async (userId) => {
  try {
    // Try Firebase first
    if (isOnline && await checkFirebaseConnection()) {
      const q = collection(db, 'users', userId, 'students')
      const querySnapshot = await getDocs(q)
      const students = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      // Save to local DB after successful fetch from Firebase
      try {
        await saveLocalStudents(students)
      } catch (localError) {
        console.warn('Failed to save to local DB:', localError)
      }

      // Sort in memory to avoid Firestore index requirements
      return students.sort((a, b) => {
        if (a.year !== b.year) return a.year.localeCompare(b.year)
        if (a.division !== b.division) return a.division.localeCompare(b.division)
        return a.rollNumber.localeCompare(b.rollNumber)
      })
    } else {
      throw new Error('Firebase unavailable')
    }
  } catch (error) {
    console.warn('Firebase get failed, using local storage:', error)
    
    // Fallback to local DB
    if (isLocalDBSupported()) {
      const localStudents = await getLocalStudents()
      return localStudents.sort((a, b) => {
        if (a.year !== b.year) return a.year.localeCompare(b.year)
        if (a.division !== b.division) return a.division.localeCompare(b.division)
        return a.rollNumber.localeCompare(b.rollNumber)
      })
    } else {
      console.error('Local DB not supported and Firebase unavailable')
      return []
    }
  }
}

export const subscribeToStudents = (userId, callback) => {
  let unsubscribe = null
  
  try {
    // Try Firebase subscription first
    if (isOnline && firebaseConnected) {
      const q = collection(db, 'users', userId, 'students')
      
      unsubscribe = onSnapshot(q, (querySnapshot) => {
        const students = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        // Save to local DB after successful fetch from Firebase
        saveLocalStudents(students).catch(error => {
          console.warn('Failed to save to local DB during subscription:', error)
        })

        // Sort in memory to avoid Firestore index requirements
        const sortedStudents = students.sort((a, b) => {
          if (a.year !== b.year) return a.year.localeCompare(b.year)
          if (a.division !== b.division) return a.division.localeCompare(b.division)
          return a.rollNumber.localeCompare(b.rollNumber)
        })
        
        callback(sortedStudents)
      }, async (error) => {
        console.warn('Firebase subscription error, falling back to local DB:', error)
        firebaseConnected = false
        
        // Fallback to local DB
        if (isLocalDBSupported()) {
          try {
            const localStudents = await getLocalStudents()
            const sortedLocalStudents = localStudents.sort((a, b) => {
              if (a.year !== b.year) return a.year.localeCompare(b.year)
              if (a.division !== b.division) return a.division.localeCompare(b.division)
              return a.rollNumber.localeCompare(b.rollNumber)
            })
            callback(sortedLocalStudents)
          } catch (localError) {
            console.error('Local DB fallback failed:', localError)
            callback([])
          }
        } else {
          callback([])
        }
      })
      
      return unsubscribe
    } else {
      throw new Error('Firebase unavailable')
    }
  } catch (error) {
    console.warn('Firebase subscription setup failed, using local DB:', error)
    
    // Fallback to local DB with polling
    if (isLocalDBSupported()) {
      getLocalStudents().then(localStudents => {
        const sortedLocalStudents = localStudents.sort((a, b) => {
          if (a.year !== b.year) return a.year.localeCompare(b.year)
          if (a.division !== b.division) return a.division.localeCompare(b.division)
          return a.rollNumber.localeCompare(b.rollNumber)
        })
        callback(sortedLocalStudents)
      }).catch(localError => {
        console.error('Local DB fallback failed:', localError)
        callback([])
      })
    } else {
      callback([])
    }
    
    return () => {} // Return empty unsubscribe function
  }
}

export const updateStudent = async (userId, studentId, updateData) => {
  const updatedData = {
    ...updateData,
    updatedAt: new Date().toISOString()
  }

  try {
    // Try Firebase first
    if (isOnline && await checkFirebaseConnection()) {
      const studentRef = doc(db, 'users', userId, 'students', studentId)
      await updateDoc(studentRef, updatedData)
      
      // Update local DB
      try {
        await updateLocalStudent(studentId, updatedData)
      } catch (localError) {
        console.warn('Failed to update local DB:', localError)
      }
      
      return { id: studentId, ...updatedData }
    } else {
      throw new Error('Firebase unavailable')
    }
  } catch (error) {
    console.warn('Firebase update failed, using local storage:', error)
    
    // Fallback to local storage
    if (isLocalDBSupported()) {
      const updatedStudent = await updateLocalStudent(studentId, updatedData)
      return updatedStudent
    } else {
      throw new Error('Failed to update student. Please try again.')
    }
  }
}

// Attendance collection functions
export const addAttendanceRecord = async (userId, attendanceData) => {
  const recordWithMetadata = {
    ...attendanceData,
    createdAt: new Date().toISOString()
  }

  try {
    // Try Firebase first
    if (isOnline && await checkFirebaseConnection()) {
      const docRef = await addDoc(collection(db, 'users', userId, 'attendance'), recordWithMetadata)
      const firebaseRecord = { id: docRef.id, ...recordWithMetadata }
      
      // Update local DB
      try {
        await addLocalAttendanceRecord(firebaseRecord)
      } catch (localError) {
        console.warn('Failed to add to local DB:', localError)
      }
      
      return firebaseRecord
    } else {
      throw new Error('Firebase unavailable')
    }
  } catch (error) {
    console.warn('Firebase add attendance failed, using local storage:', error)
    
    // Fallback to local storage
    if (isLocalDBSupported()) {
      const localRecord = { ...recordWithMetadata, id: generateLocalId() }
      await addLocalAttendanceRecord(localRecord)
      return localRecord
    } else {
      throw new Error('Failed to save attendance. Please try again.')
    }
  }
}

export const addMultipleAttendanceRecords = async (userId, attendanceRecords) => {
  const recordsWithMetadata = attendanceRecords.map(record => ({
    ...record,
    createdAt: new Date().toISOString()
  }))

  try {
    // Try Firebase first
    if (isOnline && await checkFirebaseConnection()) {
      const batch = writeBatch(db)
      const attendanceRef = collection(db, 'users', userId, 'attendance')
      
      recordsWithMetadata.forEach((record) => {
        const docRef = doc(attendanceRef)
        batch.set(docRef, record)
      })
      
      await batch.commit()
      
      // Update local DB
      try {
        const allRecords = await getAttendanceRecords(userId)
        await saveLocalAttendanceRecords(allRecords)
      } catch (localError) {
        console.warn('Failed to update local DB after Firebase batch add:', localError)
      }
      
      return recordsWithMetadata
    } else {
      throw new Error('Firebase unavailable')
    }
  } catch (error) {
    console.warn('Firebase batch add attendance failed, using local storage:', error)
    
    // Fallback to local storage
    if (isLocalDBSupported()) {
      const localRecords = recordsWithMetadata.map(record => ({
        ...record,
        id: generateLocalId()
      }))
      
      // Add each record to local DB
      for (const record of localRecords) {
        await addLocalAttendanceRecord(record)
      }
      
      return localRecords
    } else {
      throw new Error('Failed to save attendance records. Please try again.')
    }
  }
}

export const getAttendanceRecords = async (userId, filters = {}) => {
  try {
    // Try Firebase first
    if (isOnline && await checkFirebaseConnection()) {
      const q = collection(db, 'users', userId, 'attendance')
      const querySnapshot = await getDocs(q)
      let records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      // Save to local DB after successful fetch from Firebase
      try {
        await saveLocalAttendanceRecords(records)
      } catch (localError) {
        console.warn('Failed to save attendance to local DB:', localError)
      }

      // Filter in memory
      if (filters.year) {
        records = records.filter(record => record.year === filters.year)
      }
      if (filters.division) {
        records = records.filter(record => record.division === filters.division)
      }
      if (filters.startDate) {
        records = records.filter(record => record.date >= filters.startDate)
      }
      if (filters.endDate) {
        records = records.filter(record => record.date <= filters.endDate)
      }
      
      // Sort by date descending
      return records.sort((a, b) => new Date(b.date) - new Date(a.date))
    } else {
      throw new Error('Firebase unavailable')
    }
  } catch (error) {
    console.warn('Firebase get attendance failed, using local storage:', error)
    
    // Fallback to local DB
    if (isLocalDBSupported()) {
      const localRecords = await getLocalAttendanceRecords()
      let records = localRecords
      
      // Filter in memory
      if (filters.year) {
        records = records.filter(record => record.year === filters.year)
      }
      if (filters.division) {
        records = records.filter(record => record.division === filters.division)
      }
      if (filters.startDate) {
        records = records.filter(record => record.date >= filters.startDate)
      }
      if (filters.endDate) {
        records = records.filter(record => record.date <= filters.endDate)
      }
      
      return records.sort((a, b) => new Date(b.date) - new Date(a.date))
    } else {
      console.error('Local DB not supported and Firebase unavailable')
      return []
    }
  }
}

export const subscribeToAttendanceRecords = (userId, callback, filters = {}) => {
  let unsubscribe = null
  
  try {
    // Try Firebase subscription first
    if (isOnline && firebaseConnected) {
      const q = collection(db, 'users', userId, 'attendance')
      
      unsubscribe = onSnapshot(q, (querySnapshot) => {
        let records = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        // Save to local DB after successful fetch from Firebase
        saveLocalAttendanceRecords(records).catch(error => {
          console.warn('Failed to save attendance to local DB during subscription:', error)
        })

        // Filter in memory
        if (filters.year) {
          records = records.filter(record => record.year === filters.year)
        }
        if (filters.division) {
          records = records.filter(record => record.division === filters.division)
        }
        
        // Sort by date descending
        const sortedRecords = records.sort((a, b) => new Date(b.date) - new Date(a.date))
        callback(sortedRecords)
      }, async (error) => {
        console.warn('Firebase attendance subscription error, falling back to local DB:', error)
        firebaseConnected = false
        
        // Fallback to local DB
        if (isLocalDBSupported()) {
          try {
            const localRecords = await getLocalAttendanceRecords()
            let records = localRecords
            
            // Filter in memory
            if (filters.year) {
              records = records.filter(record => record.year === filters.year)
            }
            if (filters.division) {
              records = records.filter(record => record.division === filters.division)
            }
            
            const sortedLocalRecords = records.sort((a, b) => new Date(b.date) - new Date(a.date))
            callback(sortedLocalRecords)
          } catch (localError) {
            console.error('Local DB attendance fallback failed:', localError)
            callback([])
          }
        } else {
          callback([])
        }
      })
      
      return unsubscribe
    } else {
      throw new Error('Firebase unavailable')
    }
  } catch (error) {
    console.warn('Firebase attendance subscription setup failed, using local DB:', error)
    
    // Fallback to local DB with polling
    if (isLocalDBSupported()) {
      getLocalAttendanceRecords().then(localRecords => {
        let records = localRecords
        
        if (filters.year) {
          records = records.filter(record => record.year === filters.year)
        }
        if (filters.division) {
          records = records.filter(record => record.division === filters.division)
        }
        
        const sortedLocalRecords = records.sort((a, b) => new Date(b.date) - new Date(a.date))
        callback(sortedLocalRecords)
      }).catch(localError => {
        console.error('Local DB attendance fallback failed:', localError)
        callback([])
      })
    } else {
      callback([])
    }
    
    return () => {} // Return empty unsubscribe function
  }
}

export const updateAttendanceRecord = async (userId, recordId, updateData) => {
  const updatedData = {
    ...updateData,
    updatedAt: new Date().toISOString()
  }

  try {
    // Try Firebase first
    if (isOnline && await checkFirebaseConnection()) {
      const recordRef = doc(db, 'users', userId, 'attendance', recordId)
      await updateDoc(recordRef, updatedData)
      return { id: recordId, ...updatedData }
    } else {
      throw new Error('Firebase unavailable')
    }
  } catch (error) {
    console.warn('Firebase update attendance failed:', error)
    throw new Error('Failed to update attendance record. Please try again.')
  }
}

export const deleteAttendanceRecord = async (userId, recordId) => {
  try {
    // Try Firebase first
    if (isOnline && await checkFirebaseConnection()) {
      await deleteDoc(doc(db, 'users', userId, 'attendance', recordId))
      return recordId
    } else {
      throw new Error('Firebase unavailable')
    }
  } catch (error) {
    console.warn('Firebase delete attendance failed:', error)
    throw new Error('Failed to delete attendance record. Please try again.')
  }
}

// Utility functions
export const getStudentsByClass = async (userId, year, division) => {
  try {
    // Try Firebase first
    if (isOnline && await checkFirebaseConnection()) {
      const q = query(
        collection(db, 'users', userId, 'students'),
        where('year', '==', year),
        where('division', '==', division)
      )
      const querySnapshot = await getDocs(q)
      const students = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      // Sort by roll number
      return students.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber))
    } else {
      throw new Error('Firebase unavailable')
    }
  } catch (error) {
    console.warn('Firebase get students by class failed, using local storage:', error)
    
    // Fallback to local DB
    if (isLocalDBSupported()) {
      const filteredStudents = await getLocalStudentsByClass(year, division)
      return filteredStudents.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber))
    } else {
      console.error('Local DB not supported and Firebase unavailable')
      return []
    }
  }
}

export const getAttendanceByDateAndClass = async (userId, date, year, division) => {
  try {
    // Try Firebase first
    if (isOnline && await checkFirebaseConnection()) {
      const q = query(
        collection(db, 'users', userId, 'attendance'),
        where('date', '==', date),
        where('year', '==', year),
        where('division', '==', division)
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } else {
      throw new Error('Firebase unavailable')
    }
  } catch (error) {
    console.warn('Firebase get attendance by date and class failed, using local storage:', error)
    
    // Fallback to local DB
    if (isLocalDBSupported()) {
      return await getLocalAttendanceByDateAndClass(date, year, division)
    } else {
      console.error('Local DB not supported and Firebase unavailable')
      return []
    }
  }
}

// Connection status functions
export const getConnectionStatus = () => ({
  online: isOnline,
  firebaseConnected: firebaseConnected,
  localDBSupported: isLocalDBSupported()
})

export const forceFirebaseReconnect = async () => {
  firebaseConnected = await checkFirebaseConnection()
  return firebaseConnected
}

// Delete student functions
export const deleteStudent = async (userId, studentId) => {
  try {
    // Try Firebase first
    if (isOnline && await checkFirebaseConnection()) {
      const studentRef = doc(db, 'users', userId, 'students', studentId)
      await deleteDoc(studentRef)
      
      // Also delete from local DB
      try {
        await deleteLocalStudent(studentId)
      } catch (localError) {
        console.warn('Failed to delete from local DB:', localError)
      }
      
      return true
    } else {
      throw new Error('Firebase unavailable')
    }
  } catch (error) {
    console.warn('Firebase delete failed, using local storage:', error)
    
    // Fallback to local storage
    if (isLocalDBSupported()) {
      await deleteLocalStudent(studentId)
      return true
    } else {
      console.error('Local DB not supported and Firebase unavailable')
      throw new Error('Unable to delete student: no storage available')
    }
  }
}

export const deleteMultipleStudents = async (userId, studentIds) => {
  try {
    // Try Firebase first
    if (isOnline && await checkFirebaseConnection()) {
      const batch = writeBatch(db)
      
      studentIds.forEach((studentId) => {
        const studentRef = doc(db, 'users', userId, 'students', studentId)
        batch.delete(studentRef)
      })
      
      await batch.commit()
      
      // Also delete from local DB
      try {
        for (const studentId of studentIds) {
          await deleteLocalStudent(studentId)
        }
      } catch (localError) {
        console.warn('Failed to delete from local DB:', localError)
      }
      
      return true
    } else {
      throw new Error('Firebase unavailable')
    }
  } catch (error) {
    console.warn('Firebase batch delete failed, using local storage:', error)
    
    // Fallback to local storage
    if (isLocalDBSupported()) {
      for (const studentId of studentIds) {
        await deleteLocalStudent(studentId)
      }
      return true
    } else {
      console.error('Local DB not supported and Firebase unavailable')
      throw new Error('Unable to delete students: no storage available')
    }
  }
}

