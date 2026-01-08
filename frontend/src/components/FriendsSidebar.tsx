import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Friend {
  id: number;
  username: string;
  friends_since?: string;
}

interface Conversation {
  id: number;
  other_user: {
    id: number;
    username: string;
  };
  last_message?: string;
  last_message_at?: string;
}

interface FriendRequest {
  id: number;
  user_id: number;
  username: string;
  created_at: string;
}

interface FriendsSidebarProps {
  onSelectConversation: (conversation: Conversation) => void;
}

const FriendsSidebar: React.FC<FriendsSidebarProps> = ({ onSelectConversation }) => {
  const { user: currentUser } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
    fetchSentRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await client.get('/friends/list');
      setFriends(response.data);
    } catch (err) {
      console.error('Failed to fetch friends', err);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await client.get('/friends/requests');
      setPendingRequests(response.data);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    }
  };

  const fetchSentRequests = async () => {
    try {
      const response = await client.get('/friends/sent');
      setSentRequests(response.data);
    } catch (err) {
      console.error('Failed to fetch sent requests', err);
    }
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length > 0) {
      try {
        const response = await client.get(`/chat/users/all?username=${term}`);
        setSearchResults(response.data);
      } catch (err) {
        console.error('Search failed', err);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const sendFriendRequest = async (userId: number, username: string) => {
    try {
      const response = await client.post('/friends/request', { friendId: userId });
      
      // Refresh everything
      fetchFriends();
      fetchPendingRequests();
      fetchSentRequests();
      
      alert(response.data.message || `Friend request sent to ${username}!`);
      setSearchTerm('');
      setSearchResults([]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send request');
    }
  };

  const respondToRequest = async (requestId: number, action: 'accept' | 'decline') => {
    try {
      await client.post('/friends/respond', { requestId, action });
      fetchPendingRequests();
      fetchFriends(); // Refresh friends list
      if (action === 'accept') {
        alert('Friend request accepted!');
      }
    } catch (err) {
      console.error('Failed to respond', err);
    }
  };

  const startChatWithFriend = async (friend: Friend) => {
    try {
      // Create or get existing conversation
      const response = await client.post('/chat/create', {
        participantId: friend.id
      });
      
      // Create conversation object and pass to parent
      const conversation: Conversation = {
        id: response.data.id,
        other_user: {
          id: friend.id,
          username: friend.username
        }
      };
      
      onSelectConversation(conversation);
    } catch (err) {
      console.error('Failed to start chat', err);
    }
  };

  return (
    <div className="w-80 border-r dark:border-gray-700 h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold dark:text-white">Friends</h3>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <svg className="w-5 h-5 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {pendingRequests.length > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Notification Panel */}
        {showNotifications && (
          <div className="mb-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 max-h-64 overflow-y-auto">
            <h4 className="font-semibold text-sm mb-2 dark:text-white">Friend Requests</h4>
            {pendingRequests.length === 0 ? (
              <p className="text-xs text-gray-500">No pending requests</p>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map(req => (
                  <div key={req.id} className="bg-white dark:bg-gray-700 p-2 rounded">
                    <p className="font-medium text-sm dark:text-white">{req.username}</p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => respondToRequest(req.id, 'accept')}
                        className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondToRequest(req.id, 'decline')}
                        className="flex-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Search Box */}
        <div className="relative">
          <input
            type="text"
            className="w-full p-2 text-sm bg-gray-100 dark:bg-gray-800 border-none rounded-lg dark:text-white placeholder-gray-500"
            placeholder="Search username to add..."
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {searchResults.map(u => (
                <div
                  key={u.id}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b last:border-none dark:border-gray-700 flex justify-between items-center"
                >
                  <span className="font-medium dark:text-white">{u.username}</span>
                  {u.friendship_status === 'accepted' ? (
                    <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">Friend</span>
                  ) : u.friendship_status === 'pending' ? (
                    <span className="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                      {u.requester_id === currentUser?.id ? 'Requested' : 'Sent you a request'}
                    </span>
                  ) : (
                    <button
                      onClick={() => sendFriendRequest(u.id, u.username)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      Add Friend
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Friends List */}
      <div className="flex-1 overflow-y-auto">
        {friends.map(friend => (
          <div
            key={friend.id}
            className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b dark:border-gray-700"
            onClick={() => startChatWithFriend(friend)}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold dark:text-white">{friend.username}</p>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <p className="text-xs text-green-600 font-medium">Friend</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        ))}
        {sentRequests.map(req => (
          <div
            key={req.id}
            className="p-4 bg-yellow-50/50 dark:bg-yellow-900/10 border-b dark:border-gray-700 opacity-75"
          >
            <div className="flex justify-between items-center text-sm">
              <div>
                <p className="font-semibold dark:text-white">{req.username}</p>
                <p className="text-xs text-yellow-600">Pending Request Sent</p>
              </div>
              <div className="text-xs text-gray-400">Waiting...</div>
            </div>
          </div>
        ))}
        {friends.length === 0 && sentRequests.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-2">No friends yet</p>
            <p className="text-xs">Search for users to add as friends!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsSidebar;
