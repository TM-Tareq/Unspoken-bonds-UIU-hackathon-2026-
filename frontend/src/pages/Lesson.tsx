import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { playMorseSound } from '../utils/audio';
import { textToMorse } from '../utils/morseData';
import ChatWidget from '../components/ChatWidget';

// Fetch modules locally or from API. For simplicity, we fetch all modules again or just find it.
// Ideally, we'd have a getLesson endpoint, but getting all modules is fine for this scale.

const Lesson = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    client.get('/learn/modules').then(res => {
      // Find lesson
      let found = null;
      for (const mod of res.data) {
        const learn = mod.lessons.find((l: any) => l.id === lessonId);
        if (learn) {
          found = learn;
          break;
        }
      }
      setLesson(found);
    });
  }, [lessonId]);

  if (!lesson) return <div className="p-8">Loading...</div>;

  const handlePlay = () => {
    if (lesson.morse) playMorseSound(lesson.morse);
  };

  const handleCheck = () => {
    if (lesson.type === 'practice') {
      const expected = lesson.morse || textToMorse(lesson.letter || '');
      if (input.trim() === expected) {
        setFeedback('Correct!');
        setCompleted(true);
        // Save progress
        client.post('/learn/complete', { lessonId, points: 10 })
          .catch(err => console.error(err));
      } else {
        setFeedback('Try again. Hints: ' + expected);
      }
    } else {
        setCompleted(true);
        client.post('/learn/complete', { lessonId, points: 5 });
        setFeedback('Lesson Completed!');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg mt-8">
      <button onClick={() => navigate('/learn')} className="mb-4 text-blue-600 hover:underline">← Back to Modules</button>
      <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">{lesson.title}</h1>
      
      <div className="mb-8 text-lg text-gray-700 dark:text-gray-300">
        {lesson.content}
      </div>

      {lesson.morse && (
        <div className="mb-6 flex items-center space-x-4">
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-2xl font-mono tracking-widest text-gray-900 dark:text-white">
            {lesson.morse}
          </div>
          <button 
            onClick={handlePlay}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            title="Play Audio"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
        </div>
      )}

      {lesson.type === 'practice' && (
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Type the Morse code:</label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            placeholder="e.g. .- "
            disabled={completed}
          />
        </div>
      )}

      {feedback && (
        <div className={`p-4 mb-4 rounded-lg ${completed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {feedback}
        </div>
      )}

      {!completed ? (
        <button
            onClick={handleCheck}
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
        >
            {lesson.type === 'info' ? 'Mark as Read' : 'Check Answer'}
        </button>
      ) : (
        <button
            onClick={() => navigate('/learn')}
            className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-green-500 dark:hover:bg-green-600 focus:outline-none dark:focus:ring-green-800"
        >
            Continue
        </button>
      )}

      <ChatWidget />
    </div>
  );
};

export default Lesson;
