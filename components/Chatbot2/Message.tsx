import { UIDataTypes, UIMessagePart, UITools } from 'ai'
import ReactMarkdown from 'react-markdown'

export const Message = ({
  role,
  parts
}: {
  role: string
  parts: UIMessagePart<UIDataTypes, UITools>[]
}) => {
  const prefix = role === 'user' ? 'User: ' : 'AI: '

  const text = parts
    .map(part => {
      if (part.type === 'text') {
        return part.text
      }
      return ''
    })
    .join('')
  return (
    <div className='my-6 prose prose-invert'>
      <ReactMarkdown>{prefix + text}</ReactMarkdown>
    </div>
  )
}
