import { NextRequest, NextResponse } from 'next/server'

interface FileScanResult {
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
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // File size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Analyze file
    const result = await analyzeFile(file)
    
    const scanResult: FileScanResult = {
      name: file.name,
      size: file.size,
      type: file.type || 'unknown',
      ...result,
      scanId: generateScanId(),
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(scanResult)
  } catch (error) {
    console.error('File scan error:', error)
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 })
  }
}

async function analyzeFile(file: File) {
  const fileName = file.name.toLowerCase()
  const fileType = file.type
  const fileSize = file.size
  
  let score = 90 // Base score
  const threats: string[] = []
  
  // Dangerous file extensions
  const dangerousExtensions = [
    '.exe', '.bat', '.com', '.cmd', '.scr', '.pif', '.vbs', '.js',
    '.jar', '.app', '.deb', '.pkg', '.dmg', '.iso'
  ]
  
  // Suspicious file patterns
  const suspiciousPatterns = [
    'crack', 'keygen', 'patch', 'hack', 'virus', 'trojan',
    'malware', 'ransomware', 'backdoor'
  ]
  
  // Check file extension
  const hasDangerousExtension = dangerousExtensions.some(ext => 
    fileName.endsWith(ext)
  )
  
  if (hasDangerousExtension) {
    score -= 30
    threats.push('Potentially dangerous file type')
  }
  
  // Check suspicious patterns in filename
  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
    fileName.includes(pattern)
  )
  
  if (hasSuspiciousPattern) {
    score -= 40
    threats.push('Suspicious filename pattern')
  }
  
  // Check file size anomalies
  if (fileSize < 100 && hasDangerousExtension) {
    score -= 20
    threats.push('Unusually small executable file')
  }
  
  if (fileSize > 100 * 1024 * 1024) { // > 100MB
    score -= 10
    threats.push('Large file size may indicate packed content')
  }
  
  // Archive files need special attention
  const archiveExtensions = ['.zip', '.rar', '.7z', '.tar', '.gz']
  const isArchive = archiveExtensions.some(ext => fileName.endsWith(ext))
  
  if (isArchive) {
    score -= 5
    threats.push('Archive file - contents should be verified')
  }
  
  // Document files with macros
  const macroCapableFiles = ['.doc', '.docm', '.xls', '.xlsm', '.ppt', '.pptm']
  const canHaveMacros = macroCapableFiles.some(ext => fileName.endsWith(ext))
  
  if (canHaveMacros) {
    score -= 10
    threats.push('Document may contain macros')
  }
  
  // Set status based on score
  let status: 'safe' | 'warning' | 'threat'
  if (score >= 70) {
    status = 'safe'
  } else if (score >= 40) {
    status = 'warning'
  } else {
    status = 'threat'
  }
  
  // Simulate advanced detection
  const hasVirus = score < 30
  const hasMalware = score < 40
  const isSuspicious = score < 60
  const isEncrypted = fileName.includes('encrypted') || fileName.includes('password')
  
  return {
    score: Math.max(0, Math.min(100, score)),
    status,
    threats,
    details: {
      virus: hasVirus,
      malware: hasMalware,
      suspicious: isSuspicious,
      encrypted: isEncrypted
    }
  }
}

function generateScanId(): string {
  return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}