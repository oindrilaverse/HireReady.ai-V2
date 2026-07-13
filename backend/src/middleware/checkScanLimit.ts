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
export const scanCache = new Map<string, { id: string; scan_count: number; tier: string; expiresAt: number }>();

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
 */
export async function checkScanLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  const userId: string | undefined = req.body?.authId || req.body?.userId;

  if (!userId) {
    // For multipart/form-data, if multer hasn't run yet, body fields are not parsed.
    // We skip the check here and rely on the route handler/subsequent middleware to validate after parsing.
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
      return next();
    }
    return next();
  }

  // Check short-lived cache (5s) to avoid redundant queries during parallel uploads/double-clicks
  const cached = scanCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    const cachedUser = { id: cached.id, scan_count: cached.scan_count, tier: cached.tier };
    (req as any).dbUser = cachedUser;
    
    if (cached.tier === 'free' && cached.scan_count >= 3) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Scan limit reached. Upgrade to Pro for unlimited scans.',
          code: 'SCAN_LIMIT_REACHED',
        },
      });
    }
    return next();
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, scan_count, tier')
      .eq('auth_id', userId)
      .single();

    if (error || !user) {
      // If we can't find the user, fail open — let the route handle it
      return next();
    }

    const tier: string = user.tier ?? 'free';
    const scanCount: number = user.scan_count ?? 0;

    // Cache the query result
    scanCache.set(userId, {
      id: user.id,
      scan_count: scanCount,
      tier,
      expiresAt: Date.now() + 5000, // 5 seconds
    });

    (req as any).dbUser = user;

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
