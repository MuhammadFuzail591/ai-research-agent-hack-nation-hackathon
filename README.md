# AI Research Agent for Accelerated Research

## Project Overview

This project is an AI-powered research assistant that leverages multiple specialized AI agents to accelerate academic research, literature reviews, and knowledge extraction. The system combines document analysis with web research to provide comprehensive, structured research insights.

## 🚀 Problem Solved

Traditional research is time-consuming and requires manually searching through academic papers, documents, and online resources. Our AI Research Agent automates this process by:

- Analyzing uploaded documents (PDFs, text files, etc.)
- Performing web research with specialized tools
- Synthesizing information from multiple sources
- Providing structured, actionable insights with citations
- Identifying research gaps and critical questions

## 🧠 Multi-Agent Architecture

Our system employs a sophisticated multi-agent architecture that works in sequence to deliver comprehensive research insights:

### 1. Document Analyzer Agent
- Processes uploaded documents (PDFs, TXT, DOCX, etc.)
- Extracts key concepts, themes, and findings
- Identifies research questions and limitations
- Provides structured document summaries

### 2. Researcher Agent
- Conducts web searches using Google Search integration
- Finds 5-7 high-quality sources (academic papers, research studies)
- Extracts key findings and data points
- Maintains focus on recent and relevant research

### 3. Reviewer Agent
- Critically analyzes research quality
- Identifies strengths and gaps in findings
- Generates critical questions worth exploring
- Ensures balanced and comprehensive analysis

### 4. Synthesizer Agent
- Combines all insights into a well-formatted research report
- Creates structured markdown with headings, bullets, and citations
- Generates novel hypotheses based on evidence
- Provides actionable next steps

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework for production-grade applications
- **React 18** - Component-based UI library
- **HeroUI** - Modern, accessible component library
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe JavaScript

### AI & Backend
- **Vercel AI SDK** - AI model integration and streaming
- **@ai-sdk/google** - Google AI model integration
- **Gemini 2.5 Flash** - Primary AI model for research tasks
- **Zod** - Schema validation for AI tools
- **Node.js** - Runtime environment

### Development & Utilities
- **ESLint** - Code linting and quality
- **Framer Motion** - UI animations
- **dotenv** - Environment variable management
- **React Markdown** - Markdown rendering
- **Remark GFM** - GitHub Flavored Markdown support

## 📊 Key Features

### Document Upload & Analysis
- Support for PDF, TXT, DOC, DOCX, CSV files
- Automatic content extraction and analysis
- Integration with web research findings

### Real-time Research Streaming
- Live status updates during research process
- Streaming responses for faster perceived performance
- Multi-agent coordination with status feedback

### Structured Research Reports
- Markdown-formatted outputs
- Proper citations with source links
- Key findings and critical analysis
- Actionable next steps and hypotheses

### Multi-Modal Input Processing
- Text queries combined with document uploads
- File content analysis alongside web research
- Comprehensive information synthesis

## 🏁 How It Works

1. **User Input**: User provides a research topic/query and optionally uploads documents
2. **Document Analysis**: If documents are uploaded, the Document Analyzer processes them for key insights
3. **Research Execution**: The Researcher Agent performs web searches to find relevant sources
4. **Critical Review**: The Reviewer Agent evaluates the quality and identifies gaps
5. **Synthesis**: The Synthesizer Agent creates a comprehensive, formatted report
6. **Output**: User receives structured research insights with citations and recommendations

## 🎯 Use Cases

- **Academic Research**: Literature reviews and topic exploration
- **Market Research**: Competitive analysis and trend identification
- **Content Creation**: Blog posts, articles, and reports
- **Knowledge Management**: Document analysis and insight extraction
- **Educational Support**: Student research assistance

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Google AI API key

### Installation
```bash
# Clone the repository
npm install

# Set up environment variables
cp .env.example .env.local
# Add your GOOGLE_GENERATIVE_AI_API_KEY
```

### Running the Application
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

### Environment Variables
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google AI API key for Gemini models

## 📈 Performance & Scalability

- **Fast Response Times**: Optimized for 30-60 second research cycles
- **Streaming Interface**: Real-time status updates during processing
- **Cloud-Ready**: Built for deployment on Vercel or similar platforms
- **Resource Efficient**: Uses Gemini 2.5 Flash for optimal cost/performance

## 🏆 Innovation Highlights

1. **Multi-Agent Coordination**: Different specialized agents working together
2. **Document + Web Integration**: Combines personal documents with web research
3. **Real-time Feedback**: Live status updates throughout the research process
4. **Structured Outputs**: Well-formatted, actionable research reports
5. **Citation Management**: Automatic source tracking and linking

## 🌐 Deployment

The application is ready for deployment on Vercel or any Node.js hosting platform that supports Next.js 15.

## 📚 Documentation

Additional project documentation can be found in the `/docs` directory, including the original challenge document and technical specifications.

## 🧑‍💻 Team Information

This project was developed as part of the AI Research Agent Hackathon, focusing on accelerating research through AI agents.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.