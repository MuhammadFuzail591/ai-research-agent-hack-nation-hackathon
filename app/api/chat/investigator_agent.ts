import { Experimental_Agent as Agent, generateText, stepCountIs, tool } from 'ai'
import { z } from 'zod'
import { google } from '@ai-sdk/google'

const webSearchTool = google.tools.googleSearch({})

export const IngestorAgent = new Agent({
  model: google('gemini-2.5-flash'),
  tools: {
    google_search: tool({
      description:
        'Search the web for articles, research papers or information relevant to the given topic or keywords',
      inputSchema: z.object({
        query: z
          .string()
          .describe('The search query string (topic or keywords)'),
        maxResults: z
          .number()
          .optional()
          .describe('Maximum number of results to return')
      }),
      execute: async ({ query, maxResults = 5 }) => {
        const { text, sources } = await generateText({
          model: google('gemini-2.5-flash'),
          tools: { google_search: webSearchTool },
          prompt: `Perform a web search for: "${query}". Return the raw search results (titles, urls) up to ${maxResults}.`
        })
        // For simplicity: we return minimal structure; you may replace with direct API call
        return { query, results: text, sources }
      }
    })
  },
  stopWhen: stepCountIs(3),
  system: `You are the Knowledge Ingestor Agent.  
Your job: given a topic or research-paper title/keywords, perform a web search using your google_search tool, then summarise the found material into:  
1) A concise summary of the topic/key findings.  
2) A list of key findings (bullets) with citations (urls or sources).  
3) Keywords and phrases.  
Return the result in JSON format with fields: topic, summary, key_findings, keywords, citations.  
Use the tool smartly and do not exceed the step limit.`
})
