import { useState, useEffect, useRef } from 'react'

export default function Chat({ messages, socket, roomId, user }) {
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = (e) => {
    e.preventDefault()
    if (message.trim()) {
      socket.emit('chatMessage', {
        roomId,
        userId: user._id,
        username: user.username,
        message: message.trim(),
      })
      setMessage('')
    }
  }

  return (
    <div className="bg-poker-light rounded-2xl p-4 h-[500px] flex flex-col">
      <h3 className="text-white font-bold mb-4">Chat</h3>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded ${
              msg.type === 'system' ? 'bg-poker-darker text-gray-400 text-sm' : 'bg-poker-dark'
            }`}
          >
            {msg.type !== 'system' && (
              <p className="font-bold text-poker-gold text-sm">{msg.username}:</p>
            )}
            <p className="text-white">{msg.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="input-field flex-1"
        />
        <button type="submit" className="btn-primary px-4">
          Send
        </button>
      </form>
    </div>
  )
}
