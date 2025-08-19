'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, Shield, AlertTriangle, CheckCircle, Loader2, X, Brain, Copy, Download, Trash2, ChevronDown, Code, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { downloadSingleScanReport } from '@/lib/report-utils'

interface FileResult {
  name: string
  size: number
  type: string
  score: number
  status: 'safe' | 'warning' | 'threat'
  threats: string[]
  details: {
    virus: boolean
    malware: boolean
    suspicious: boolean
    encrypted: boolean
  }
  scanId: string
  timestamp: string
  aiRecommendations?: string
}

export default function FileScanner() {
  const [files, setFiles] = useState<File[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [results, setResults] = useState<FileResult[]>([])
  const [isGeneratingAI, setIsGeneratingAI] = useState<string | null>(null)
  const [currentScanning, setCurrentScanning] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    
    // Filter out files that are too large
    const validFiles = droppedFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive"
        })
        return false
      }
      return true
    })

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
      toast({
        title: "Files Added",
        description: `${validFiles.length} file(s) added for scanning`
      })
    }
  }, [toast])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    const validFiles = selectedFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive"
        })
        return false
      }
      return true
    })

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
      toast({
        title: "Files Added",
        description: `${validFiles.length} file(s) added for scanning`
      })
    }

    // Reset input
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearAllFiles = () => {
    setFiles([])
    setResults([])
    setScanProgress(0)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleScanFiles = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to scan",
        variant: "destructive"
      })
      return
    }

    setIsScanning(true)
    setScanProgress(0)
    setResults([])

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setCurrentScanning(file.name)
        
        // Update progress
        const baseProgress = (i / files.length) * 100
        setScanProgress(baseProgress)

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/scan-file', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to scan ${file.name}`)
        }

        const result = await response.json()
        
        setResults(prev => [...prev, result])
        
        // Save to local storage for history
        const history = JSON.parse(localStorage.getItem('scanHistory') || '[]')
        history.unshift({
          id: result.scanId,
          type: 'file',
          target: result.name,
          score: result.score,
          status: result.status,
          date: new Date().toLocaleString(),
          threats: result.threats.length
        })
        localStorage.setItem('scanHistory', JSON.stringify(history.slice(0, 50)))
        
        setScanProgress(((i + 1) / files.length) * 100)
      }

      toast({
        title: "Scan Complete",
        description: `Successfully scanned ${files.length} file(s)`,
      })
    } catch (error) {
      console.error('Scan error:', error)
      toast({
        title: "Scan Failed",
        description: "Unable to complete file scanning",
        variant: "destructive"
      })
    } finally {
      setIsScanning(false)
      setCurrentScanning(null)
      setScanProgress(100)
    }
  }

  const handleGenerateAnalysis = async (result: FileResult) => {
    setIsGeneratingAI(result.scanId)
    try {
      const response = await fetch('/api/ai-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'file',
          data: result
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate recommendations')
      }

      const { recommendations } = await response.json()
      setResults(prev => prev.map(r => 
        r.scanId === result.scanId 
          ? { ...r, aiRecommendations: recommendations }
          : r
      ))
      
      toast({
        title: "Analysis Complete",
        description: "Security recommendations generated",
      })
    } catch (error) {
      console.error('AI recommendations error:', error)
      toast({
        title: "Analysis Failed",
        description: "Unable to generate recommendations",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingAI(null)
    }
  }

  const handleDownloadReport = (result: FileResult, format: 'json' | 'html') => {
    try {
      // Convert result to scan format for download
      const scanData = {
        id: result.scanId,
        type: 'file' as const,
        target: result.name,
        score: result.score,
        status: result.status,
        timestamp: new Date(result.timestamp).getTime(),
        threats: result.threats,
        details: {
          malware: result.details.malware,
          suspicious: result.details.suspicious,
          virus: result.details.virus,
          encrypted: result.details.encrypted
        },
        size: result.size,
        aiRecommendations: result.aiRecommendations
      }

      downloadSingleScanReport(scanData, format)
      toast({
        title: "Download Complete",
        description: `File scan report downloaded as ${format.toUpperCase()}`
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download scan report. Please try again.",
        variant: "destructive"
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Content copied to clipboard",
    })
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
      default: return <FileText className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Scanner Header */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Upload className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-green-800">File Security Scanner</CardTitle>
              <CardDescription className="text-green-700">
                Upload and analyze files for viruses, malware, and security threats
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* File Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files for Scanning</CardTitle>
          <CardDescription>
            Drag and drop files here or click to browse. Maximum file size: 10MB per file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              Drop files here or click to browse
            </h3>
            <p className="text-slate-500 mb-4">
              Supports all common file types • Max 10MB per file
            </p>
            <Button variant="outline" className="mx-auto">
              <Upload className="h-4 w-4 mr-2" />
              Choose Files
            </Button>
            <input
              id="file-input"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInput}
              accept="*/*"
            />
          </div>
        </CardContent>
      </Card>

      {/* Selected Files */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Selected Files ({files.length})</CardTitle>
                <CardDescription>
                  Files ready for security scanning
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleScanFiles}
                  disabled={isScanning}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Scan All Files
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={clearAllFiles} disabled={isScanning}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {currentScanning === file.name && (
                      <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isScanning}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scanning Progress */}
      {isScanning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-green-600" />
              <span>Scanning in Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {currentScanning ? `Scanning: ${currentScanning}` : 'Scanning files...'}
                </span>
                <span className="text-sm text-gray-500">{Math.round(scanProgress)}%</span>
              </div>
              <Progress value={scanProgress} className="w-full" />
              <div className="text-xs text-gray-500 space-y-1">
                <div>• Analyzing file signatures and content</div>
                <div>• Checking for malware and viruses</div>
                <div>• Evaluating security risks</div>
                <div>• Generating security recommendations</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan Results */}
      {results.length > 0 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Scan Results ({results.length} files)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {results.filter(r => r.status === 'safe').length}
                  </div>
                  <div className="text-sm text-green-700">Safe Files</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {results.filter(r => r.status === 'warning').length}
                  </div>
                  <div className="text-sm text-yellow-700">Warnings</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {results.filter(r => r.status === 'threat').length}
                  </div>
                  <div className="text-sm text-red-700">Threats</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Individual File Results */}
          {results.map((result) => (
            <Card key={result.scanId} className={`border-l-4 ${
              result.status === 'safe' ? 'border-l-green-500' :
              result.status === 'warning' ? 'border-l-yellow-500' : 'border-l-red-500'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(result.status)}`}>
                      {getStatusIcon(result.status)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{result.name}</CardTitle>
                      <CardDescription>
                        {formatFileSize(result.size)} • {result.type || 'Unknown type'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(result.status)}>
                      {result.status.toUpperCase()} • {result.score}%
                    </Badge>
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
                        <DropdownMenuItem onClick={() => handleDownloadReport(result, 'json')}>
                          <Code className="h-4 w-4 mr-2" />
                          JSON Report
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadReport(result, 'html')}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          HTML Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Security Details */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Security Analysis</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Virus Scan</span>
                        {!result.details.virus ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Malware Check</span>
                        {!result.details.malware ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Content Analysis</span>
                        {!result.details.suspicious ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Encryption</span>
                        {result.details.encrypted ? (
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Security Score</span>
                        <span className="text-lg font-bold">{result.score}%</span>
                      </div>
                      <Progress value={result.score} className="w-full" />
                    </div>
                  </div>

                  {/* Threats and Actions */}
                  <div className="space-y-4">
                    {result.threats.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-800 mb-2">Threats Detected</h4>
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
                      </div>
                    )}
                    
                    <div className="flex flex-col space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateAnalysis(result)}
                        disabled={isGeneratingAI === result.scanId}
                        className="w-full"
                      >
                        {isGeneratingAI === result.scanId ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating Analysis...
                          </>
                        ) : (
                          <>
                            <Brain className="h-4 w-4 mr-2" />
                            Generate Analysis
                          </>
                        )}
                      </Button>
                      
                      <div className="text-xs text-gray-500 text-center">
                        Scan ID: {result.scanId}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {result.aiRecommendations && (
                  <div className="mt-6 p-4 bg-accent border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-foreground flex items-center space-x-2">
                        <Brain className="h-4 w-4" />
                        <span>Recommendations</span>
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(result.aiRecommendations || '')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={result.aiRecommendations}
                      readOnly
                      className="min-h-[120px] bg-card"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
