'use client'

import { useState, useEffect } from 'react'
import { Shield, AlertTriangle, CheckCircle, TrendingUp, Activity, Globe, FileText, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { scanStore, ScanResult } from '@/lib/scan-store'

export default function SecurityDashboard() {
  const [scans, setScans] = useState<ScanResult[]>([])

  useEffect(() => {
    setScans(scanStore.getAllScans())
  }, [])

  // Calculate statistics
  const stats = {
    total: scans.length,
    safe: scans.filter(scan => scan.score >= 80).length,
    warnings: scans.filter(scan => scan.score >= 50 && scan.score < 80).length,
    threats: scans.filter(scan => scan.score < 50).length,
    totalThreats: scans.filter(scan => scan.score < 50).length,
    averageScore: scans.length > 0 ? Math.round(scans.reduce((acc, scan) => acc + scan.score, 0) / scans.length) : 0,
    today: scans.filter(scan => {
      const today = new Date().toDateString()
      return new Date(scan.timestamp).toDateString() === today
    }).length,
    thisWeek: scans.filter(scan => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return new Date(scan.timestamp) > weekAgo
    }).length,
    thisMonth: scans.filter(scan => {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return new Date(scan.timestamp) > monthAgo
    }).length,
    urlScans: scans.filter(scan => scan.type === 'url').length,
    fileScans: scans.filter(scan => scan.type === 'file').length,
  }

  const securityScore = Math.max(0, Math.min(100, stats.averageScore))
  const recentScans = scans.slice(-10).reverse()

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'safe':
      case 'clean':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'warning':
      case 'suspicious':
        return <AlertTriangle className="h-4 w-4 text-warning" />
      default:
        return <AlertTriangle className="h-4 w-4 text-destructive" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'safe':
      case 'clean':
        return 'success'
      case 'warning':
      case 'suspicious':
        return 'warning'
      default:
        return 'destructive'
    }
  }

  const formatTimeAgo = (timestamp: string | number) => {
    const now = new Date()
    const scanTime = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - scanTime.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Security Overview</h1>
            <p className="text-muted-foreground">Monitor your security posture and recent activity</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Security Score */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{securityScore}%</div>
            <Progress value={securityScore} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {securityScore >= 90 ? 'Excellent' : securityScore >= 70 ? 'Good' : securityScore >= 50 ? 'Fair' : 'Needs Attention'}
            </p>
          </CardContent>
        </Card>

        {/* Total Scans */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.today > 0 ? `+${stats.today} today` : 'No scans today'}
            </p>
          </CardContent>
        </Card>

        {/* Threats Detected */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Threats Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalThreats}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.threats} high-risk items
            </p>
          </CardContent>
        </Card>

        {/* This Week */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground mt-2">
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
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Scan Distribution</span>
            </CardTitle>
            <CardDescription>
              Breakdown of scan results and threat levels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm">Safe</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium">{stats.safe}</div>
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div 
                      className="bg-success h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${stats.total ? (stats.safe / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-sm">Warnings</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium">{stats.warnings}</div>
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div 
                      className="bg-warning h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${stats.total ? (stats.warnings / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm">Threats</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium">{stats.threats}</div>
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div 
                      className="bg-destructive h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${stats.total ? (stats.threats / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{stats.urlScans}</div>
                  <div className="text-xs text-muted-foreground">URL Scans</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">{stats.fileScans}</div>
                  <div className="text-xs text-muted-foreground">File Scans</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
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
                  <div key={scan.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      {scan.type === 'url' ? (
                        <Globe className="h-4 w-4 text-primary" />
                      ) : (
                        <FileText className="h-4 w-4 text-success" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate" title={scan.target}>
                          {scan.target}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(scan.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(scan.status)}
                      <Badge variant={getStatusColor(scan.status)}>
                        {scan.score}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-sm font-medium text-foreground mb-1">No recent activity</h3>
                <p className="text-xs text-muted-foreground">
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
          <CardTitle>Statistics Overview</CardTitle>
          <CardDescription>
            Comprehensive view of your security scanning metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">{stats.averageScore}%</div>
              <div className="text-sm text-muted-foreground">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">{stats.today}</div>
              <div className="text-sm text-muted-foreground">Scans Today</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">{stats.thisWeek}</div>
              <div className="text-sm text-muted-foreground">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">{stats.thisMonth}</div>
              <div className="text-sm text-muted-foreground">This Month</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
