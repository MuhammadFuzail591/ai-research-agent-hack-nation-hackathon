'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer ({
  content,
  className = ''
}: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className='pb-2 mt-6 mb-4 text-2xl font-bold border-b text-foreground border-divider'>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className='mt-5 mb-3 text-xl font-bold text-foreground'>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className='mt-4 mb-2 text-lg font-semibold text-foreground'>
              {children}
            </h3>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className='mb-4 leading-7 text-default-700'>{children}</p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className='mb-4 space-y-2 list-disc list-inside text-default-700'>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className='mb-4 space-y-2 list-decimal list-inside text-default-700'>
              {children}
            </ol>
          ),
          li: ({ children }) => <li className='ml-4 leading-7'>{children}</li>,

          // Links - Make them stand out and clickable
          a: ({ href, children }) => (
            <a
              href={href}
              target='_blank'
              rel='noopener noreferrer'
              className='font-medium underline transition-colors text-primary hover:text-primary-600 decoration-primary/30 hover:decoration-primary'
            >
              {children}
            </a>
          ),

          // Inline code
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag='div'
                className='my-4 text-sm rounded-lg'
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code
                className='bg-default-100 px-1.5 py-0.5 rounded text-sm font-mono text-primary'
                {...props}
              >
                {children}
              </code>
            )
          },

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className='pl-4 my-4 italic border-l-4 border-primary text-default-600'>
              {children}
            </blockquote>
          ),

          // Horizontal rule
          hr: () => <hr className='my-6 border-divider' />,

          // Strong/Bold
          strong: ({ children }) => (
            <strong className='font-bold text-foreground'>{children}</strong>
          ),

          // Emphasis/Italic
          em: ({ children }) => (
            <em className='italic text-default-700'>{children}</em>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
