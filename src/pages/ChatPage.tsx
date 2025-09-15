import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, User, Bot, Edit, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import ChatHistorySidebar from '@/components/chat/ChatHistorySidebar'
import { ScrollArea } from '@/components/ui/scroll-area'

// Function to get AI responses from the backend
const getAiResponse = async (message: string): Promise<string> => {
  try {
    const response = await fetch('http://localhost:4000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userInput: message 
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get AI response');
    }
    
    return data.response;
  } catch (error) {
    console.error('Error getting AI response:', error);
    return "Sorry, I'm having trouble connecting to my brain right now. Please try again later.";
      }
};

type Message = {
  id: number;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

type Chat = {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
};

const ChatPage = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Record<string, Chat>>({});
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  // Chat list for sidebar
  const [chatList, setChatList] = useState<Array<{ id: string; title: string; timestamp: Date; lastMessage?: string }>>([]);
  
  // Message editing state
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [contextMenu, setContextMenu] = useState<{ messageId: number; x: number; y: number } | null>(null);

      // Load chats from localStorage when component mounts
  useEffect(() => {
    if (user) {
      const savedChatsList = localStorage.getItem(`chats_list_${user.id}`);
      if (savedChatsList) {
        try {
          const chatsList = JSON.parse(savedChatsList).map((chat: any) => ({
            ...chat,
            timestamp: new Date(chat.timestamp)
          }));
          setChatList(chatsList);
          const chatsMap: Record<string, Chat> = {};
          chatsList.forEach((chatInfo: { id: string; title: string; timestamp: Date }) => {
            const chatMessages = localStorage.getItem(`chat_${user.id}_${chatInfo.id}`);
            if (chatMessages) {
              try {
                const parsedMessages = JSON.parse(chatMessages).map((msg: any) => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp)
                }));
                chatsMap[chatInfo.id] = {
                  id: chatInfo.id,
                  title: chatInfo.title,
                  messages: parsedMessages,
                  timestamp: chatInfo.timestamp
                };
              } catch (error) {
                console.error('Error parsing chat messages:', error);
              }
            }
          });
          setChats(chatsMap);
          if (chatsList.length > 0) {
            const sortedChats = [...chatsList].sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            setActiveChat(sortedChats[0].id);
            if (chatsMap[sortedChats[0].id]) {
              setMessages(chatsMap[sortedChats[0].id].messages);
            }
          } else {
            createNewChat();
          }
        } catch (error) {
          console.error('Error loading chats:', error);
          createNewChat();
        }
      } else {
        createNewChat();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (user && activeChat && messages.length > 0) {
      localStorage.setItem(`chat_${user.id}_${activeChat}`, JSON.stringify(messages));
      setChats(prev => {
        const updatedChats = { ...prev };
        updatedChats[activeChat] = {
          ...updatedChats[activeChat],
          messages: messages,
          title: updatedChats[activeChat]?.title || (messages[1]?.sender === 'user' ? messages[1].content.slice(0, 30) : 'New Chat'),
        };
        return updatedChats;
      });
    }
  }, [messages, activeChat, user]);

  // No longer needed: chat list is managed above

  // Scroll to bottom of chat area when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        (viewport as HTMLElement).scrollTop = (viewport as HTMLElement).scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const createNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat: Chat = {
      id: newChatId,
      title: 'New Chat',
      messages: [
        {
          id: 1,
          content: "Hi there! I'm Mindful, your AI mental health companion. How are you feeling today?",
          sender: 'ai',
          timestamp: new Date(),
        }
      ],
      timestamp: new Date()
    };
    setChats(prev => {
      const updated = { ...prev, [newChatId]: newChat };
      // Update chat list state and localStorage
      if (user) {
        const chatsList = Object.values(updated).map(chat => ({
          id: chat.id,
          title: chat.title,
          timestamp: chat.timestamp,
          lastMessage: chat.messages[chat.messages.length - 1]?.content.slice(0, 30)
        }));
        setChatList(chatsList);
        localStorage.setItem(`chats_list_${user.id}`, JSON.stringify(chatsList));
      }
      return updated;
    });
    setActiveChat(newChatId);
    setMessages(newChat.messages);
    setInputValue('');
  };

  const handleChatSelect = (chatId: string) => {
    if (chats[chatId]) {
      setActiveChat(chatId);
      setMessages(chats[chatId].messages);
      setInputValue('');
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeChat) return;
    const userMessage: Message = {
      id: messages.length + 1,
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);
    try {
      const aiResponse = await getAiResponse(inputValue);
      const aiMessage: Message = {
        id: messages.length + 2,
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prevMessages => [...prevMessages, aiMessage]);
      // If this is the first user message, update chat title and chat list immediately
      if (chats[activeChat].messages.length <= 1) {
        const newTitle = userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? '...' : '');
        setChats(prev => {
          const updated = {
            ...prev,
            [activeChat]: {
              ...prev[activeChat],
              title: newTitle,
              timestamp: new Date()
            }
          };
          // Update chat list state and localStorage
          if (user) {
            const chatsList = Object.values(updated).map(chat => ({
              id: chat.id,
              title: chat.title,
              timestamp: chat.timestamp,
              lastMessage: chat.messages[chat.messages.length - 1]?.content.slice(0, 30)
            }));
            setChatList(chatsList);
            localStorage.setItem(`chats_list_${user.id}`, JSON.stringify(chatsList));
          }
          return updated;
        });
      }
    } catch (error) {
      toast.error('Failed to get a response. Please try again.');
      console.error('Error getting AI response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete chat handler
  const handleDeleteChat = (chatId: string) => {
    if (!user) return;
    // Remove chat messages
    localStorage.removeItem(`chat_${user.id}_${chatId}`);
    // Remove from chat list and chats state
    setChats(prev => {
      const updated = { ...prev };
      delete updated[chatId];
      // Update chat list state and localStorage
      const chatsList = Object.values(updated).map(chat => ({
        id: chat.id,
        title: chat.title,
        timestamp: chat.timestamp,
        lastMessage: chat.messages[chat.messages.length - 1]?.content.slice(0, 30)
      }));
      setChatList(chatsList);
      localStorage.setItem(`chats_list_${user.id}`, JSON.stringify(chatsList));
      return updated;
    });
    // If the deleted chat is active, trigger new chat
    if (activeChat === chatId) {
      createNewChat();
    }
  };

  // Message editing handlers
  const handleEditMessage = (messageId: number, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
    setContextMenu(null);
  };

  const handleSaveEdit = () => {
    if (!editingMessageId || !editingContent.trim()) return;
    
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === editingMessageId 
          ? { ...msg, content: editingContent.trim() }
          : msg
      )
    );
    
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleResendMessage = async (messageId: number) => {
    const message = messages.find(msg => msg.id === messageId);
    if (!message || message.sender !== 'user') return;
    
    setContextMenu(null);
    setIsLoading(true);
    
    try {
      const aiResponse = await getAiResponse(message.content);
      const aiMessage: Message = {
        id: Date.now(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (error) {
      toast.error('Failed to get a response. Please try again.');
      console.error('Error getting AI response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Context menu handlers
  const handleMessageRightClick = (e: React.MouseEvent, messageId: number) => {
    e.preventDefault();
    const message = messages.find(msg => msg.id === messageId);
    if (message && message.sender === 'user') {
      setContextMenu({ messageId, x: e.clientX, y: e.clientY });
    }
  };

  const handleContextMenuAction = (action: 'edit' | 'resend', messageId: number) => {
    const message = messages.find(msg => msg.id === messageId);
    if (!message) return;
    
    if (action === 'edit') {
      handleEditMessage(messageId, message.content);
    } else if (action === 'resend') {
      handleResendMessage(messageId);
    }
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Rename chat handler
  const handleRenameChat = (chatId: string, newTitle: string) => {
    if (!user) return;
    
    setChats(prev => {
      const updated = { ...prev };
      if (updated[chatId]) {
        updated[chatId] = {
          ...updated[chatId],
          title: newTitle
        };
        
        // Update chat list state and localStorage
        const chatsList = Object.values(updated).map(chat => ({
          id: chat.id,
          title: chat.title,
          timestamp: chat.timestamp,
          lastMessage: chat.messages[chat.messages.length - 1]?.content.slice(0, 30)
        }));
        setChatList(chatsList);
        localStorage.setItem(`chats_list_${user.id}`, JSON.stringify(chatsList));
      }
      return updated;
    });
  };

  return (
    <div className="container mx-auto px-0 py-8 h-[calc(100vh-200px)] min-h-[560px]">
      <ResizablePanelGroup direction="horizontal" className="h-full border rounded-lg overflow-hidden">
        {/* Chat History Sidebar */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <ChatHistorySidebar 
            activeChatId={activeChat}
            onChatSelect={handleChatSelect}
            onNewChat={createNewChat}
            chatList={chatList}
            onDeleteChat={handleDeleteChat}
            onRenameChat={handleRenameChat}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        {/* Chat Content */}
        <ResizablePanel defaultSize={80}>
          <div className="flex flex-col h-full">
            <div className="bg-card rounded-t-lg p-4 border-b border-border">
              <h1 className="text-2xl font-bold text-center">Chat with Mindful</h1>
              <p className="text-muted-foreground text-center text-sm mt-1">
                I'm here to listen, support, and provide guidance whenever you need it.
              </p>
            </div>
            {/* Chat Messages */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 bg-secondary/30">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-accent text-accent-foreground glass'
                      }`}
                      onContextMenu={(e) => handleMessageRightClick(e, message.id)}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center">
                          {message.sender === 'user' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                        </div>
                        <span className="text-xs opacity-70">
                          {message.sender === 'user' ? 'You' : 'Mindful'}
                        </span>
                      </div>
                      
                      {editingMessageId === message.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="min-h-[60px] min-w-[600px] resize-none bg-transparent border-none p-0 text-sm focus:ring-0 focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveEdit();
                                handleResendMessage(message.id);
                              }
                              if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                handleSaveEdit();
                                handleResendMessage(message.id);
                              }}
                              disabled={!editingContent.trim()}
                            >
                              Send
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          <div className="text-xs opacity-50 text-right mt-1">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center space-x-2 bg-accent rounded-lg p-3 max-w-[80%] text-accent-foreground glass">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Mindful is typing...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            {/* Input Area */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="w-10 h-10 p-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="sr-only">Send message</span>
                </Button>
              </div>
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">
                  Sample prompts: "I'm feeling anxious today", "I had a great day", "I'm struggling with..."
                </p>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      
      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-popover border border-border rounded-md shadow-lg p-1 min-w-[120px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => handleContextMenuAction('edit', contextMenu.messageId)}
          >
            <Edit className="w-3 h-3" />
            Edit
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
