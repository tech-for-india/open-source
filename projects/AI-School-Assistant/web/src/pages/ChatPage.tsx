import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api, chatApi } from '../services/api';
import { Send, Plus, MessageSquare, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    try {
      const response = await api.get('/chats');
      setChats(response.data.chats);
    } catch (error) {
      toast.error('Failed to load chats');
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const response = await api.get(`/chats/${chatId}`);
      setMessages(response.data.chat.messages);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const createNewChat = async () => {
    try {
      const response = await api.post('/chats', { title: 'New Chat' });
      const newChat = response.data.chat;
      setChats([newChat, ...chats]);
      setSelectedChat(newChat);
      setMessages([]);
    } catch (error) {
      toast.error('Failed to create new chat');
    }
  };

  const sendMessage = async () => {
    if (!selectedChat || !newMessage.trim() || streaming) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'USER' as const,
      content: newMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = newMessage;
    setNewMessage('');
    setStreaming(true);

    // Create assistant message placeholder
    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'ASSISTANT' as const,
      content: '',
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const stream = await chatApi.sendMessage(selectedChat.id, messageContent);
      const reader = stream?.getReader();
      
      if (!reader) {
        throw new Error('Failed to get stream reader');
      }

      const decoder = new TextDecoder();
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                toast.error(data.error);
                break;
              }

              if (data.content) {
                assistantContent += data.content;
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: assistantContent }
                      : msg
                  )
                );
              }

              if (data.done) {
                break;
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }

      // Update the final message with proper ID from server
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: assistantContent }
            : msg
        )
      );

      // Refresh chat list to update message count
      loadChats();

    } catch (error) {
      toast.error('Failed to send message');
      // Remove the assistant message if there was an error
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id));
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      await api.delete(`/chats/${chatId}`);
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
        setMessages([]);
      }
      toast.success('Chat deleted successfully');
    } catch (error) {
      toast.error('Failed to delete chat');
    }
  };

  return (
    <div className="h-[calc(100vh-200px)] flex">
      {/* Chat List */}
              <div className="w-80 border-r border-gray-200 bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Chats</h2>
          <button
            onClick={createNewChat}
            className="btn-primary btn-sm"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center justify-between p-3 rounded-md transition-colors ${
                selectedChat?.id === chat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              <button
                onClick={() => setSelectedChat(chat)}
                className="flex-1 text-left"
              >
                <div className="font-medium truncate">{chat.title}</div>
                <div className="text-sm opacity-75">
                  {chat._count.messages} messages
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
                className="ml-2 p-1 hover:bg-destructive hover:text-destructive-foreground rounded"
                title="Delete chat"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'USER' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.role === 'USER'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
              {streaming && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="input flex-1 resize-none"
                  rows={3}
                  disabled={streaming}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || streaming}
                  className="btn-primary self-end"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No chat selected</h3>
              <p className="text-muted-foreground">
                Select a chat from the sidebar or create a new one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
