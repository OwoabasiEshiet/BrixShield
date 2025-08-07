'use client'

import { useState, useEffect } from 'react'
import { History, Globe, FileText, Calendar, Filter, Search, Download, Trash2, AlertTriangle, CheckCircle, Shield, Clock, ChevronDown, FileDown, Table, Code, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { scanStore, ScanResult } from '@/lib/scan-store'
import { generateReportData, downloadJSON, downloadCSV, downloadHTML, downloadSingleScanReport } from '@/lib/report-utils'

export default function ScanHistory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [history, setHistory] = useState<ScanResult[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Load and subscribe to scan data
  useEffect(() => {
    const updateHistory = () => {
      setHistory(scanStore.getAllScans())
      setIsLoading(false)
    }

    // Initial load
    updateHistory()

    // Subscribe to changes
    const unsubscribe = scanStore.subscribe(updateHistory)

    return unsubscribe
  }, [])

  // Filter and sort history
  const filteredHistory = history
    .filter(item => {
      const matchesSearch = item.target.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'all' || item.type === filterType
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus
      return matchesSearch && matchesType && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.timestamp - a.timestamp
        case 'oldest':
          return a.timestamp - b.timestamp
        case 'score-high':
          return b.score - a.score
        case 'score-low':
          return a.score - b.score
        case 'threats':
          return b.threats.length - a.threats.length
        default:
          return b.timestamp - a.timestamp
      }
    })

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getStatusIcon = (status: string, score: number) => {
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

  const getStatusBadge = (status: string, score: number) => {
    const baseClasses = "font-medium"
    switch (status) {
      case 'safe':
        return <Badge className={`${baseClasses} bg-green-100 text-green-800 border-green-200`}>Safe ({score}%)</Badge>
      case 'warning':
        return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-200`}>Warning ({score}%)</Badge>
      case 'threat':
        return <Badge className={`${baseClasses} bg-red-100 text-red-800 border-red-200`}>Threat ({score}%)</Badge>
      default:
        return <Badge variant="outline">Unknown ({score}%)</Badge>
    }
  }

  const clearHistory = () => {
    scanStore.clearAllScans()
    setSelectedItems(new Set())
    toast({
      title: "History Cleared",
      description: "All scan history has been permanently deleted"
    })
  }

  const deleteSelected = () => {
    if (selectedItems.size === 0) return
    
    scanStore.deleteScans(Array.from(selectedItems))
    setSelectedItems(new Set())
    toast({
      title: "Items Deleted",
      description: `${selectedItems.size} scan(s) have been deleted`
    })
  }

  const handleBulkExport = (format: 'json' | 'csv' | 'html') => {
    if (filteredHistory.length === 0) {
      toast({
        title: "No Data",
        description: "No scan history available to export",
        variant: "destructive"
      })
      return
    }

    const reportData = generateReportData(filteredHistory)
    const timestamp = new Date().toISOString().split('T')[0]
    const count = filteredHistory.length

    try {
      switch (format) {
        case 'json':
          downloadJSON(reportData, `brixshield-scan-report-${count}-scans-${timestamp}.json`)
          break
        case 'csv':
          downloadCSV(filteredHistory, `brixshield-scan-report-${count}-scans-${timestamp}.csv`)
          break
        case 'html':
          downloadHTML(reportData, `brixshield-scan-report-${count}-scans-${timestamp}.html`)
          break
      }
      
      toast({
        title: "Export Complete",
        description: `${count} scan(s) exported as ${format.toUpperCase()}`
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export scan data. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleSelectedExport = (format: 'json' | 'csv' | 'html') => {
    if (selectedItems.size === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select items to export",
        variant: "destructive"
      })
      return
    }

    const selectedScans = filteredHistory.filter(scan => selectedItems.has(scan.id))
    const reportData = generateReportData(selectedScans)
    const timestamp = new Date().toISOString().split('T')[0]
    const count = selectedScans.length

    try {
      switch (format) {
        case 'json':
          downloadJSON(reportData, `brixshield-selected-scans-${count}-items-${timestamp}.json`)
          break
        case 'csv':
          downloadCSV(selectedScans, `brixshield-selected-scans-${count}-items-${timestamp}.csv`)
          break
        case 'html':
          downloadHTML(reportData, `brixshield-selected-scans-${count}-items-${timestamp}.html`)
          break
      }
      
      toast({
        title: "Export Complete",
        description: `${count} selected scan(s) exported as ${format.toUpperCase()}`
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export selected scan data. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleSingleScanExport = (scan: ScanResult, format: 'json' | 'html') => {
    try {
      downloadSingleScanReport(scan, format)
      toast({
        title: "Export Complete",
        description: `Scan report downloaded as ${format.toUpperCase()}`
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export scan report. Please try again.",
        variant: "destructive"
      })
    }
  }

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const selectAll = () => {
    setSelectedItems(new Set(filteredHistory.map(item => item.id)))
  }

  const deselectAll = () => {
    setSelectedItems(new Set())
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <History className="h-6 w-6 text-blue-600" />
            Scan History
          </h2>
          <p className="text-slate-600">
            {history.length} total scans • {filteredHistory.length} shown
          </p>
        </div>
        <div className="flex gap-2">
          {selectedItems.size > 0 && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileDown className="h-4 w-4 mr-2" />
                    Export Selected ({selectedItems.size})
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleSelectedExport('json')}>
                    <Code className="h-4 w-4 mr-2" />
                    JSON Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSelectedExport('csv')}>
                    <Table className="h-4 w-4 mr-2" />
                    CSV Spreadsheet
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSelectedExport('html')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    HTML Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="destructive" size="sm" onClick={deleteSelected}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedItems.size})
              </Button>
            </>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={filteredHistory.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export All
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export All ({filteredHistory.length} scans)</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleBulkExport('json')}>
                <Code className="h-4 w-4 mr-2" />
                JSON Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkExport('csv')}>
                <Table className="h-4 w-4 mr-2" />
                CSV Spreadsheet
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkExport('html')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                HTML Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" size="sm" onClick={clearHistory} disabled={history.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  placeholder="Search scans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="url">URL Scans</SelectItem>
                <SelectItem value="file">File Scans</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="safe">Safe</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="threat">Threat</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="score-high">Highest Score</SelectItem>
                <SelectItem value="score-low">Lowest Score</SelectItem>
                <SelectItem value="threats">Most Threats</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll} disabled={filteredHistory.length === 0}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll} disabled={selectedItems.size === 0}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                {history.length === 0 ? 'No scans yet' : 'No scans match your filters'}
              </h3>
              <p className="text-gray-500">
                {history.length === 0 
                  ? 'Start scanning URLs or files to see your history here'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredHistory.map((item) => (
            <Card key={item.id} className={`transition-all hover:shadow-md ${selectedItems.has(item.id) ? 'ring-2 ring-blue-500' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex items-center space-x-2">
                      {item.type === 'url' ? (
                        <Globe className="h-5 w-5 text-blue-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-green-600" />
                      )}
                      {getStatusIcon(item.status, item.score)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-slate-800 truncate" title={item.target}>
                          {item.target}
                        </h3>
                        {getStatusBadge(item.status, item.score)}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-slate-500 mb-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(item.timestamp)}
                        </span>
                        {item.size && (
                          <span>{(item.size / 1024).toFixed(1)} KB</span>
                        )}
                        <span>{item.threats.length} threat{item.threats.length !== 1 ? 's' : ''}</span>
                      </div>

                      {item.threats.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.threats.map((threat, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {threat}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 text-xs">
                        {item.details.malware && (
                          <Badge variant="destructive" className="text-xs">Malware</Badge>
                        )}
                        {item.details.phishing && (
                          <Badge variant="destructive" className="text-xs">Phishing</Badge>
                        )}
                        {item.details.virus && (
                          <Badge variant="destructive" className="text-xs">Virus</Badge>
                        )}
                        {item.details.suspicious && (
                          <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">Suspicious</Badge>
                        )}
                        {item.details.ssl && (
                          <Badge variant="outline" className="text-xs border-green-300 text-green-700">SSL</Badge>
                        )}
                        {item.details.encrypted && (
                          <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">Encrypted</Badge>
                        )}
                      </div>

                      {item.aiRecommendations && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <h4 className="text-xs font-medium text-blue-800 mb-1">AI Recommendations:</h4>
                          <p className="text-xs text-blue-700 line-clamp-3">{item.aiRecommendations}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Download Report</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleSingleScanExport(item, 'json')}>
                          <Code className="h-4 w-4 mr-2" />
                          JSON Report
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSingleScanExport(item, 'html')}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          HTML Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {history.length}
                </div>
                <div className="text-sm text-slate-600">Total Scans</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {history.filter(item => item.status === 'safe').length}
                </div>
                <div className="text-sm text-slate-600">Safe</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {history.filter(item => item.status === 'warning').length}
                </div>
                <div className="text-sm text-slate-600">Warnings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {history.filter(item => item.status === 'threat').length}
                </div>
                <div className="text-sm text-slate-600">Threats</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
