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
      .maybeSingle();

    if (fetchError || !user) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Sort chats by createdAt
    if (user.aiChats) {
      user.aiChats.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    res.json({
      success: true,
      data: user.aiChats || [],
      error: null
    });
  } catch (error) {
    console.error('FETCH CHAT ERROR:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: {
        message: 'Internal server error during fetch chat history',
        code: 'INTERNAL_SERVER_ERROR'
      }
    });
  }
});

// Save a chat message
router.post('/', async (req, res) => {
  try {
    const { authId, message, role } = req.body;

    if (!authId || !message || !role) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          message: 'authId, message, and role are required',
          code: 'BAD_REQUEST'
        }
      });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .maybeSingle();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
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

    res.json({
      success: true,
      data: chat,
      error: null
    });
  } catch (error) {
    console.error('SAVE CHAT ERROR:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: {
        message: 'Internal server error during save chat',
        code: 'INTERNAL_SERVER_ERROR'
      }
    });
  }
});

export default router;
