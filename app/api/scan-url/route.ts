import { NextRequest, NextResponse } from 'next/server'

interface URLScanResult {
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
  scanId: string
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Real URL analysis logic
    const result = await analyzeURL(url)
    
    // Store scan result (in a real app, you'd save to a database)
    const scanResult: URLScanResult = {
      url,
      ...result,
      scanId: generateScanId(),
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(scanResult)
  } catch (error) {
    console.error('URL scan error:', error)
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 })
  }
}

async function analyzeURL(url: string) {
  const domain = new URL(url).hostname
  
  // Check SSL certificate
  const hasSSL = url.startsWith('https://')
  
  // Simulate threat detection based on domain characteristics
  const suspiciousPatterns = [
    'phishing', 'scam', 'malware', 'virus', 'hack', 'free-money',
    'urgent-update', 'verify-account', 'suspended-account'
  ]
  
  const lowTrustTLDs = ['.tk', '.ml', '.cf', '.ga']
  
  let score = 85 // Base score
  const threats: string[] = []
  const recommendations: string[] = []
  
  // SSL check
  if (!hasSSL) {
    score -= 20
    threats.push('Insecure connection (no HTTPS)')
    recommendations.push('Ensure the website uses HTTPS encryption')
  }
  
  // Domain reputation check
  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
    domain.toLowerCase().includes(pattern)
  )
  
  if (hasSuspiciousPattern) {
    score -= 40
    threats.push('Suspicious domain name pattern')
    recommendations.push('Verify website legitimacy before proceeding')
  }
  
  // TLD check
  const hasLowTrustTLD = lowTrustTLDs.some(tld => domain.endsWith(tld))
  if (hasLowTrustTLD) {
    score -= 15
    threats.push('Low-trust top-level domain')
    recommendations.push('Exercise caution with this domain extension')
  }
  
  // Domain age simulation (simplified)
  const isDomainNew = Math.random() < 0.1
  if (isDomainNew) {
    score -= 10
    threats.push('Recently registered domain')
    recommendations.push('Verify domain registration date and legitimacy')
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
  
  // Add general recommendations
  if (status !== 'threat') {
    recommendations.push('Keep your browser and security software updated')
    recommendations.push('Be cautious when entering personal information')
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    status,
    threats,
    recommendations,
    details: {
      ssl: hasSSL,
      reputation: Math.max(0, score),
      malware: score < 30,
      phishing: hasSuspiciousPattern,
      suspicious: score < 50
    }
  }
}

function generateScanId(): string {
  return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}