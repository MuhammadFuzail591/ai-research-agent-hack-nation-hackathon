'use client'

import React from 'react'
import { Avatar } from '@heroui/react'
import { Icon } from '@iconify/react'
import type { UIMessagePart, UITools } from 'ai'
import MarkdownRenderer from './markdown-renderer'
import { UIDataTypes } from 'ai'

interface MessageProps {
  role: 'user' | 'assistant'
  parts: UIMessagePart<UIDataTypes, UITools>[]
}

export function Message ({ role, parts }: MessageProps) {
  const isUser = role === 'user'

  // Combine all text parts
  const textContent = parts
    .filter(part => part.type === 'text')
    .map(part => (part as any).text)
    .join('\n')

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <Avatar
        className='flex-shrink-0'
        icon={
          isUser ? (
            <Icon icon='solar:user-bold' width={20} />
          ) : (
            <Icon icon='solar:atom-bold' width={20} />
          )
        }
        size='sm'
        color={isUser ? 'primary' : 'secondary'}
      />

      {/* Message Content */}
      <div
        className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : 'text-left'}`}
      >
        <div
          className={`inline-block rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-default-100 text-foreground'
          }`}
        >
          {isUser ? (
            // User messages: simple text
            <p className='text-sm leading-6 break-words whitespace-pre-wrap'>
              {textContent}
            </p>
          ) : (
            // Assistant messages: rendered markdown
            <MarkdownRenderer content={textContent} />
          )}
        </div>
      </div>
    </div>
  )
}
