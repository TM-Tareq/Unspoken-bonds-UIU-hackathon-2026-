import { useEffect, useState } from 'react';
import client from '../api/client';

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    client.get('/user/profile')
      .then(res => setProfile(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!profile) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sm:p-10">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-blue-600 uppercase">
              {profile.username[0]}
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-white max-w-lg truncate">{profile.username}</h1>
              <p className="text-blue-100">{profile.email}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 sm:gap-4 p-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-gray-700">
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">Total Points</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{profile.stats.total_points}</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">Current Streak</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{profile.stats.streak_days} Days</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">Level</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{profile.stats.current_level}</p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Progress Overview</h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-700 dark:text-gray-200">Completed Lessons</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 text-xl">{profile.completedLessons}</span>
          </div>
          {/* Add more charts/graphs here if needed */}
        </div>
      </div>
    </div>
  );
};

export default Profile;
