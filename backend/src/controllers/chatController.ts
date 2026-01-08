import { Request, Response } from 'express';
import pool from '../db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export const createConversation = async (req: Request, res: Response) => {
  const { participantId } = req.body;
  const userId = (req as any).user.id;

  try {
    // Check if conversation already exists between these two users
    const [existing] = await pool.execute<RowDataPacket[]>(
      `SELECT c.id FROM conversations c
       JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
       JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
       WHERE c.is_group = 0 AND cp1.user_id = ? AND cp2.user_id = ?`,
      [userId, participantId]
    );

    if (existing.length > 0) {
      return res.json({ id: existing[0].id });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [convResult] = await connection.execute<ResultSetHeader>(
        'INSERT INTO conversations (is_group) VALUES (0)'
      );
      const conversationId = convResult.insertId;

      await connection.execute(
        'INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?), (?, ?)',
        [conversationId, userId, conversationId, participantId]
      );

      await connection.commit();
      res.status(201).json({ id: conversationId });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ message: 'Error creating conversation' });
  }
};

export const getConversations = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        c.id, 
        c.is_group,
        (SELECT text FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = ?
      ORDER BY last_message_at DESC`,
      [userId]
    );

    const conversations = await Promise.all(rows.map(async (conv) => {
      const [otherUser] = await pool.execute<RowDataPacket[]>(
        `SELECT u.id, u.username 
         FROM users u
         JOIN conversation_participants cp ON u.id = cp.user_id
         WHERE cp.conversation_id = ? AND cp.user_id != ?`,
        [conv.id, userId]
      );
      return {
        ...conv,
        other_user: otherUser[0] || null
      };
    }));

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Error fetching conversations' });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const userId = (req as any).user.id;

  try {
    const [participant] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [conversationId, userId]
    );

    if (participant.length === 0) {
      return res.status(403).json({ message: 'Not a member of this conversation' });
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT m.*, u.username as sender_name 
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC`,
      [conversationId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
    const { query } = req.query;
    const userId = (req as any).user.id;

    try {
        // Only search among friends
        const [rows] = await pool.execute<RowDataPacket[]>(
            `SELECT DISTINCT u.id, u.username 
             FROM users u
             JOIN friends f ON ((f.user_id = u.id AND f.friend_id = ?) OR (f.friend_id = u.id AND f.user_id = ?))
             WHERE u.username LIKE ? AND u.id != ? AND f.status = 'accepted'
             LIMIT 10`,
            [userId, userId, `%${query}%`, userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ message: 'Error searching users' });
    }
};

export const searchAllUsers = async (req: Request, res: Response) => {
    const { username } = req.query;
    const userId = (req as any).user.id;

    try {
        // Search all users and include friendship status if it exists
        const [rows] = await pool.execute<RowDataPacket[]>(
            `SELECT u.id, u.username, f.status as friendship_status, f.user_id as requester_id
             FROM users u
             LEFT JOIN friends f ON (
                (f.user_id = ? AND f.friend_id = u.id) OR 
                (f.user_id = u.id AND f.friend_id = ?)
             )
             WHERE u.username LIKE ? AND u.id != ?
             LIMIT 10`,
            [userId, userId, `%${username}%`, userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Search all users error:', error);
        res.status(500).json({ message: 'Error searching users' });
    }
};
