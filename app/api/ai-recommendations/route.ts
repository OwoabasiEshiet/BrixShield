import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()

    let prompt = ''
    
    if (type === 'url') {
      prompt = `As a cybersecurity expert, analyze this URL scan result and provide specific security recommendations:

URL: ${data.url}
Security Score: ${data.score}%
Status: ${data.status}
SSL: ${data.details.ssl ? 'Enabled' : 'Disabled'}
Reputation: ${data.details.reputation}%
Malware Detected: ${data.details.malware ? 'Yes' : 'No'}
Phishing Risk: ${data.details.phishing ? 'Yes' : 'No'}
Suspicious Activity: ${data.details.suspicious ? 'Yes' : 'No'}
Threats Found: ${data.threats.join(', ') || 'None'}

Provide 3-5 specific, actionable security recommendations to improve the security posture of this website. Focus on practical steps that can be implemented.`
    } else if (type === 'file') {
      prompt = `As a cybersecurity expert, analyze this file scan result and provide specific security recommendations:

File: ${data.name}
File Type: ${data.type}
Size: ${data.size} bytes
Security Score: ${data.score}%
Status: ${data.status}
Virus Detected: ${data.details.virus ? 'Yes' : 'No'}
Malware Detected: ${data.details.malware ? 'Yes' : 'No'}
Suspicious Content: ${data.details.suspicious ? 'Yes' : 'No'}
Encrypted: ${data.details.encrypted ? 'Yes' : 'No'}
Threats Found: ${data.threats.join(', ') || 'None'}

Provide 3-5 specific, actionable security recommendations for handling this file safely. Include best practices for file security and threat mitigation.`
    }

    const { text } = await generateText({
      model: openai('gpt-4o'),
      prompt,
      system: 'You are a cybersecurity expert providing clear, actionable security recommendations. Be specific and practical in your advice.'
    })

    return NextResponse.json({ recommendations: text })
  } catch (error) {
    console.error('AI recommendation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}
