import { Request, Response } from 'express';
import pool from '../db';
import { RowDataPacket } from 'mysql2';

export const getProfile = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  try {
    const [user] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, email FROM users WHERE id = ?',
      [userId]
    );
    
    const [stats] = await pool.query<RowDataPacket[]>(
      'SELECT total_points, streak_days, current_level, last_active FROM user_stats WHERE user_id = ?',
      [userId]
    );

    const [progress] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as completed_count FROM progress WHERE user_id = ? AND completed = TRUE',
      [userId]
    );

    if (user.length === 0) return res.status(404).json({ message: 'User not found' });

    res.json({
      ...user[0],
      stats: stats[0] || { total_points: 0, streak_days: 0, current_level: 1 },
      completedLessons: progress[0].completed_count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
