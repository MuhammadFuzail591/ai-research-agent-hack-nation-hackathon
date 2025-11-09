import { google } from '@ai-sdk/google'
import { generateText, streamText, type UIMessage } from 'ai'
import { GoogleGenerativeAIProviderMetadata } from '@ai-sdk/google'

import 'dotenv/config'

const formatMessageHistory = (messages: UIMessage[]) => {
  return messages
    .map(message => {
      return `${message.role}: ${message.parts
        .map(part => {
          if (part.type === 'text') {
            return part.text
          }

          return ''
        })
        .join('')}`
    })
    .join('\n')
}

// ============================================
// AGENT SYSTEM PROMPTS
// ============================================

const RESEARCHER_AGENT_SYSTEM = `You are a Research Gathering Agent. 

Your role:
- Search for 5-7 high-quality sources on the topic
- Focus on recent academic papers, research studies, and expert analysis
- Extract only the most important findings and data points
- Keep summaries brief but substantive

Output format:
Brief overview of topic
Key findings (2-3 bullet points per source with inline citations)
List all source URLs at the end

Keep it concise - quality over quantity.`

const REVIEWER_AGENT_SYSTEM = `You are a Critical Reviewer Agent.

Your role:
- Identify 2-3 key strengths in the research
- Point out 2-3 important gaps or limitations
- Generate 2-3 critical questions worth exploring

Output format:
Strengths: [brief bullets]
Gaps: [brief bullets]
Questions: [brief bullets]

Be concise and actionable. Focus on what matters most.`

const SYNTHESIZER_AGENT_SYSTEM = `You are a Synthesis Agent.

Your role:
- Create a concise, actionable research report
- Include inline citations as [Source 1], [Source 2], etc.
- Generate 1-2 novel insights or hypotheses
- Keep everything brief and scannable

Output format:

## Key Insights
2-3 main findings with inline citations [Source N]

## Critical Perspective  
Main strengths and gaps identified

## Hypothesis Worth Exploring
1-2 novel ideas based on evidence

## Next Steps
2-3 actionable research directions

---
## Sources
[Source 1] Title - URL
[Source 2] Title - URL
etc.

IMPORTANT: Keep the entire report under 500 words. Be direct and impactful.`

// ============================================
// HELPER: Extract URLs from grounding metadata
// ============================================
const extractSourceUrls = (
  metadata: GoogleGenerativeAIProviderMetadata | undefined
): string[] => {
  if (!metadata?.groundingMetadata?.webSearchQueries) return []

  const sources: string[] = []
  const groundingSupports = metadata.groundingMetadata.groundingSupports || []

  for (const support of groundingSupports) {
    if (support.groundingChunkIndices) {
      for (const idx of support.groundingChunkIndices) {
        const chunk = metadata.groundingMetadata.groundingChunks?.[idx]
        if (chunk?.web?.uri) {
          sources.push(chunk.web.uri)
        }
      }
    }
  }

  return [...new Set(sources)] // Remove duplicates
}

// ============================================
// MAIN HANDLER WITH UI STREAMING
// ============================================

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: UIMessage[] } = await req.json()
  const { messages } = body

  const conversationHistory = formatMessageHistory(messages)
  const latestMessage = messages[messages.length - 1]
  const researchTopic = latestMessage.parts
    .map(part => (part.type === 'text' ? part.text : ''))
    .join('')

  // Create a TransformStream to send updates to UI
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // Helper to send status updates to UI
  const sendStatus = async (message: string) => {
    await writer.write(
      encoder.encode(
        `0:${JSON.stringify({ type: 'status', content: message })}\n`
      )
    )
  }

  // Start async processing
  ;(async () => {
    try {
      // ============================================
      // AGENT 1: RESEARCHER
      // ============================================
      await sendStatus(
        '🔍 Researcher Agent: Searching for research papers and articles...'
      )

      const researcherResult = await generateText({
        model: google('gemini-2.5-flash'),
        system: RESEARCHER_AGENT_SYSTEM,
        tools: {
          google_search: google.tools.googleSearch({})
        },
        prompt: `Research topic: ${researchTopic}

Find 5-7 high-quality sources. Keep summaries brief and focused on key findings.`,
      })

      const researchData = researcherResult.text
      const researcherMetadata = researcherResult.providerMetadata?.google as
        | GoogleGenerativeAIProviderMetadata
        | undefined
      const researcherSources = extractSourceUrls(researcherMetadata)

      await sendStatus(
        `✅ Researcher: Found ${researcherSources.length} sources`
      )

      // ============================================
      // AGENT 2: REVIEWER
      // ============================================
      await sendStatus(
        '🧐 Reviewer Agent: Analyzing research quality and gaps...'
      )

      const reviewerResult = await generateText({
        model: google('gemini-2.5-flash'),
        system: REVIEWER_AGENT_SYSTEM,
        tools: {
          google_search: google.tools.googleSearch({})
        },
        prompt: `Research topic: ${researchTopic}

Research findings:
${researchData}

Provide concise critical analysis: strengths, gaps, and key questions.`,
      })

      const critique = reviewerResult.text

      await sendStatus('✅ Reviewer: Analysis complete')

      // ============================================
      // AGENT 3: SYNTHESIZER
      // ============================================
      await sendStatus('🎨 Synthesizer Agent: Creating final insight report...')

      // Prepare sources list for citations
      const sourcesContext =
        researcherSources.length > 0
          ? `\n\nAvailable sources for citation:\n${researcherSources
              .map((url, i) => `[Source ${i + 1}] ${url}`)
              .join('\n')}`
          : ''

      const synthesizerResult = streamText({
        model: google('gemini-2.5-flash'),
        system: SYNTHESIZER_AGENT_SYSTEM,
        tools: {
          google_search: google.tools.googleSearch({})
        },
        prompt: `Research topic: ${researchTopic}

Research findings:
${researchData}

Critical review:
${critique}

${sourcesContext}

Create a concise report (under 500 words) with inline citations [Source N] and clickable URLs at the end.`,
      })

      await sendStatus('✅ Synthesizer: Streaming final report...')

      // Stream the final response
      const reader = synthesizerResult.textStream.getReader()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Send text chunks to UI
        await writer.write(
          encoder.encode(
            `0:${JSON.stringify({ type: 'text-delta', content: value })}\n`
          )
        )
      }

      // Send completion
      await writer.write(
        encoder.encode(`0:${JSON.stringify({ type: 'finish', content: '' })}\n`)
      )
    } catch (error) {
      console.error('Error in research agent system:', error)
      await writer.write(
        encoder.encode(
          `0:${JSON.stringify({
            type: 'error',
            content: 'An error occurred during research analysis.'
          })}\n`
        )
      )
    } finally {
      await writer.close()
    }
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Vercel-AI-Data-Stream': 'v1'
    }
  })
}
