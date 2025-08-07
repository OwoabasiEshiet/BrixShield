import { NextRequest, NextResponse } from 'next/server'

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

    // Use OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'BrixShield Security Scanner'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet', // You can also use 'openai/gpt-4o' or other models
        messages: [
          {
            role: 'system',
            content: 'You are a cybersecurity expert providing clear, actionable security recommendations. Be specific and practical in your advice. Provide responses in a professional yet accessible tone.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenRouter API error:', response.status, errorData)
      throw new Error(`OpenRouter API failed: ${response.status}`)
    }

    const result = await response.json()
    const recommendations = result.choices[0]?.message?.content

    if (!recommendations) {
      throw new Error('No recommendations generated')
    }

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('AI recommendation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations. Please try again later.' },
      { status: 500 }
    )
  }
}
