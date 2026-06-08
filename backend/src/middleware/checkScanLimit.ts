import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';

/**
 * Middleware: checkScanLimit
 *
 * Blocks free-tier users who have reached their 3-scan limit.
 * Expects the authenticated user's ID to be present in:
 *   - req.body.authId  (multipart/form-data uploads)
 *   - req.body.userId  (JSON body fallback)
 *
 * If the user is on the 'free' tier and scan_count >= 3,
 * responds with 403 and stops the request chain.
 * Otherwise calls next() to continue to the route handler.
 *
 * NOTE: This middleware runs BEFORE multer parses the multipart body.
 * Because multer hasn't run yet, req.body may be empty for multipart requests.
 * The authId is read from the raw body fields if available, or we skip the check
 * and let the route handler enforce it after parsing. We call next() on any
 * ambiguity to avoid blocking legitimate requests.
 */
export async function checkScanLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  // For multipart/form-data, multer hasn't run yet — body fields are not parsed.
  // We skip the check here and rely on the route handler to validate after parsing.
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return next();
  }

  const userId: string | undefined = req.body?.authId || req.body?.userId;

  if (!userId) {
    // No userId means multer hasn't parsed or it's genuinely missing — let the route handle it
    return next();
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('scan_count, tier')
      .eq('auth_id', userId)
      .single();

    if (error || !user) {
      // If we can't find the user, fail open — let the route handle it
      return next();
    }

    const tier: string = user.tier ?? 'free';
    const scanCount: number = user.scan_count ?? 0;

    if (tier === 'free' && scanCount >= 3) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Scan limit reached. Upgrade to Pro for unlimited scans.',
          code: 'SCAN_LIMIT_REACHED',
        },
      });
    }

    // Within limit — continue
    return next();
  } catch (err) {
    console.error('[checkScanLimit] Unexpected error:', err);
    // Fail open so a middleware error never blocks a paying user
    return next();
  }
}
