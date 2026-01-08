import { Request, Response } from 'express';
import pool from '../db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export const sendFriendRequest = async (req: Request, res: Response) => {
  const { friendId } = req.body;
  const userId = (req as any).user.id;

  if (userId === friendId) {
    return res.status(400).json({ message: 'Cannot add yourself as friend' });
  }

  try {
    // Check if request already exists
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
      [userId, friendId, friendId, userId]
    );

    if (existing.length > 0) {
      const relationship = existing[0];
      
      // If they already sent you a request, auto-accept it!
      if (relationship.status === 'pending' && relationship.user_id === friendId) {
        await pool.execute(
          'UPDATE friends SET status = "accepted" WHERE id = ?',
          [relationship.id]
        );
        // Create reverse relationship
        await pool.execute(
          'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = ?',
          [userId, friendId, 'accepted', 'accepted']
        );
        return res.status(200).json({ message: 'Friend request accepted automatically!' });
      }

      return res.status(400).json({ message: 'Friend request already exists' });
    }

    await pool.execute(
      'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)',
      [userId, friendId, 'pending']
    );

    res.status(201).json({ message: 'Friend request sent' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ message: 'Error sending friend request' });
  }
};

export const respondToFriendRequest = async (req: Request, res: Response) => {
  const { requestId, action } = req.body; // action: 'accept' or 'decline'
  const userId = (req as any).user.id;

  try {
    const [request] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM friends WHERE id = ? AND friend_id = ?',
      [requestId, userId]
    );

    if (request.length === 0) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (action === 'accept') {
      // Update the original request to accepted
      await pool.execute(
        'UPDATE friends SET status = ? WHERE id = ?',
        ['accepted', requestId]
      );

      // Create the reverse relationship so both users see each other as friends
      await pool.execute(
        'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = ?',
        [userId, request[0].user_id, 'accepted', 'accepted']
      );
      
      res.json({ message: 'Friend request accepted' });
    } else {
      // Decline - just update status or delete
      await pool.execute(
        'UPDATE friends SET status = ? WHERE id = ?',
        ['declined', requestId]
      );
      res.json({ message: 'Friend request declined' });
    }
  } catch (error) {
    console.error('Respond to friend request error:', error);
    res.status(500).json({ message: 'Error responding to friend request' });
  }
};

export const getFriends = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT u.id, u.username, f.created_at as friends_since
       FROM friends f
       JOIN users u ON (f.friend_id = u.id OR f.user_id = u.id) AND u.id != ?
       WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'
       GROUP BY u.id, u.username`,
      [userId, userId, userId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Error fetching friends' });
  }
};

export const getPendingRequests = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT f.id, u.id as user_id, u.username, f.created_at
       FROM friends f
       JOIN users u ON f.user_id = u.id
       WHERE f.friend_id = ? AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ message: 'Error fetching pending requests' });
  }
};

export const getSentRequests = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT f.id, u.id as user_id, u.username, f.created_at
       FROM friends f
       JOIN users u ON f.friend_id = u.id
       WHERE f.user_id = ? AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ message: 'Error fetching sent requests' });
  }
};

export const removeFriend = async (req: Request, res: Response) => {
  const { friendId } = req.params;
  const userId = (req as any).user.id;

  try {
    await pool.execute(
      'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
      [userId, friendId, friendId, userId]
    );

    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ message: 'Error removing friend' });
  }
};
