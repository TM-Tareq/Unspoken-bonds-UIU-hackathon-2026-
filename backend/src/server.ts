import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes';
import learnRoutes from './routes/learnRoutes';
import userRoutes from './routes/userRoutes';
import chatRoutes from './routes/chatRoutes';
import friendRoutes from './routes/friendRoutes';
import { getBotReply } from './utils/bot';
import pool from './db';
import { ResultSetHeader } from 'mysql2';

dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174"
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/learn', learnRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/friends', friendRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Morse Code Mastery API is running');
});

const MORSE_CODE: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..',
  '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
  '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '/': '-..-.', ' ': '/'
};

const textToMorse = (text: string): string => {
  return text.toUpperCase().split('').map(char => MORSE_CODE[char] || char).join(' ');
};

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Send a welcome message from the bot
  socket.emit('chat_message', {
    id: Date.now().toString(),
    username: 'MorseBot',
    text: 'Welcome to Morse Mastery Chat! Type anything to see it in real-time Morse code.',
    morse: textToMorse('Welcome'),
    timestamp: new Date().toLocaleTimeString()
  });

  // Join conversation room for 1:1 chats
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conv_${conversationId}`);
    console.log(`User ${socket.id} joined conversation ${conversationId}`);
  });

  // Handle 1:1 chat messages (room-based)
  socket.on('private_message', async (msg) => {
    const { conversation_id, sender_id, text, morse, username } = msg;
    try {
        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO messages (conversation_id, sender_id, text, morse) VALUES (?, ?, ?, ?)',
            [conversation_id, sender_id, text, morse]
        );
        const savedMsg = { ...msg, id: result.insertId, created_at: new Date().toISOString() };
        io.to(`conv_${conversation_id}`).emit('private_message', savedMsg);
    } catch (err) {
        console.error('Error saving private message:', err);
    }
  });

  // Handle global chat messages (for Friends tab global mode)
  socket.on('chat_message', async (msg) => {
    io.emit('chat_message', msg);
    
    if (msg.username !== 'MorseBot') {
        const delay = Math.random() * 1000 + 500;
        setTimeout(async () => {
            const replyText = await getBotReply(msg.text);
            if (replyText) {
                io.emit('chat_message', {
                    id: Date.now().toString() + 'bot',
                    username: 'MorseBot',
                    text: replyText,
                    morse: textToMorse(replyText),
                    timestamp: new Date().toLocaleTimeString()
                });
            }
        }, delay);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
