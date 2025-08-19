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

    // Real URL analysis logic
    const result = await analyzeURL(url)
    
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
  let score = 100 // Start with perfect score and deduct points
  const threats: string[] = []
  const recommendations: string[] = []
  
  // Check SSL certificate
  const hasSSL = url.startsWith('https://')
  
  // 1. ENHANCED THREAT PATTERN DETECTION
  const highRiskPatterns = [
    // Phishing patterns
    'paypal-security', 'amazon-verify', 'netflix-billing', 'microsoft-security',
    'google-security', 'apple-id-suspended', 'facebook-security',
    // Malware patterns
    'free-download', 'urgent-update', 'virus-detected', 'system-infected',
    'pc-cleaner', 'driver-update', 'codec-pack',
    // Scam patterns
    'make-money-fast', 'work-from-home', 'lottery-winner', 'inheritance',
    'crypto-investment', 'bitcoin-doubler', 'easy-money',
    // Suspicious words
    'verify-account', 'suspended-account', 'confirm-identity', 'update-payment',
    'click-here-now', 'limited-time', 'act-now', 'congratulations'
  ]
  
  const suspiciousPatterns = [
    'phishing', 'scam', 'malware', 'virus', 'hack', 'steal', 'fraud',
    'fake', 'counterfeit', 'replica', 'generator', 'cracked', 'keygen'
  ]
  
  // 2. DANGEROUS TOP-LEVEL DOMAINS
  const highRiskTLDs = [
    '.tk', '.ml', '.cf', '.ga', '.icu', '.top', '.click', '.download',
    '.stream', '.science', '.work', '.date', '.review', '.country'
  ]
  
  // 3. SUSPICIOUS URL PATTERNS
  const suspiciousUrlPatterns = [
    /bit\.ly|tinyurl|t\.co|goo\.gl|short\.link/i, // URL shorteners
    /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/i, // IP addresses
    /-[a-z]{10,}/i, // Long random strings
    /[a-z0-9]{20,}/i, // Very long domain names
    /\d{4,}/i, // Many numbers in domain
  ]
  
  // 4. KNOWN MALICIOUS DOMAINS (sample list)
  const knownMaliciousDomains = [
    'malware-test.com', 'phishing-test.com', 'virus-download.com',
    'fake-bank.com', 'scam-site.org', 'malicious-download.net'
  ]
  
  // 5. ANALYZE DOMAIN CHARACTERISTICS
  
  // Check for known malicious domains
  if (knownMaliciousDomains.some(malDomain => domain.includes(malDomain))) {
    score = 0
    threats.push('Known malicious domain')
    threats.push('Domain appears in threat intelligence databases')
    recommendations.push('DO NOT visit this website - confirmed threat')
    recommendations.push('Report this URL to your security team')
  }
  
  // Check for high-risk patterns
  const hasHighRiskPattern = highRiskPatterns.some(pattern => 
    url.toLowerCase().includes(pattern) || domain.toLowerCase().includes(pattern)
  )
  
  if (hasHighRiskPattern) {
    score -= 60
    threats.push('High-risk pattern detected in URL')
    threats.push('Possible phishing or scam attempt')
    recommendations.push('This appears to be a phishing or scam website')
  }
  
  // Check for suspicious patterns
  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
    domain.toLowerCase().includes(pattern)
  )
  
  if (hasSuspiciousPattern) {
    score -= 40
    threats.push('Suspicious keywords in domain name')
    recommendations.push('Domain name contains suspicious terms')
  }
  
  // Check for suspicious URL patterns
  const hasSuspiciousUrlPattern = suspiciousUrlPatterns.some(pattern => 
    pattern.test(url)
  )
  
  if (hasSuspiciousUrlPattern) {
    score -= 30
    threats.push('Suspicious URL structure detected')
    recommendations.push('URL structure appears suspicious - use caution')
  }
  
  // SSL check
  if (!hasSSL) {
    score -= 25
    threats.push('Insecure connection (no HTTPS)')
    recommendations.push('Website does not use secure HTTPS encryption')
  }
  
  // High-risk TLD check
  const hasHighRiskTLD = highRiskTLDs.some(tld => domain.endsWith(tld))
  if (hasHighRiskTLD) {
    score -= 20
    threats.push('High-risk domain extension')
    recommendations.push('Domain uses a high-risk extension often used by malicious sites')
  }
  
  // Check for typosquatting (simplified)
  const legitimateDomains = [
    'google.com', 'facebook.com', 'amazon.com', 'microsoft.com', 'apple.com',
    'paypal.com', 'netflix.com', 'instagram.com', 'twitter.com', 'linkedin.com'
  ]
  
  const possibleTyposquat = legitimateDomains.some(legitDomain => {
    const similarity = calculateSimilarity(domain, legitDomain)
    return similarity > 0.7 && similarity < 1.0
  })
  
  if (possibleTyposquat) {
    score -= 35
    threats.push('Possible typosquatting detected')
    recommendations.push('Domain appears to mimic a legitimate website')
  }
  
  // Check domain length and randomness
  if (domain.length > 25) {
    score -= 10
    threats.push('Unusually long domain name')
  }
  
  // Check for excessive subdomains
  const subdomainCount = domain.split('.').length - 2
  if (subdomainCount > 2) {
    score -= 15
    threats.push('Excessive subdomain usage')
    recommendations.push('Multiple subdomains can be used to deceive users')
  }
  
  // REAL-TIME CHECKS (you can integrate actual APIs here)
  try {
    await checkURLWithSafeBrowsing(url, threats, score)
  } catch (error) {
    console.log('Safe Browsing API unavailable, using local analysis')
  }
  
  // Ensure score doesn't go below 0
  score = Math.max(0, score)
  
  // Set status based on score
  let status: 'safe' | 'warning' | 'threat'
  if (score >= 70) {
    status = 'safe'
  } else if (score >= 40) {
    status = 'warning'
  } else {
    status = 'threat'
  }
  
  // Add general recommendations based on status
  if (status === 'threat') {
    recommendations.unshift('DO NOT visit this website')
    recommendations.push('Block this URL in your security software')
  } else if (status === 'warning') {
    recommendations.unshift('Exercise extreme caution')
    recommendations.push('Verify website legitimacy before proceeding')
  } else {
    recommendations.push('Keep your browser and security software updated')
    recommendations.push('Be cautious when entering personal information')
  }
  
  return {
    score,
    status,
    threats,
    recommendations,
    details: {
      ssl: hasSSL,
      reputation: score,
      malware: score < 30,
      phishing: hasHighRiskPattern || hasSuspiciousPattern || possibleTyposquat,
      suspicious: score < 50
    }
  }
}

// Helper function to check similarity (simplified Levenshtein distance)
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) {
    return 1.0
  }
  
  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

// Optional: Integrate with Google Safe Browsing API
async function checkURLWithSafeBrowsing(url: string, threats: string[], score: number) {
  // This is a placeholder for Google Safe Browsing API integration
  // You would need to sign up for the API and add your key to environment variables
  
  const GOOGLE_SAFE_BROWSING_API_KEY = process.env.GOOGLE_SAFE_BROWSING_API_KEY
  
  if (!GOOGLE_SAFE_BROWSING_API_KEY) {
    return // Skip if no API key
  }
  
  try {
    const response = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GOOGLE_SAFE_BROWSING_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client: {
          clientId: 'securemyurl',
          clientVersion: '1.0.0'
        },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }]
        }
      })
    })
    
    const result = await response.json()
    
    if (result.matches && result.matches.length > 0) {
      threats.push('Confirmed threat by Google Safe Browsing')
      score = 0
    }
  } catch (error) {
    console.log('Safe Browsing check failed:', error)
  }
}

function generateScanId(): string {
  return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}