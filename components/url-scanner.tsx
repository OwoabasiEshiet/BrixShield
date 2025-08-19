'use client'

import { useState } from 'react'
import { Scan, Globe, Shield, AlertTriangle, CheckCircle, Loader2, ExternalLink, Brain, Copy, History, Download, ChevronDown, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { scanStore } from '@/lib/scan-store'
import { downloadSingleScanReport } from '@/lib/report-utils'

interface ScanResult {
  url: string
  score: number
  status: 'safe' | 'warning' | 'threat'
  threats: string[]
  recommendations: string[]
  details: {
    ssl: boolean
    reputation: number
    malware: boolean
    phishing: boolean
    suspicious: boolean
  }
  aiRecommendations?: string
  scanId?: string
}

export default function UrlScanner() {
  const [url, setUrl] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const { toast } = useToast()

  const validateUrl = (inputUrl: string): string | null => {
    try {
      // Add protocol if missing
      const urlToTest = inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`
      const parsed = new URL(urlToTest)
      
      // Basic validation
      if (!parsed.hostname.includes('.')) {
        throw new Error('Invalid domain')
      }
      
      return urlToTest
    } catch {
      return null
    }
  }

  const handleScan = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to scan",
        variant: "destructive"
      })
      return
    }

    const formattedUrl = validateUrl(url.trim())
    if (!formattedUrl) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (e.g., example.com or https://example.com)",
        variant: "destructive"
      })
      return
    }

    setIsScanning(true)
    setScanProgress(0)
    setResult(null)

    // Simulate realistic scanning progress
    const progressSteps = [
      { step: 'Resolving DNS...', progress: 15 },
      { step: 'Checking SSL certificate...', progress: 30 },
      { step: 'Analyzing reputation...', progress: 50 },
      { step: 'Scanning for malware...', progress: 70 },
      { step: 'Checking phishing databases...', progress: 85 },
      { step: 'Finalizing results...', progress: 100 }
    ]

    for (const { step, progress } of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400))
      setScanProgress(progress)
    }

    try {
      const response = await fetch('/api/scan-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formattedUrl })
      })

      if (!response.ok) {
        throw new Error('Scan failed')
      }

      const scanResult = await response.json()
      
      // Add to scan history using the store
      const savedScan = scanStore.addScan({
        type: 'url',
        target: scanResult.url,
        score: scanResult.score,
        status: scanResult.status,
        threats: scanResult.threats,
        details: scanResult.details
      })

      // Include the scan ID for AI recommendations
      const resultWithId = { ...scanResult, scanId: savedScan.id }
      setResult(resultWithId)

      toast({
        title: "Scan Complete",
        description: `URL scan completed with ${scanResult.score}% security score`,
        variant: scanResult.status === 'threat' ? "destructive" : "default"
      })

    } catch (error) {
      console.error('Scan error:', error)
      toast({
        title: "Scan Failed",
        description: "Unable to complete the scan. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsScanning(false)
    }
  }

  const generateRecommendations = async () => {
    if (!result) return

    setIsGeneratingAI(true)
    try {
      const response = await fetch('/api/ai-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'url', data: result })
      })

      if (!response.ok) {
        throw new Error('Generation failed')
      }

      const { recommendations } = await response.json()
      
      // Update the result state
      setResult(prev => prev ? { ...prev, aiRecommendations: recommendations } : null)

      // Update the scan in the store if we have a scanId
      if (result.scanId) {
        scanStore.updateScan(result.scanId, { aiRecommendations: recommendations })
      }

      toast({
        title: "Analysis Complete",
        description: "Security recommendations generated successfully"
      })

    } catch (error) {
      console.error('AI generation error:', error)
      toast({
        title: "Generation Failed",
        description: "Unable to generate recommendations. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Content copied to clipboard"
    })
  }

  const handleDownloadReport = (format: 'json' | 'html') => {
    if (!result || !result.scanId) {
      toast({
        title: "No Scan Data",
        description: "Please complete a scan first",
        variant: "destructive"
      })
      return
    }

    try {
      // Convert result to scan format for download
      const scanData = {
        id: result.scanId,
        type: 'url' as const,
        target: result.url,
        score: result.score,
        status: result.status,
        timestamp: Date.now(),
        threats: result.threats,
        details: result.details,
        aiRecommendations: result.aiRecommendations
      }

      downloadSingleScanReport(scanData, format)
      toast({
        title: "Download Complete",
        description: `Scan report downloaded as ${format.toUpperCase()}`
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download scan report. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-600 bg-green-50 border-green-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'threat': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="h-5 w-5" />
      case 'warning': return <AlertTriangle className="h-5 w-5" />
      case 'threat': return <Shield className="h-5 w-5" />
      default: return <Globe className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Scanner Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-blue-800">URL Security Scanner</CardTitle>
              <CardDescription className="text-blue-700">
                Analyze websites for security threats, malware, and phishing risks
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* URL Input */}
      <Card>
        <CardHeader>
          <CardTitle>Enter URL to Scan</CardTitle>
          <CardDescription>
            Enter a website URL to analyze its security status and potential threats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                type="url"
                placeholder="Enter URL (e.g., example.com or https://example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isScanning && handleScan()}
                disabled={isScanning}
                className="text-base"
              />
            </div>
            <Button 
              onClick={handleScan} 
              disabled={isScanning || !url.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isScanning ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Scan className="h-4 w-4 mr-2" />
              )}
              {isScanning ? 'Scanning...' : 'Scan URL'}
            </Button>
          </div>

          {isScanning && (
            <div className="space-y-2">
              <Progress value={scanProgress} className="w-full" />
              <p className="text-sm text-slate-600 text-center">
                Scanning in progress... {scanProgress}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(result.status)}
                <span>Scan Results</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(result.url)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(result.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Site
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Download Format</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDownloadReport('json')}>
                      <Code className="h-4 w-4 mr-2" />
                      JSON Report
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownloadReport('html')}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      HTML Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Status */}
            <div className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg capitalize">{result.status}</h3>
                  <p className="text-sm opacity-80">Security Score: {result.score}%</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{result.score}%</div>
                  <Progress value={result.score} className="w-24 mt-1" />
                </div>
              </div>
            </div>

            {/* Security Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Security Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>SSL Certificate</span>
                    {result.details.ssl ? (
                      <Badge className="bg-green-100 text-green-800">Valid</Badge>
                    ) : (
                      <Badge variant="destructive">Missing</Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Domain Reputation</span>
                    <Badge variant="outline">{result.details.reputation}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Malware Detection</span>
                    {result.details.malware ? (
                      <Badge variant="destructive">Detected</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">Clean</Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Phishing Risk</span>
                    {result.details.phishing ? (
                      <Badge variant="destructive">High Risk</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">Low Risk</Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Suspicious Activity</span>
                    {result.details.suspicious ? (
                      <Badge variant="destructive">Detected</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">None</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Threat Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {result.threats.length > 0 ? (
                    <div className="space-y-2">
                      {result.threats.map((threat, index) => (
                        <Alert key={index} className="border-red-200 bg-red-50">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-red-800 text-sm">
                            {threat}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-green-700 font-medium">No threats detected</p>
                      <p className="text-green-600 text-sm">This URL appears to be safe</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Security Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <span>AI Security Recommendations</span>
                  </div>
                  {!result.aiRecommendations && (
                    <Button
                      onClick={generateRecommendations}
                      disabled={isGeneratingAI}
                      variant="outline"
                      size="sm"
                    >
                      {isGeneratingAI ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Brain className="h-4 w-4 mr-2" />
                      )}
                      Generate Recommendations
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.aiRecommendations ? (
                  <div className="space-y-3">
                    <Textarea
                      value={result.aiRecommendations}
                      readOnly
                      className="min-h-[120px] bg-purple-50 border-purple-200"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(result.aiRecommendations || '')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Recommendations
                    </Button>
                  </div>
                ) : (
                  <p className="text-slate-600 text-center py-4">
                    Click "Generate AI Analysis" to get personalized security recommendations
                  </p>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <History className="h-6 w-6 text-blue-600" />
              <span>View Scan History</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Shield className="h-6 w-6 text-green-600" />
              <span>Security Tips</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <span>Report Threat</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
