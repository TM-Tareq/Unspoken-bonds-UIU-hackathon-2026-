import { Request, Response } from 'express';
import pool from '../db';
import { modules } from '../data/lessonsData';
import { RowDataPacket } from 'mysql2';

export const getModules = (req: Request, res: Response) => {
  res.json(modules);
};

export const getProgress = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  try {
    const [progress] = await pool.query<RowDataPacket[]>(
      'SELECT lesson_id, completed, points FROM progress WHERE user_id = ?',
      [userId]
    );
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const completeLesson = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { lessonId, points } = req.body;

  try {
    // Upsert progress
    await pool.query(
      `INSERT INTO progress (user_id, lesson_id, completed, points, last_completed)
       VALUES (?, ?, TRUE, ?, CURDATE())
       ON DUPLICATE KEY UPDATE points = points + ?, last_completed = CURDATE()`,
      [userId, lessonId, points, points]
    );

    // Update user stats
    await pool.query(
      `UPDATE user_stats 
       SET total_points = total_points + ?, last_active = CURDATE() 
       WHERE user_id = ?`,
      [points, userId]
    );
    
    // Check streak (simplified: if last_active was yesterday, increment streak)
    // For now just basic update
    
    res.json({ message: 'Progress saved' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
