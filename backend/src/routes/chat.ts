import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// Get chat history for a user
router.get('/:authId', async (req, res) => {
  try {
    const { authId } = req.params;

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*, aiChats:ai_chats(*)')
      .eq('auth_id', authId)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Sort chats by createdAt
    if (user.aiChats) {
      user.aiChats.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    res.json(user.aiChats);
  } catch (error) {
    console.error('FETCH CHAT ERROR:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save a chat message
router.post('/', async (req, res) => {
  try {
    const { authId, message, role } = req.body;

    if (!authId || !message || !role) {
      return res.status(400).json({ error: 'authId, message, and role are required' });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data: chat, error: createError } = await supabase
      .from('ai_chats')
      .insert([{
        userId: user.id,
        message,
        role,
      }])
      .select()
      .single();

    if (createError) throw createError;

    res.json(chat);
  } catch (error) {
    console.error('SAVE CHAT ERROR:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
