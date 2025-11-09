'use client'

import React from 'react'
import { ScrollShadow } from '@heroui/react'
import { cn } from '@heroui/react'
import type { UIMessage } from 'ai'

import PromptInputWithBottomActions from './prompt-input-with-bottom-actions'
import { Message } from './Message'

interface StatusMessage {
  id: string
  type: 'status'
  content: string
}

type DisplayMessage = UIMessage | StatusMessage

export default function NewChatComponent ({
  className,
  scrollShadowClassname
}: {
  className?: string
  scrollShadowClassname?: string
}) {
  const [messages, setMessages] = React.useState<DisplayMessage[]>([])
  const [input, setInput] = React.useState('AI for climate modeling research')
  const [isLoading, setIsLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: UIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      parts: [{ type: 'text', text: input }]
    }

    // Add user message
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Create assistant message placeholder
    const assistantMessageId = `assistant-${Date.now()}`
    const assistantMessage: UIMessage = {
      id: assistantMessageId,
      role: 'assistant',
      parts: [{ type: 'text', text: '' }]
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [userMessage]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''
      let currentText = ''
      let hasAddedAssistantMessage = false

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('0:')) continue

          try {
            const jsonStr = line.slice(2) // Remove '0:' prefix
            const data = JSON.parse(jsonStr)

            if (data.type === 'status') {
              // Add status message
              const statusMessage: StatusMessage = {
                id: `status-${Date.now()}`,
                type: 'status',
                content: data.content
              }
              setMessages(prev => [...prev, statusMessage])
            } else if (data.type === 'text-delta') {
              // Append to assistant message
              currentText += data.content

              if (!hasAddedAssistantMessage) {
                // Add assistant message for the first time
                assistantMessage.parts = [{ type: 'text', text: currentText }]
                setMessages(prev => [...prev, assistantMessage])
                hasAddedAssistantMessage = true
              } else {
                // Update existing assistant message
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, parts: [{ type: 'text', text: currentText }] }
                      : msg
                  )
                )
              }
            } else if (data.type === 'finish') {
              // Remove all status messages when done
              setMessages(prev =>
                prev.filter(msg => !('type' in msg) || msg.type !== 'status')
              )
            } else if (data.type === 'error') {
              // Show error
              const errorMessage: UIMessage = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                parts: [{ type: 'text', text: `❌ ${data.content}` }]
              }
              setMessages(prev => [...prev, errorMessage])
            }
          } catch (parseError) {
            console.error('Failed to parse line:', line, parseError)
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: UIMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: '❌ Failed to process your request. Please try again.'
          }
        ]
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={cn('flex h-full w-full flex-col justify-between', className)}
    >
      {/* Conversation Area */}
      <div className='flex-1 overflow-y-auto' ref={scrollRef}>
        <ScrollShadow
          className={cn('flex flex-col gap-4 p-4', scrollShadowClassname)}
        >
          {messages.map(message => {
            // Check if it's a status message
            if ('type' in message && message.type === 'status') {
              return (
                <div key={message.id} className='flex justify-center'>
                  <div className='px-4 py-2 text-sm rounded-full bg-default-100 text-default-600'>
                    {message.content}
                  </div>
                </div>
              )
            }

            // Regular message
            return (
              <Message
                key={message.id}
                role={message.role}
                parts={message.parts}
              />
            )
          })}

          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1].role === 'user' && (
              <div className='flex justify-center'>
                <div className='px-4 py-2 text-sm rounded-full bg-default-100 text-default-600'>
                  🤔 Initializing research agents...
                </div>
              </div>
            )}
        </ScrollShadow>
      </div>

      {/* Prompt Input Area */}
      <div className='sticky bottom-0 flex flex-col gap-2 p-4'>
        <PromptInputWithBottomActions
          input={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          disabled={isLoading}
        />
        <p className='px-2 text-tiny text-default-400'>
          Research agents will analyze your topic using multiple perspectives.
          This may take 30-60 seconds.
        </p>
      </div>
    </div>
  )
}
