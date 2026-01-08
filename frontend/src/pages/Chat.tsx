import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { textToMorse } from '../utils/morseData';
import FriendsSidebar from '../components/FriendsSidebar';
import client from '../api/client';

interface Message {
  id: string;
  username?: string;
  sender_id?: number;
  text: string;
  morse: string;
  timestamp?: string;
  created_at?: string;
}

interface Conversation {
  id: number;
  other_user: {
    id: number;
    username: string;
  };
}

const Chat = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'bot' | 'friends'>('bot');
  const [messages, setMessages] = useState<Message[]>([]);
  const [privateMessages, setPrivateMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [hideEnglish, setHideEnglish] = useState(false);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('chat_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    newSocket.on('private_message', (msg: Message) => {
      setPrivateMessages((prev) => [...prev, msg]);
    });

    return () => {
        newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, privateMessages]);

  useEffect(() => {
    if (socket && activeConversation) {
      socket.emit('join_conversation', activeConversation.id);
      fetchPrivateMessages(activeConversation.id);
    }
  }, [activeConversation, socket]);

  const fetchPrivateMessages = async (convId: number) => {
    try {
      const response = await client.get(`/chat/${convId}/messages`);
      setPrivateMessages(response.data);
    } catch (err) {
      console.error('Failed to fetch private messages', err);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && socket && user) {
        if (activeTab === 'friends' && activeConversation) {
          // Send private message
          const msg = {
            conversation_id: activeConversation.id,
            sender_id: user.id,
            username: user.username,
            text: input,
            morse: textToMorse(input),
            timestamp: new Date().toLocaleTimeString()
          };
          socket.emit('private_message', msg);
        } else {
          // Send global message  
          const msg = {
            id: Date.now().toString(),
            username: user.username,
            text: input,
            morse: textToMorse(input),
            timestamp: new Date().toLocaleTimeString()
          };
          socket.emit('chat_message', msg);
        }
        setInput('');
    }
  };

  // Filter messages based on active tab
  const filteredMessages = activeTab === 'bot' 
    ? messages.filter(m => m.username === 'MorseBot' || m.username === user?.username)
    : messages;

  const displayMessages = activeTab === 'friends' && activeConversation 
    ? privateMessages 
    : filteredMessages;

  return (
    <div className="w-full h-full flex bg-white dark:bg-black">
      {activeTab === 'friends' && (
        <FriendsSidebar
          onSelectConversation={setActiveConversation}
        />
      )}

      <div className="flex-1 flex flex-col px-6">
        <div className="pt-6 mb-4">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Morse Chat</h1>
          <p className="text-gray-500 text-sm">Connect, learn, and communicate in Morse code</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4 border-b dark:border-gray-800">
          <button
            onClick={() => { setActiveTab('bot'); setActiveConversation(null); }}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'bot'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              Chat with MorseBot
            </span>
            {activeTab === 'bot' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'friends'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">👥</span>
              Chat with Friends
            </span>
            {activeTab === 'friends' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
            )}
          </button>
          
          <div className="ml-auto flex items-center">
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={hideEnglish} onChange={e => setHideEnglish(e.target.checked)} className="sr-only peer" />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Hide English</span>
            </label>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {activeTab === 'bot' 
              ? '💡 Ask MorseBot anything! Math, science, definitions, or Wikipedia searches.'
              : activeConversation 
                ? `💬 Chatting with ${activeConversation.other_user.username}`
                : '👈 Select a friend from the sidebar to start chatting!'
            }
          </p>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-800 rounded-3xl p-6 space-y-4 mb-6 shadow-inner">
          {displayMessages.map((msg, idx) => {
            const isCurrentUser = msg.username === user?.username || msg.sender_id === user?.id;
            const displayName = msg.username || (activeConversation && msg.sender_id === activeConversation.other_user.id ? activeConversation.other_user.username : user?.username);
            
            return (
              <div key={msg.id || idx} className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                  <div className={`flex flex-col max-w-[80%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                      <div 
                          className={`px-4 py-2 rounded-2xl shadow-sm relative ${
                              isCurrentUser 
                                  ? 'bg-blue-600 text-white rounded-br-none' 
                                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-none'
                          }`}
                      >
                          {!hideEnglish && <p className="text-base leading-relaxed">{msg.text}</p>}
                          <p className={`font-mono mt-1 ${hideEnglish ? 'text-lg font-bold' : 'text-xs opacity-80 border-t border-white/20 dark:border-gray-600/50 pt-1'}`}>
                              {msg.morse}
                          </p>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1">
                          {!isCurrentUser && <span className="font-semibold mr-2">{displayName}</span>}
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : msg.timestamp}
                      </span>
                  </div>
              </div>
            );
          })}
          {displayMessages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <p>
                    {activeTab === 'bot' 
                      ? 'Start chatting with MorseBot!' 
                      : activeConversation 
                        ? 'No messages yet. Say hello!' 
                        : 'Select a friend to start chatting!'
                    }
                  </p>
              </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-2 bg-white dark:bg-gray-900 p-2 rounded-2xl border dark:border-gray-800">
          <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 p-3 bg-transparent border-none text-gray-900 dark:text-white focus:ring-0 placeholder-gray-400"
              placeholder={activeTab === 'bot' ? 'Ask MorseBot anything...' : 'Type your message...'}
              disabled={activeTab === 'friends' && !activeConversation}
          />
          <button 
              type="submit" 
              className="text-white bg-blue-600 hover:bg-blue-700 font-bold rounded-xl px-6 py-2 transition-colors disabled:opacity-50"
              disabled={!input.trim() || (activeTab === 'friends' && !activeConversation)}
          >
              Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
