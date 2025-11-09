'use client'

import React from 'react'
import { Button, Tooltip, ScrollShadow } from '@heroui/react'
import { Icon } from '@iconify/react'
import { cn } from '@heroui/react'

import PromptInput from './prompt-input'

export default function PromptInputWithBottomActions ({
  input,
  onChange,
  onSubmit,
  disabled,
  onAttachClick
}: {
  input: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  disabled?: boolean
  onAttachClick?: () => void
}) {
  const ideas = [
    {
      title: 'AI for climate modeling',
      description: 'research recent breakthroughs'
    },
    {
      title: 'Battery efficiency improvements',
      description: 'analyze latest innovations'
    },
    {
      title: 'Quantum computing applications',
      description: 'explore practical use cases'
    },
    {
      title: 'Renewable energy trends',
      description: 'synthesize current research'
    }
  ]

  return (
    <div className='flex flex-col w-full gap-4'>
      <ScrollShadow
        hideScrollBar
        className='flex gap-2 flex-nowrap'
        orientation='horizontal'
      >
        <div className='flex gap-2'>
          {ideas.map(({ title, description }, index) => (
            <Button
              key={index}
              className='flex flex-col items-start gap-0 h-14'
              variant='flat'
              onClick={() => onChange(title)}
              isDisabled={disabled}
            >
              <p>{title}</p>
              <p className='text-default-500'>{description}</p>
            </Button>
          ))}
        </div>
      </ScrollShadow>

      <form
        onSubmit={onSubmit}
        className='flex flex-col items-start w-full transition-colors rounded-medium bg-default-100 hover:bg-default-200/70'
      >
        <PromptInput
          classNames={{
            inputWrapper: '!bg-transparent shadow-none',
            innerWrapper: 'relative',
            input: 'pt-1 pl-2 pb-6 !pr-10 text-medium'
          }}
          disabled={disabled}
          endContent={
            <div className='flex items-end gap-2'>
              <Tooltip showArrow content='Send message'>
                <Button
                  isIconOnly
                  color={!input || disabled ? 'default' : 'primary'}
                  isDisabled={!input || disabled}
                  radius='lg'
                  size='sm'
                  variant='solid'
                  type='submit'
                >
                  <Icon
                    className={cn(
                      '[&>path]:stroke-[2px]',
                      !input || disabled
                        ? 'text-default-600'
                        : 'text-primary-foreground'
                    )}
                    icon='solar:arrow-up-linear'
                    width={20}
                  />
                </Button>
              </Tooltip>
            </div>
          }
          minRows={3}
          radius='lg'
          value={input}
          variant='flat'
          onValueChange={onChange}
        />

        <div className='flex items-center justify-between w-full gap-2 px-4 pb-4 overflow-scroll'>
          <div className='flex w-full gap-1 md:gap-3'>
            <Button
              size='sm'
              startContent={
                <Icon
                  className='text-default-500'
                  icon='solar:paperclip-linear'
                  width={18}
                />
              }
              variant='flat'
              isDisabled={disabled}
              onClick={onAttachClick}
            >
              Attach Files
            </Button>
          </div>
          <p className='py-1 text-tiny text-default-400'>
            {disabled ? '⏳ Researching...' : `${input.length}/2000`}
          </p>
        </div>
      </form>
    </div>
  )
}
