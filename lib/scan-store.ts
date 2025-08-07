interface ScanResult {
  id: string
  type: 'url' | 'file'
  target: string
  score: number
  status: 'safe' | 'warning' | 'threat'
  timestamp: number
  threats: string[]
  details: {
    ssl?: boolean
    reputation?: number
    malware: boolean
    phishing?: boolean
    suspicious: boolean
    virus?: boolean
    encrypted?: boolean
  }
  size?: number
  aiRecommendations?: string
}

class ScanStore {
  private static instance: ScanStore
  private storageKey = 'brixshield_scan_history'
  private listeners: Set<() => void> = new Set()

  static getInstance(): ScanStore {
    if (!ScanStore.instance) {
      ScanStore.instance = new ScanStore()
    }
    return ScanStore.instance
  }

  // Get all scan results
  getAllScans(): ScanResult[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error reading scan history:', error)
      return []
    }
  }

  // Add a new scan result
  addScan(scanData: Omit<ScanResult, 'id' | 'timestamp'>): ScanResult {
    const newScan: ScanResult = {
      ...scanData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    }

    const scans = this.getAllScans()
    scans.unshift(newScan) // Add to beginning
    
    // Keep only last 1000 scans to prevent storage bloat
    if (scans.length > 1000) {
      scans.splice(1000)
    }

    this.saveScans(scans)
    this.notifyListeners()
    
    return newScan
  }

  // Update an existing scan (for AI recommendations)
  updateScan(id: string, updates: Partial<ScanResult>): void {
    const scans = this.getAllScans()
    const index = scans.findIndex(scan => scan.id === id)
    
    if (index !== -1) {
      scans[index] = { ...scans[index], ...updates }
      this.saveScans(scans)
      this.notifyListeners()
    }
  }

  // Delete scans
  deleteScans(ids: string[]): void {
    const scans = this.getAllScans().filter(scan => !ids.includes(scan.id))
    this.saveScans(scans)
    this.notifyListeners()
  }

  // Clear all scans
  clearAllScans(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey)
      this.notifyListeners()
    }
  }

  // Get statistics
  getStats() {
    const scans = this.getAllScans()
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    const weekMs = 7 * dayMs
    const monthMs = 30 * dayMs

    return {
      total: scans.length,
      today: scans.filter(scan => now - scan.timestamp < dayMs).length,
      thisWeek: scans.filter(scan => now - scan.timestamp < weekMs).length,
      thisMonth: scans.filter(scan => now - scan.timestamp < monthMs).length,
      safe: scans.filter(scan => scan.status === 'safe').length,
      warnings: scans.filter(scan => scan.status === 'warning').length,
      threats: scans.filter(scan => scan.status === 'threat').length,
      totalThreats: scans.reduce((sum, scan) => sum + scan.threats.length, 0),
      averageScore: scans.length > 0 ? Math.round(scans.reduce((sum, scan) => sum + scan.score, 0) / scans.length) : 0,
      urlScans: scans.filter(scan => scan.type === 'url').length,
      fileScans: scans.filter(scan => scan.type === 'file').length
    }
  }

  // Get recent scans
  getRecentScans(limit: number = 10): ScanResult[] {
    return this.getAllScans().slice(0, limit)
  }

  // Subscribe to changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private saveScans(scans: ScanResult[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(scans))
      } catch (error) {
        console.error('Error saving scan history:', error)
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener())
  }
}

export const scanStore = ScanStore.getInstance()
export type { ScanResult }