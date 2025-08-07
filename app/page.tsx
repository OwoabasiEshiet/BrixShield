'use client'

import { useState } from 'react'
import { Shield, Scan, FileText, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import UrlScanner from '@/components/url-scanner'
import FileScanner from '@/components/file-scanner'
import SecurityDashboard from '@/components/security-dashboard'
import ScanHistory from '@/components/scan-history'

export default function BrixShieldApp() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Shield className="h-8 w-8 text-blue-600" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  BrixShield
                </h1>
                <p className="text-sm text-slate-500">Advanced Security Scanner</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                System Active
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-white/60 backdrop-blur-sm border border-slate-200/60">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="url-scan" className="flex items-center space-x-2">
              <Scan className="h-4 w-4" />
              <span>URL Scanner</span>
            </TabsTrigger>
            <TabsTrigger value="file-scan" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>File Scanner</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Scan History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <SecurityDashboard />
          </TabsContent>

          <TabsContent value="url-scan" className="space-y-6">
            <UrlScanner />
          </TabsContent>

          <TabsContent value="file-scan" className="space-y-6">
            <FileScanner />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <ScanHistory />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
