import React, { useState, useEffect } from 'react';
import client from '../api/client';

interface Conversation {
  id: number;
  display_name: string;
  is_group: boolean;
  last_message?: string;
  last_message_at?: string;
}

interface ChatSidebarProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedId?: number;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ onSelectConversation, selectedId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await client.get('/chat/list');
      setConversations(response.data);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length > 2) {
      setIsSearching(true);
      try {
        const response = await client.get(`/chat/users/search?query=${term}`);
        setSearchResults(response.data);
      } catch (err) {
        console.error('Search failed', err);
      }
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  const startNewChat = async (otherUser: any) => {
    try {
      const response = await client.post('/chat/create', {
        name: null,
        isGroup: false,
        participantIds: [otherUser.id]
      });
      const newConv = {
          id: response.data.id,
          display_name: otherUser.username,
          is_group: false
      };
      setConversations(prev => [newConv, ...prev]);
      onSelectConversation(newConv);
      setSearchTerm('');
      setIsSearching(false);
    } catch (err) {
      console.error('Failed to create conversation', err);
    }
  };

  return (
    <div className="w-80 border-r dark:border-gray-700 h-full flex flex-col bg-white dark:bg-gray-800">
      <div className="p-4 border-b dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4 dark:text-white">Chats</h2>
        <div className="relative">
          <input
            type="text"
            className="w-full p-2 text-sm bg-gray-100 dark:bg-gray-700 border-none rounded-lg dark:text-white"
            placeholder="Search users to chat..."
            value={searchTerm}
            onChange={handleSearch}
          />
          {isSearching && searchResults.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-10">
              {searchResults.map(u => (
                <div
                  key={u.id}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b last:border-none dark:border-gray-700"
                  onClick={() => startNewChat(u)}
                >
                  <p className="font-medium dark:text-white">{u.username}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.map(conv => (
          <div
            key={conv.id}
            className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-700 ${selectedId === conv.id ? 'bg-blue-50 dark:bg-gray-700' : ''}`}
            onClick={() => onSelectConversation(conv)}
          >
            <div className="flex justify-between items-start">
              <p className="font-bold dark:text-white">{conv.display_name}</p>
              {conv.last_message_at && (
                <span className="text-[10px] text-gray-400">
                  {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            {conv.last_message && (
              <p className="text-sm text-gray-500 truncate mt-1">
                {conv.last_message}
              </p>
            )}
          </div>
        ))}
        {conversations.length === 0 && !isSearching && (
          <div className="p-8 text-center text-gray-500">
            No chats yet. Search for a friend to start!
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
