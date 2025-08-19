'use client'

import { useState } from 'react'
import { Shield, Scan, FileText, TrendingUp, AlertTriangle, CheckCircle, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import UrlScanner from '@/components/url-scanner'
import FileScanner from '@/components/file-scanner'
import SecurityDashboard from '@/components/security-dashboard'
import ScanHistory from '@/components/scan-history'

export default function SecureMyURLApp() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-background">
      {/* Professional Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="relative p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-6 w-6 text-primary" />
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-success rounded-full animate-pulse" />
                  </div>
                  <div>
            <h1 className="text-xl font-semibold text-foreground">
              Secure my URL
                    </h1>
                    <p className="text-sm text-muted-foreground">Security Scanner</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="success" className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                System Active
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Professional Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 h-12">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <TrendingUp className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="url-scanner" className="flex items-center space-x-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Scan className="h-4 w-4" />
              <span>URL Scanner</span>
            </TabsTrigger>
            <TabsTrigger value="file-scanner" className="flex items-center space-x-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <FileText className="h-4 w-4" />
              <span>File Scanner</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Activity className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <SecurityDashboard />
          </TabsContent>

          <TabsContent value="url-scanner" className="space-y-6">
            <UrlScanner />
          </TabsContent>

          <TabsContent value="file-scanner" className="space-y-6">
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
