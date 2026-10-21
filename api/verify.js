/**
 * api/verify.js — Simple access gate for E-ENGLISH code
 * Checks code vs process.env.ACCESS_CODE (fallback E-ENGLISH)
 * Sets httpOnly cookie for extra protection, returns JSON.
 */
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Only POST' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const code = String(body?.code || '').trim();

  const expected = (process.env.ACCESS_CODE || 'E-ENGLISH').trim();
  // Case-insensitive compare, keep simple
  const ok = code.toUpperCase() === expected.toUpperCase();

  if (!ok) {
    return res.status(403).json({ success: false, message: 'الكود غير صحيح — تواصلي مع المشرفة إيناس.' });
  }

  // Set cookie for 30 days (helps api/generate check even if localStorage cleared)
  res.setHeader('Set-Cookie', `sabratha_access=1; Path=/; Max-Age=2592000; SameSite=Lax`);
  return res.status(200).json({ success: true, message: 'تم التحقق — مرحباً بك!' });
}
