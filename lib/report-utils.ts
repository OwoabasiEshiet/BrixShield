import { ScanResult } from './scan-store'

export interface ReportData {
  scans: ScanResult[]
  generatedAt: string
  summary: {
    totalScans: number
    safeScans: number
    warningScans: number
    threatScans: number
    averageScore: number
    totalThreats: number
    scanTypes: {
      url: number
      file: number
    }
  }
}

export function generateReportData(scans: ScanResult[]): ReportData {
  const summary = {
    totalScans: scans.length,
    safeScans: scans.filter(s => s.status === 'safe').length,
    warningScans: scans.filter(s => s.status === 'warning').length,
    threatScans: scans.filter(s => s.status === 'threat').length,
    averageScore: scans.length > 0 ? Math.round(scans.reduce((sum, s) => sum + s.score, 0) / scans.length) : 0,
    totalThreats: scans.reduce((sum, s) => sum + s.threats.length, 0),
    scanTypes: {
      url: scans.filter(s => s.type === 'url').length,
      file: scans.filter(s => s.type === 'file').length
    }
  }

  return {
    scans,
    generatedAt: new Date().toISOString(),
    summary
  }
}

export function downloadJSON(data: ReportData, filename: string) {
  const dataStr = JSON.stringify(data, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadCSV(scans: ScanResult[], filename: string) {
  const headers = [
    'ID',
    'Type',
    'Target',
    'Status',
    'Score',
    'Threats Count',
    'Threats',
    'Has SSL',
    'Malware Detected',
    'Phishing Risk',
    'Suspicious Activity',
    'Virus Detected',
    'Encrypted',
    'File Size',
    'Scan Date',
    'AI Recommendations'
  ]

  const csvContent = [
    headers.join(','),
    ...scans.map(scan => [
      scan.id,
      scan.type,
      `"${scan.target.replace(/"/g, '""')}"`,
      scan.status,
      scan.score,
      scan.threats.length,
      `"${scan.threats.join('; ').replace(/"/g, '""')}"`,
      scan.details.ssl || 'N/A',
      scan.details.malware || false,
      scan.details.phishing || 'N/A',
      scan.details.suspicious || false,
      scan.details.virus || 'N/A',
      scan.details.encrypted || 'N/A',
      scan.size || 'N/A',
      new Date(scan.timestamp).toLocaleString(),
      `"${(scan.aiRecommendations || '').replace(/"/g, '""')}"`
    ].join(','))
  ].join('\n')

  const dataBlob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function generateHTMLReport(data: ReportData): string {
  const { scans, generatedAt, summary } = data

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure my URL Security Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #4a5568;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .summary-card .value {
            font-size: 28px;
            font-weight: bold;
            margin: 0;
        }
        .safe { color: #38a169; }
        .warning { color: #d69e2e; }
        .threat { color: #e53e3e; }
        .neutral { color: #4a5568; }
        .scan-results {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .scan-item {
            padding: 20px;
            border-bottom: 1px solid #e2e8f0;
            display: grid;
            grid-template-columns: auto 1fr auto;
            gap: 20px;
            align-items: start;
        }
        .scan-item:last-child {
            border-bottom: none;
        }
        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-safe {
            background-color: #c6f6d5;
            color: #22543d;
        }
        .status-warning {
            background-color: #fefcbf;
            color: #744210;
        }
        .status-threat {
            background-color: #fed7d7;
            color: #742a2a;
        }
        .threats-list {
            background-color: #fed7d7;
            border: 1px solid #fc8181;
            border-radius: 6px;
            padding: 10px;
            margin-top: 10px;
        }
        .threats-list ul {
            margin: 0;
            padding-left: 20px;
        }
        .threats-list li {
            color: #742a2a;
            font-size: 14px;
        }
        .analysis-recommendations {
            background-color: #f1f8fb;
            border: 1px solid #cfe6ff;
            border-radius: 6px;
            padding: 15px;
            margin-top: 10px;
        }
        .analysis-recommendations h4 {
            margin: 0 0 10px 0;
            color: #0f4b76;
            font-size: 14px;
        }
        .analysis-recommendations p {
            margin: 0;
            color: #0f3a58;
            font-size: 14px;
            line-height: 1.5;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #718096;
            font-size: 14px;
        }
        @media print {
            body {
                background-color: white;
            }
            .scan-results {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Secure my URL Security Report</h1>
        <p>Generated on ${new Date(generatedAt).toLocaleString()}</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>Total Scans</h3>
            <p class="value neutral">${summary.totalScans}</p>
        </div>
        <div class="summary-card">
            <h3>Safe</h3>
            <p class="value safe">${summary.safeScans}</p>
        </div>
        <div class="summary-card">
            <h3>Warnings</h3>
            <p class="value warning">${summary.warningScans}</p>
        </div>
        <div class="summary-card">
            <h3>Threats</h3>
            <p class="value threat">${summary.threatScans}</p>
        </div>
        <div class="summary-card">
            <h3>Average Score</h3>
            <p class="value neutral">${summary.averageScore}%</p>
        </div>
        <div class="summary-card">
            <h3>Total Threats Found</h3>
            <p class="value threat">${summary.totalThreats}</p>
        </div>
    </div>

    <div class="scan-results">
        <div style="background: #4a5568; color: white; padding: 20px;">
            <h2 style="margin: 0;">Detailed Scan Results</h2>
        </div>
        ${scans.map(scan => `
            <div class="scan-item">
                <div>
                    <span class="status-badge status-${scan.status}">${scan.status}</span>
                </div>
                <div>
                    <h3 style="margin: 0 0 5px 0; color: #2d3748;">${scan.target}</h3>
                    <p style="margin: 0 0 10px 0; color: #718096; font-size: 14px;">
                        ${scan.type.toUpperCase()} Scan • ${new Date(scan.timestamp).toLocaleString()}
                        ${scan.size ? ` • ${(scan.size / 1024).toFixed(1)} KB` : ''}
                    </p>
                    <div style="display: flex; gap: 15px; font-size: 14px; margin-bottom: 10px;">
                        <span><strong>Score:</strong> ${scan.score}%</span>
                        <span><strong>Threats:</strong> ${scan.threats.length}</span>
                        ${scan.details.ssl !== undefined ? `<span><strong>SSL:</strong> ${scan.details.ssl ? 'Yes' : 'No'}</span>` : ''}
                        ${scan.details.malware !== undefined ? `<span><strong>Malware:</strong> ${scan.details.malware ? 'Detected' : 'Clean'}</span>` : ''}
                    </div>
                    ${scan.threats.length > 0 ? `
                        <div class="threats-list">
                            <strong>Threats Detected:</strong>
                            <ul>
                                ${scan.threats.map(threat => `<li>${threat}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${scan.aiRecommendations ? `
                        <div class="analysis-recommendations">
                            <h4>Recommendations:</h4>
                            <p>${scan.aiRecommendations}</p>
                        </div>
                    ` : ''}
                </div>
                <div style="text-align: right; color: #718096; font-size: 12px;">
                    ID: ${scan.id}
                </div>
            </div>
        `).join('')}
    </div>

    <div class="footer">
    <p>This report was generated by Secure my URL Security Scanner</p>
        <p>For more information, visit your security dashboard</p>
    </div>
</body>
</html>`
}

export function downloadHTML(data: ReportData, filename: string) {
  const htmlContent = generateHTMLReport(data)
  const dataBlob = new Blob([htmlContent], { type: 'text/html' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadSingleScanReport(scan: ScanResult, format: 'json' | 'html' = 'json') {
  const reportData = generateReportData([scan])
  const timestamp = new Date().toISOString().split('T')[0]
  const scanType = scan.type
  const sanitizedTarget = scan.target.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)
  
  if (format === 'json') {
    downloadJSON(reportData, `securemyurl-${scanType}-scan-${sanitizedTarget}-${timestamp}.json`)
  } else {
    downloadHTML(reportData, `securemyurl-${scanType}-scan-${sanitizedTarget}-${timestamp}.html`)
  }
}