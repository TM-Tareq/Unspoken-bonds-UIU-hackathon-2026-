import { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Friend {
  id: number;
  username: string;
  friends_since?: string;
}

interface FriendRequest {
  id: number;
  user_id: number;
  username: string;
  created_at: string;
}

const Friends = () => {
  const { user: currentUser } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');

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
        // Search ALL users, not just friends
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

  const sendFriendRequest = async (friendId: number) => {
    try {
      const response = await client.post('/friends/request', { friendId });
      
      // Refresh all data
      fetchFriends();
      fetchPendingRequests();
      fetchSentRequests();
      
      alert(response.data.message || 'Friend request sent!');
      setSearchTerm('');
      setSearchResults([]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send request');
    }
  };

  const respondToRequest = async (requestId: number, action: 'accept' | 'decline') => {
    try {
      await client.post('/friends/respond', { requestId, action });
      fetchFriends();
      fetchPendingRequests();
      fetchSentRequests();
    } catch (err) {
      console.error('Failed to respond', err);
    }
  };

  const removeFriend = async (friendId: number) => {
    if (!confirm('Remove this friend?')) return;
    try {
      await client.delete(`/friends/${friendId}`);
      fetchFriends();
    } catch (err) {
      console.error('Failed to remove friend', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">Friends</h1>

      {/* Search for new friends */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Add Friends</h2>
        <div className="relative">
          <input
            type="text"
            className="w-full p-3 bg-gray-100 dark:bg-gray-700 border-none rounded-lg dark:text-white"
            placeholder="Search by username..."
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-10">
              {searchResults.map(u => (
                <div
                  key={u.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center border-b last:border-none dark:border-gray-700"
                >
                  <span className="font-medium dark:text-white">{u.username}</span>
                  {u.friendship_status === 'accepted' ? (
                    <span className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full font-medium">Friend</span>
                  ) : u.friendship_status === 'pending' ? (
                    <span className="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full font-medium">
                      {u.requester_id === currentUser?.id ? 'Requested' : 'Sent you a request'}
                    </span>
                  ) : (
                    <button
                      onClick={() => sendFriendRequest(u.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
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

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b dark:border-gray-700">
        <button
          onClick={() => setActiveTab('friends')}
          className={`pb-2 px-4 font-semibold transition-colors relative ${
            activeTab === 'friends'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          My Friends ({friends.length})
          {activeTab === 'friends' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-2 px-4 font-semibold transition-colors relative ${
            activeTab === 'requests'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Friend Requests ({pendingRequests.length + sentRequests.length})
          {activeTab === 'requests' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
          )}
        </button>
      </div>

      {/* Friends List */}
      {activeTab === 'friends' && (
        <div className="space-y-3">
          {friends.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No friends yet. Search for users to add!</p>
            </div>
          ) : (
            friends.map(friend => (
              <div
                key={friend.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-lg dark:text-white">{friend.username}</p>
                  {friend.friends_since && (
                    <p className="text-xs text-gray-500">
                      Friends since {new Date(friend.friends_since).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeFriend(friend.id)}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm transition-colors"
                >
                  Unfriend
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Friend Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Incoming */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Incoming Requests</h3>
            {pendingRequests.length === 0 ? (
              <p className="text-center py-6 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg">No incoming requests</p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map(request => (
                  <div
                    key={request.id}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center border-l-4 border-blue-500"
                  >
                    <div>
                      <p className="font-bold dark:text-white">{request.username}</p>
                      <p className="text-xs text-gray-500">
                        Received {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => respondToRequest(request.id, 'accept')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondToRequest(request.id, 'decline')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Sent Requests</h3>
            {sentRequests.length === 0 ? (
              <p className="text-center py-6 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg">No outgoing requests</p>
            ) : (
              <div className="space-y-3">
                {sentRequests.map(request => (
                  <div
                    key={request.id}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center opacity-75"
                  >
                    <div>
                      <p className="font-bold dark:text-white">{request.username}</p>
                      <p className="text-xs text-gray-500">
                        Sent {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full uppercase tracking-wider">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Friends;
