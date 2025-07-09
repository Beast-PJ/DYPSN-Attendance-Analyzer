import { useState, useEffect } from 'react'
import { getConnectionStatus, forceFirebaseReconnect } from '../firebase/services'
import { getLocalDBInfo } from '../database/localDB'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { 
  Wifi, 
  WifiOff, 
  Database, 
  HardDrive, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Info
} from 'lucide-react'

const ConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    online: navigator.onLine,
    firebaseConnected: true,
    localDBSupported: false
  })
  const [localDBInfo, setLocalDBInfo] = useState({
    supported: false,
    studentsCount: 0,
    attendanceCount: 0,
    lastUpdated: null
  })
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Update connection status
  const updateStatus = async () => {
    const status = getConnectionStatus()
    setConnectionStatus(status)
    
    const dbInfo = await getLocalDBInfo()
    setLocalDBInfo(dbInfo)
  }

  // Handle reconnect attempt
  const handleReconnect = async () => {
    setIsReconnecting(true)
    try {
      await forceFirebaseReconnect()
      await updateStatus()
    } catch (error) {
      console.error('Reconnect failed:', error)
    } finally {
      setIsReconnecting(false)
    }
  }

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => updateStatus()
    const handleOffline = () => updateStatus()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial status check
    updateStatus()

    // Periodic status check
    const interval = setInterval(updateStatus, 30000) // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const getStatusColor = (isConnected) => {
    return isConnected ? 'text-green-600' : 'text-red-600'
  }

  const getStatusIcon = (isConnected) => {
    return isConnected ? CheckCircle : XCircle
  }

  const getStatusBadge = (isConnected, label) => {
    return (
      <Badge 
        variant={isConnected ? "default" : "destructive"}
        className={isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
      >
        {label}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Quick Status Bar */}
      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {connectionStatus.online ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm font-medium">
              {connectionStatus.online ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Database className={`h-4 w-4 ${getStatusColor(connectionStatus.firebaseConnected)}`} />
            <span className="text-sm font-medium">
              Firebase {connectionStatus.firebaseConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <HardDrive className={`h-4 w-4 ${getStatusColor(connectionStatus.localDBSupported)}`} />
            <span className="text-sm font-medium">
              Local DB {connectionStatus.localDBSupported ? 'Available' : 'Unavailable'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={handleReconnect}
            disabled={isReconnecting}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isReconnecting ? 'animate-spin' : ''}`} />
            {isReconnecting ? 'Reconnecting...' : 'Reconnect'}
          </Button>
          
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="ghost"
            size="sm"
          >
            <Info className="h-4 w-4 mr-2" />
            {showDetails ? 'Hide' : 'Details'}
          </Button>
        </div>
      </div>

      {/* Connection Alerts */}
      {!connectionStatus.online && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            You are currently offline. The app will use local storage and sync when connection is restored.
          </AlertDescription>
        </Alert>
      )}

      {connectionStatus.online && !connectionStatus.firebaseConnected && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Firebase connection failed. Using local storage as fallback. Data will sync when connection is restored.
          </AlertDescription>
        </Alert>
      )}

      {!connectionStatus.localDBSupported && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Local database is not supported in this browser. Offline functionality will be limited.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Status */}
      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Network Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm">
                {connectionStatus.online ? (
                  <Wifi className="h-4 w-4 mr-2 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 mr-2 text-red-600" />
                )}
                Network Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Connection</span>
                  {getStatusBadge(connectionStatus.online, connectionStatus.online ? 'Online' : 'Offline')}
                </div>
                <div className="text-xs text-gray-500">
                  {connectionStatus.online 
                    ? 'Internet connection is available'
                    : 'No internet connection detected'
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Firebase Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm">
                <Database className={`h-4 w-4 mr-2 ${getStatusColor(connectionStatus.firebaseConnected)}`} />
                Firebase Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Connection</span>
                  {getStatusBadge(connectionStatus.firebaseConnected, connectionStatus.firebaseConnected ? 'Connected' : 'Disconnected')}
                </div>
                <div className="text-xs text-gray-500">
                  {connectionStatus.firebaseConnected 
                    ? 'Real-time sync is active'
                    : 'Using local storage fallback'
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Local Database Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm">
                <HardDrive className={`h-4 w-4 mr-2 ${getStatusColor(connectionStatus.localDBSupported)}`} />
                Local Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Support</span>
                  {getStatusBadge(connectionStatus.localDBSupported, connectionStatus.localDBSupported ? 'Available' : 'Unavailable')}
                </div>
                {connectionStatus.localDBSupported && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Students</span>
                      <span className="text-xs font-medium">{localDBInfo.studentsCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Attendance</span>
                      <span className="text-xs font-medium">{localDBInfo.attendanceCount}</span>
                    </div>
                    {localDBInfo.lastUpdated && (
                      <div className="text-xs text-gray-500">
                        Last updated: {new Date(localDBInfo.lastUpdated).toLocaleString()}
                      </div>
                    )}
                  </>
                )}
                <div className="text-xs text-gray-500">
                  {connectionStatus.localDBSupported 
                    ? 'Offline functionality enabled'
                    : 'Requires modern browser support'
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ConnectionStatus

