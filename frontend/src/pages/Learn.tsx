import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import ChatWidget from '../components/ChatWidget';

interface Lesson {
  id: string;
  title: string;
}

interface Module {
  id: number;
  title: string;
  lessons: Lesson[];
}

const Learn = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const modRes = await client.get('/learn/modules');
        setModules(modRes.data);
        const progRes = await client.get('/learn/progress');
        const progMap: Record<string, boolean> = {};
        progRes.data.forEach((p: any) => {
           if(p.completed) progMap[p.lesson_id] = true;
        });
        setProgress(progMap);
      } catch (error) {
        console.error("Failed to fetch learning data", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Learning Center</h1>
      
      {/* Games Section */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mini Games</h2>
          <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">Fun Practice</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link 
            to="/games/matcher" 
            className="group relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300"
          >
            <div className="relative z-10">
              <span className="text-3xl mb-3 block">🧩</span>
              <h3 className="text-xl font-bold text-white mb-2">Morse Matcher</h3>
              <p className="text-indigo-100 text-sm">Match characters and words with their Morse code equivalents!</p>
            </div>
            <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 group-hover:scale-110 transition-transform duration-500">🧩</div>
          </Link>

          <Link 
            to="/games/racer" 
            className="group relative overflow-hidden bg-gradient-to-br from-orange-400 to-red-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300"
          >
            <div className="relative z-10">
              <span className="text-3xl mb-3 block">🏎️</span>
              <h3 className="text-xl font-bold text-white mb-2">Morse Racer</h3>
              <p className="text-orange-50 mb-2 text-sm italic">Coming Soon...</p>
              <p className="text-orange-100 text-sm">Test your speed! Type Morse code as fast as you can.</p>
            </div>
            <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 group-hover:scale-110 transition-transform duration-500">🏎️</div>
          </Link>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Learning Modules</h2>
      <div className="space-y-6">
        {modules.map((module) => (
          <div key={module.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">{module.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {module.lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  to={`/learn/${lesson.id}`}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    progress[lesson.id] 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium dark:text-white">{lesson.title}</span>
                    {progress[lesson.id] && (
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <ChatWidget />
    </div>
  );
};

export default Learn;
