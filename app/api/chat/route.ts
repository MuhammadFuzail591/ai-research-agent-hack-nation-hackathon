import { google } from '@ai-sdk/google'
import {
  generateText,
  streamText,
  convertToModelMessages,
  type UIMessage
} from 'ai'
import { GoogleGenerativeAIProviderMetadata } from '@ai-sdk/google'

import 'dotenv/config'

const formatMessageHistory = (messages: UIMessage[]) => {
  return messages
    .map(message => {
      return `${message.role}: ${message.parts
        .map(part => {
          if (part.type === 'text') {
            return (part as any).text
          }
          if (part.type === 'file') {
            return `[File: ${(part as any).filename}]`
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

const DOCUMENT_ANALYZER_SYSTEM = `You are a Document Analysis Agent specialized in extracting research insights.

Your role:
- Carefully read and analyze ALL uploaded documents
- Extract key concepts, methodologies, and findings
- Identify important data points, statistics, and evidence
- Summarize main arguments and conclusions
- Note any research questions, gaps, or limitations mentioned

Output a structured analysis with:

## Document Summary
Brief overview of what the documents cover

## Key Concepts & Themes
- Main topics and concepts discussed
- Theoretical frameworks mentioned

## Important Findings
- Key research findings with context
- Notable data points and statistics
- Experimental results or observations

## Research Gaps & Questions
- Questions raised by the authors
- Limitations acknowledged
- Areas needing further investigation

Be thorough but concise. Focus on research-relevant information that would help understand the topic better.`

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

const SYNTHESIZER_AGENT_SYSTEM = `You are a Synthesis Agent creating well-formatted research reports.

Your role:
- Create a concise, actionable research report with proper markdown formatting
- Include inline citations as [1], [2], etc. (just numbers in brackets)
- Generate 1-2 novel insights or hypotheses
- Use clear headings, bullet points, and spacing

Output format (use markdown):

# Research Insights: [Topic]

## 🔍 Key Findings

- **Finding 1**: Brief explanation with citation [1]
- **Finding 2**: Brief explanation with citation [2]  
- **Finding 3**: Brief explanation with citation [3]

## 💡 Critical Analysis

**Strengths**: What's working well in current research
**Gaps**: What needs more investigation

## 🎯 Hypothesis Worth Exploring

Based on the evidence [1, 2], here's a novel direction worth investigating...

## 📋 Next Steps

1. Action item with clear direction
2. Another actionable research path
3. Final recommendation

---

## 📚 Sources

[1] [Source Title](URL)
[2] [Source Title](URL)
[3] [Source Title](URL)

IMPORTANT: 
- Keep under 500 words total
- Use proper markdown (headings, bold, lists, links)
- Make links clickable using [Text](URL) format
- Use emojis sparingly for visual breaks
- Be direct and impactful`

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

  // Extract the latest user message
  const latestMessage = messages[messages.length - 1]
  const textParts = latestMessage.parts.filter(part => part.type === 'text')
  const fileParts = latestMessage.parts.filter(part => part.type === 'file')

  const researchTopic = textParts.map(part => (part as any).text).join(' ')

  console.log('🔬 Starting Research Agent System...')
  console.log('📋 Topic:', researchTopic)
  console.log('📎 Files:', fileParts.length)

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
    // ============================================
    // DECLARE documentInsights HERE AT THE TOP
    // ============================================
    let documentInsights: string = ''

    try {
      // ============================================
      // AGENT 0: DOCUMENT ANALYZER (if files present)
      // ============================================
      if (fileParts.length > 0) {
        await sendStatus(
          `📄 Document Analyzer: Analyzing ${fileParts.length} uploaded file(s)...`
        )

        try {
          console.log('📄 Starting document analysis...')
          console.log(
            '📄 File parts:',
            fileParts.map((f: any) => f.filename).join(', ')
          )

          // Convert the entire message with files for analysis
          const documentAnalysisResult = await generateText({
            model: google('gemini-2.5-flash'),
            system: DOCUMENT_ANALYZER_SYSTEM,
            prompt: `Research topic: ${researchTopic}

Please analyze the uploaded documents and extract:
1. Key concepts and themes
2. Main findings and conclusions
3. Data points and statistics mentioned
4. Research questions or gaps identified in the documents

Provide a structured summary.`
          })

          // ASSIGN THE RESULT TO documentInsights
          documentInsights = documentAnalysisResult.text

          await sendStatus(
            `✅ Document Analyzer: Extracted insights from ${fileParts.length} file(s)`
          )
          console.log('📄 Document insights extracted successfully')
          console.log(
            '📄 Insights length:',
            documentInsights.length,
            'characters'
          )
          console.log(
            '📄 Insights preview:',
            documentInsights.substring(0, 200) + '...'
          )
        } catch (error) {
          console.error('❌ Document analysis error:', error)
          await sendStatus(
            '⚠️ Document Analyzer: Could not analyze some files, continuing with web research...'
          )
          documentInsights = `Note: ${fileParts.length} file(s) were uploaded but could not be fully analyzed. Error: ${error}`
        }
      } else {
        console.log('📄 No files uploaded, skipping document analysis')
        documentInsights = '' // Explicitly set to empty string when no files
      }

      // ============================================
      // AGENT 1: RESEARCHER
      // ============================================
      await sendStatus(
        '🔍 Researcher Agent: Searching for research papers and articles...'
      )

      const researcherPrompt = documentInsights
        ? `Research topic: ${researchTopic}

Document insights from uploaded files:
${documentInsights}

Based on the document insights and the research topic, find 5-7 additional high-quality sources. Keep summaries brief and focused on key findings.`
        : `Research topic: ${researchTopic}

Find 5-7 high-quality sources. Keep summaries brief and focused on key findings.`

      const researcherResult = await generateText({
        model: google('gemini-2.5-flash'),
        system: RESEARCHER_AGENT_SYSTEM,
        tools: {
          google_search: google.tools.googleSearch({})
        },
        prompt: researcherPrompt,
      })

      const researchData = researcherResult.text
      const researcherMetadata = researcherResult.providerMetadata?.google as
        | GoogleGenerativeAIProviderMetadata
        | undefined
      const researcherSources = extractSourceUrls(researcherMetadata)

      await sendStatus(
        `✅ Researcher: Found ${researcherSources.length} sources`
      )
      console.log('✅ Researcher completed')
      console.log('📊 Research length:', researchData.length, 'characters')

      // ============================================
      // AGENT 2: REVIEWER
      // ============================================
      await sendStatus(
        '🧐 Reviewer Agent: Analyzing research quality and gaps...'
      )

      const reviewerPrompt = documentInsights
        ? `Research topic: ${researchTopic}

Document insights:
${documentInsights}

Research findings:
${researchData}

Provide concise critical analysis: strengths, gaps, and key questions. Consider both the uploaded documents and web research.`
        : `Research topic: ${researchTopic}

Research findings:
${researchData}

Provide concise critical analysis: strengths, gaps, and key questions.`

      const reviewerResult = await generateText({
        model: google('gemini-2.5-flash'),
        system: REVIEWER_AGENT_SYSTEM,
        tools: {
          google_search: google.tools.googleSearch({})
        },
        prompt: reviewerPrompt,
      })

      const critique = reviewerResult.text

      await sendStatus('✅ Reviewer: Analysis complete')
      console.log('✅ Reviewer completed')
      console.log('📊 Critique length:', critique.length, 'characters')

      // ============================================
      // AGENT 3: SYNTHESIZER
      // ============================================
      await sendStatus('🎨 Synthesizer Agent: Creating final report...')

      // Prepare sources list for citations
      const sourcesContext =
        researcherSources.length > 0
          ? `\n\nAvailable sources for citation (use [1], [2], etc.):\n${researcherSources
              .map((url, i) => `[${i + 1}] ${url}`)
              .join('\n')}`
          : ''

      const synthesizerPrompt = documentInsights
        ? `Research topic: ${researchTopic}

Document insights from uploaded files:
${documentInsights}

Web research findings:
${researchData}

Critical review:
${critique}

${sourcesContext}

Create a well-formatted markdown report that synthesizes BOTH the uploaded documents and web research. Include:
- Clear headings (##)
- Bullet points with bold emphasis
- Inline citations [1], [2]
- Clickable source links using [Title](URL) format at the end
- Integration of document insights with web research

Keep it concise, visual, and scannable.`
        : `Research topic: ${researchTopic}

Research findings:
${researchData}

Critical review:
${critique}

${sourcesContext}

Create a well-formatted markdown report with:
- Clear headings (##)
- Bullet points with bold emphasis
- Inline citations [1], [2]
- Clickable source links using [Title](URL) format at the end

Keep it concise, visual, and scannable.`

      const synthesizerResult = streamText({
        model: google('gemini-2.5-flash'),
        system: SYNTHESIZER_AGENT_SYSTEM,
        tools: {
          google_search: google.tools.googleSearch({})
        },
        prompt: synthesizerPrompt,
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

      console.log('✅ Synthesizer streaming complete')
      console.log('🎉 Research Agent System complete!\n')
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
