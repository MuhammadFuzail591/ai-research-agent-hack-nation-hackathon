'use client'

import React from 'react'
import { ScrollShadow } from '@heroui/react'
import { cn } from '@heroui/react'
import { useChat } from '@ai-sdk/react'

import PromptInputWithBottomActions from './prompt-input-with-bottom-actions'
import { Message } from './Message'
import { DefaultChatTransport } from 'ai'

export default function NewChatComponent ({
  className,
  scrollShadowClassname
}: {
  className?: string
  scrollShadowClassname?: string
}) {
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat'
    })
  })
  const [input, setInput] = React.useState(
    `Write a Slack message to your boss complaining about a colleague's hygiene.`
  )
  return (
    <div
      className={cn('flex h-full w-full flex-col justify-between', className)}
    >
      {/* Conversation Area */}
      <div className='flex-1 overflow-y-auto'>
        <ScrollShadow
          className={cn('flex flex-col gap-4 p-4', scrollShadowClassname)}
        >
          {messages.map(message => (
            <Message
              key={message.id}
              role={message.role}
              parts={message.parts}
            />
          ))}
        </ScrollShadow>
      </div>

      {/* Prompt Input Area */}
      <div className='sticky bottom-0 flex flex-col gap-2 p-4'>
        <PromptInputWithBottomActions
          input={input}
          onChange={setInput}
          onSubmit={e => {
            e.preventDefault()
            if (!input.trim()) return
            sendMessage({ text: input })
            setInput('')
          }}
        />
        <p className='px-2 text-tiny text-default-400'>
          AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  )
}
