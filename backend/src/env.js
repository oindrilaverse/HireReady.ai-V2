import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Try loading env from root and backend directories
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();
console.log(`[ENV] Loaded environment variables. API URL: ${process.env.NEXT_PUBLIC_API_URL || 'not set'}`);
//# sourceMappingURL=env.js.map