
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, MessageSquare, Trash, Edit2, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ChatHistoryItem = {
  id: string;
  title: string;
  timestamp: Date;
  lastMessage?: string;
};

interface ChatHistorySidebarProps {
  activeChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  chatList: Array<{ id: string; title: string; timestamp: Date; lastMessage?: string }>;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
}

const ChatHistorySidebar = ({ activeChatId, onChatSelect, onNewChat, chatList, onDeleteChat, onRenameChat }: ChatHistorySidebarProps) => {
  const navigate = useNavigate();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [contextMenu, setContextMenu] = useState<{ chatId: string; x: number; y: number } | null>(null);

  const formatDate = (date: Date) => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  };

  // Chat rename handlers
  const handleStartRename = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
    setContextMenu(null);
  };

  const handleSaveRename = () => {
    if (editingChatId && editingTitle.trim()) {
      onRenameChat(editingChatId, editingTitle.trim());
    }
    setEditingChatId(null);
    setEditingTitle('');
  };

  const handleCancelRename = () => {
    setEditingChatId(null);
    setEditingTitle('');
  };

  // Context menu handlers
  const handleChatRightClick = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ chatId, x: e.clientX, y: e.clientY });
  };

  const handleContextMenuAction = (action: 'rename' | 'delete', chatId: string) => {
    const chat = chatList.find(c => c.id === chatId);
    if (!chat) return;
    
    if (action === 'rename') {
      handleStartRename(chatId, chat.title);
    } else if (action === 'delete') {
      onDeleteChat(chatId);
    }
    setContextMenu(null);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="h-full flex flex-col bg-secondary/20 border-r border-border">
      {/* New Chat Button */}
      <div className="p-4">
        <Button 
          onClick={onNewChat}
          className="w-full justify-start gap-2" 
          variant="outline"
        >
          <Plus size={16} />
          New Chat
        </Button>
      </div>
      
      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
        {chatList.length > 0 ? (
          <div className="space-y-1">
            {chatList.map((chat) => (
              <div key={chat.id} className="flex items-center group">
                {editingChatId === chat.id ? (
                  <div className="flex-1 p-2">
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="mb-2"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename();
                        if (e.key === 'Escape') handleCancelRename();
                      }}
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={handleSaveRename}
                        disabled={!editingTitle.trim()}
                        className="h-6 px-2"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelRename}
                        className="h-6 px-2"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Button
                      variant={activeChatId === chat.id ? "secondary" : "ghost"}
                      className="w-full justify-start text-left h-auto py-2 px-3 flex-1"
                      onClick={() => onChatSelect(chat.id)}
                      onContextMenu={(e) => handleChatRightClick(e, chat.id)}
                    >
                      <div className="flex items-start gap-3">
                        <MessageSquare size={16} className="mt-1 shrink-0" />
                        <div className="truncate">
                          <div className="font-medium truncate">{chat.title}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(new Date(chat.timestamp))}</div>
                        </div>
                      </div>
                    </Button>
                    <button
                      className="ml-2 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-opacity opacity-0 group-hover:opacity-100"
                      title="Delete chat"
                      onClick={() => onDeleteChat(chat.id)}
                      tabIndex={-1}
                    >
                      <Trash size={16} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No chat history yet
          </div>
        )}
      </div>
      
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
            onClick={() => handleContextMenuAction('rename', contextMenu.chatId)}
          >
            <Edit2 className="w-3 h-3" />
            Rename
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={() => handleContextMenuAction('delete', contextMenu.chatId)}
          >
            <Trash className="w-3 h-3" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChatHistorySidebar;
