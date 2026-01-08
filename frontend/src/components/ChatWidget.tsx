import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { textToMorse } from '../utils/morseData';

interface Message {
  id?: string;
  username: string;
  sender_id: number;
  text: string;
  morse: string;
  timestamp: string;
}

const ChatWidget: React.FC = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        newSocket.on('chat_message', (msg: Message) => {
            setMessages((prev) => [...prev, msg]);
        });

        // Add a welcome message if empty
        if (messages.length === 0) {
            setMessages([{
                username: 'MorseBot',
                sender_id: 0,
                text: "Hi! I'm your Morse Study Buddy. Ask me anything or practice your dits and dahs!",
                morse: textToMorse("Hi"),
                timestamp: new Date().toLocaleTimeString()
            }]);
        }

        return () => {
            newSocket.disconnect();
        };
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && socket && user) {
            const msg = {
                sender_id: user.id,
                username: user.username,
                text: input,
                morse: textToMorse(input),
                timestamp: new Date().toLocaleTimeString()
            };
            socket.emit('chat_message', msg);
            // Let server broadcast handle it to avoid duplicates
            setInput('');
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-110 active:scale-95"
            >
                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-80 h-96 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
                        <div>
                            <h3 className="font-bold">MorseBot Helper</h3>
                            <p className="text-[10px] opacity-80">Online & Ready to Help</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.sender_id === user?.id ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] p-2 rounded-xl text-sm ${
                                    msg.sender_id === user?.id 
                                        ? 'bg-blue-600 text-white rounded-br-none' 
                                        : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-100 rounded-bl-none'
                                }`}>
                                    <p>{msg.text}</p>
                                    <p className="font-mono text-[10px] opacity-70 mt-1 border-t border-black/10 dark:border-white/10 pt-1">
                                        {msg.morse}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="p-3 border-t dark:border-gray-700 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask science/math/info..."
                            className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-lg p-2 text-sm dark:text-white focus:ring-1 focus:ring-blue-500"
                        />
                        <button type="submit" className="text-blue-600 hover:text-blue-700 font-bold p-1">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
