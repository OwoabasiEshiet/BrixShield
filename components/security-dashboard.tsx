'use client'

import { useState, useEffect } from 'react'
import { Shield, AlertTriangle, CheckCircle, TrendingUp, Activity, Globe, FileText, Clock, Users, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { scanStore, ScanResult } from '@/lib/scan-store'

export default function SecurityDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    safe: 0,
    warnings: 0,
    threats: 0,
    totalThreats: 0,
    averageScore: 0,
    urlScans: 0,
    fileScans: 0
  })
  const [recentScans, setRecentScans] = useState<ScanResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const updateData = () => {
      setStats(scanStore.getStats())
      setRecentScans(scanStore.getRecentScans(5))
      setIsLoading(false)
    }

    // Initial load
    updateData()

    // Subscribe to changes
    const unsubscribe = scanStore.subscribe(updateData)

    return unsubscribe
  }, [])

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diffMs = now - timestamp
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'threat':
        return <Shield className="h-4 w-4 text-red-600" />
      default:
        return <Shield className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'threat':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const securityScore = stats.total > 0 ? Math.round(
    ((stats.safe * 100) + (stats.warnings * 60) + (stats.threats * 20)) / (stats.total * 100) * 100
  ) : 100

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center space-y-4 py-8">
        <h2 className="text-3xl font-bold text-slate-800">Security Overview</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Monitor your security posture with real-time threat detection and AI-powered analysis
        </p>
        {stats.total === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-blue-800 text-sm">
              Start scanning URLs or files to see your security dashboard populate with real data
            </p>
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Security Score */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{securityScore}%</div>
            <Progress value={securityScore} className="mt-2 bg-blue-200" />
            <p className="text-xs text-blue-700 mt-2">
              {securityScore >= 90 ? 'Excellent' : securityScore >= 70 ? 'Good' : securityScore >= 50 ? 'Fair' : 'Needs Attention'}
            </p>
          </CardContent>
        </Card>

        {/* Total Scans */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Scans</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-green-700 mt-2">
              {stats.today > 0 ? `+${stats.today} today` : 'No scans today'}
            </p>
          </CardContent>
        </Card>

        {/* Threats Blocked */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Threats Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{stats.totalThreats}</div>
            <p className="text-xs text-red-700 mt-2">
              {stats.threats} high-risk items
            </p>
          </CardContent>
        </Card>

        {/* Active Protection */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{stats.thisWeek}</div>
            <p className="text-xs text-purple-700 mt-2">
              Scans completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>Scan Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Safe</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{stats.safe}</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: stats.total > 0 ? `${(stats.safe / stats.total) * 100}%` : '0%' }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Warnings</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{stats.warnings}</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: stats.total > 0 ? `${(stats.warnings / stats.total) * 100}%` : '0%' }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Threats</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{stats.threats}</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: stats.total > 0 ? `${(stats.threats / stats.total) * 100}%` : '0%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.urlScans}</div>
                  <div className="text-xs text-slate-600">URL Scans</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.fileScans}</div>
                  <div className="text-xs text-slate-600">File Scans</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>
              Latest security scans and their results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentScans.length > 0 ? (
              <div className="space-y-3">
                {recentScans.map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                    <div className="flex items-center space-x-3">
                      {scan.type === 'url' ? (
                        <Globe className="h-4 w-4 text-blue-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-green-600" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate" title={scan.target}>
                          {scan.target}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatTimeAgo(scan.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(scan.status)}
                      <Badge className={getStatusColor(scan.status)}>
                        {scan.score}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-600 mb-1">No recent activity</h3>
                <p className="text-xs text-gray-500">
                  Start scanning URLs or files to see activity here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-xl font-bold text-slate-800">{stats.averageScore}%</div>
              <div className="text-sm text-slate-600">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-slate-800">{stats.today}</div>
              <div className="text-sm text-slate-600">Scans Today</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-slate-800">{stats.thisWeek}</div>
              <div className="text-sm text-slate-600">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-slate-800">{stats.thisMonth}</div>
              <div className="text-sm text-slate-600">This Month</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
