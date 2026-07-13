import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables immediately during ES module import initialization
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const originalSupabase = createClient(supabaseUrl, supabaseAnonKey);

const dbFilePath = path.join(__dirname, '../../scratch/local_db.json');

// Initialize local DB file if it doesn't exist
if (!fs.existsSync(dbFilePath)) {
  try {
    fs.mkdirSync(path.dirname(dbFilePath), { recursive: true });
    fs.writeFileSync(dbFilePath, JSON.stringify({
      users: [],
      resumes: [],
      analyses: [],
      job_matches: [],
      ai_chats: [],
    }, null, 2));
  } catch (e) {
    console.error("Failed to initialize local JSON database:", e);
  }
}

function readLocalDB() {
  try {
    return JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
  } catch (e) {
    return { users: [], resumes: [], analyses: [], job_matches: [], ai_chats: [] };
  }
}

function writeLocalDB(data: any) {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2));
  } catch (e) {}
}

class MockQueryBuilder {
  private table: string;
  private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  private data: any = null;
  private upsertConflict: string = 'id';
  private filters: { col: string; val: any; op: 'eq' | 'in' }[] = [];
  private orderCol: string = '';
  private orderAsc: boolean = true;

  constructor(table: string) {
    this.table = table;
    this.operation = 'select';
  }

  select(columns?: string, options?: any) {
    if (this.operation !== 'insert' && this.operation !== 'update') {
      this.operation = 'select';
    }
    return this;
  }

  insert(data: any) {
    this.operation = 'insert';
    this.data = data;
    return this;
  }

  update(data: any) {
    this.operation = 'update';
    this.data = data;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  upsert(data: any, options?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.operation = 'upsert';
    this.data = data;
    this.upsertConflict = options?.onConflict || 'id';
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ col, val, op: 'eq' });
    return this;
  }

  in(col: string, val: any[]) {
    this.filters.push({ col, val, op: 'in' });
    return this;
  }

  order(col: string, options?: { ascending?: boolean; foreignTable?: string }) {
    if (!options?.foreignTable) {
      this.orderCol = col;
      this.orderAsc = options?.ascending !== false;
    }
    return this;
  }

  limit(num: number, options?: { foreignTable?: string }) {
    return this;
  }

  // Executing the query
  async execute(isSingle: boolean = false, isMaybeSingle: boolean = false) {
    const db = readLocalDB();
    const rows = db[this.table] || [];

    if (this.operation === 'select') {
      let filtered = [...rows];
      for (const filter of this.filters) {
        // Map camelCase to snake_case if column mismatch
        const colName = filter.col === 'auth_id' || filter.col === 'authId' ? ['auth_id', 'authId'] 
                      : filter.col === 'userId' || filter.col === 'user_id' ? ['userId', 'user_id']
                      : filter.col === 'resumeId' || filter.col === 'resume_id' ? ['resumeId', 'resume_id']
                      : [filter.col];

        filtered = filtered.filter((row: any) => {
          const actualKey = colName.find(k => k in row) || filter.col;
          const rowVal = row[actualKey];
          if (filter.op === 'eq') {
            return String(rowVal) === String(filter.val);
          } else if (filter.op === 'in') {
            return Array.isArray(filter.val) && filter.val.map(String).includes(String(rowVal));
          }
          return true;
        });
      }

      // Handle order
      if (this.orderCol) {
        filtered.sort((a, b) => {
          const valA = new Date(a[this.orderCol]).getTime() || a[this.orderCol];
          const valB = new Date(b[this.orderCol]).getTime() || b[this.orderCol];
          if (valA < valB) return this.orderAsc ? -1 : 1;
          if (valA > valB) return this.orderAsc ? 1 : -1;
          return 0;
        });
      }

      // Handle relations (analyses for resumes, resumes for users, jobMatches/aiChats)
      if (this.table === 'users') {
        filtered = filtered.map(user => {
          const resumes = (db.resumes || []).filter((r: any) => r.userId === user.id || r.user_id === user.id);
          const aiChats = (db.ai_chats || []).filter((c: any) => c.userId === user.id || c.user_id === user.id);
          resumes.forEach((resume: any) => {
            resume.analyses = (db.analyses || []).filter((a: any) => a.resumeId === resume.id || a.resume_id === resume.id);
            resume.jobMatches = (db.job_matches || []).filter((m: any) => m.resumeId === resume.id || m.resume_id === resume.id);
          });
          return {
            ...user,
            resumes,
            aiChats,
          };
        });
      }

      if (this.table === 'resumes') {
        filtered = filtered.map(resume => {
          const analyses = (db.analyses || []).filter((a: any) => a.resumeId === resume.id || a.resume_id === resume.id);
          const jobMatches = (db.job_matches || []).filter((m: any) => m.resumeId === resume.id || m.resume_id === resume.id);
          return {
            ...resume,
            analyses,
            jobMatches,
          };
        });
      }

      if (isSingle) {
        if (filtered.length === 0) {
          return { data: null, error: { code: 'PGRST116', message: 'No rows returned' } };
        }
        return { data: filtered[0], error: null };
      }
      if (isMaybeSingle) {
        return { data: filtered[0] || null, error: null };
      }
      return { data: filtered, error: null };
    }

    if (this.operation === 'upsert') {
      const inputData = Array.isArray(this.data) ? this.data : [this.data];
      const returnedRows: any[] = [];

      for (const item of inputData) {
        const conflictKey = this.upsertConflict === 'auth_id' || this.upsertConflict === 'authId' ? 'auth_id' : this.upsertConflict;
        const conflictVal = item[conflictKey] || item['authId'] || item['auth_id'];
        
        const existingIdx = rows.findIndex((row: any) => {
          const rowVal = row[conflictKey] || row['auth_id'] || row['authId'];
          return rowVal && String(rowVal) === String(conflictVal);
        });

        if (existingIdx !== -1) {
          const updatedRow = {
            ...rows[existingIdx],
            ...item,
            updatedAt: new Date().toISOString()
          };
          rows[existingIdx] = updatedRow;
          returnedRows.push(updatedRow);
        } else {
          const newRow = {
            id: item.id || crypto.randomUUID() || Math.random().toString(36).substring(2, 11),
            createdAt: item.createdAt || new Date().toISOString(),
            ...item,
          };
          rows.push(newRow);
          returnedRows.push(newRow);
        }
      }

      db[this.table] = rows;
      writeLocalDB(db);

      let returned = Array.isArray(this.data) ? returnedRows : returnedRows[0];
      if (isSingle || isMaybeSingle) {
        returned = Array.isArray(returned) ? (returned[0] || null) : returned;
      }
      return { data: returned, error: null };
    }

    if (this.operation === 'insert') {
      const inputData = Array.isArray(this.data) ? this.data : [this.data];
      const insertedRows: any[] = [];

      for (const item of inputData) {
        const newRow = {
          id: item.id || crypto.randomUUID() || Math.random().toString(36).substring(2, 11),
          createdAt: item.createdAt || new Date().toISOString(),
          ...item,
        };
        rows.push(newRow);
        insertedRows.push(newRow);
      }

      db[this.table] = rows;
      writeLocalDB(db);

      let returned = Array.isArray(this.data) ? insertedRows : insertedRows[0];
      if (isSingle || isMaybeSingle) {
        returned = Array.isArray(returned) ? (returned[0] || null) : returned;
      }
      return { data: returned, error: null };
    }

    if (this.operation === 'update') {
      db[this.table] = rows.map((row: any) => {
        let match = true;
        for (const filter of this.filters) {
          const val = row[filter.col];
          if (filter.op === 'eq' && String(val) !== String(filter.val)) match = false;
        }
        if (match) {
          return { ...row, ...this.data };
        }
        return row;
      });
      writeLocalDB(db);
      return { data: this.data, error: null };
    }

    if (this.operation === 'delete') {
      db[this.table] = rows.filter((row: any) => {
        let match = true;
        for (const filter of this.filters) {
          const val = row[filter.col];
          if (filter.op === 'eq' && String(val) !== String(filter.val)) match = false;
        }
        return !match;
      });
      writeLocalDB(db);
      return { data: null, error: null };
    }

    return { data: null, error: null };
  }
}

class QueryBuilderWrapper {
  private table: string;
  private chain: { method: string; args: any[] }[] = [];

  constructor(table: string) {
    this.table = table;
  }

  select(...args: any[]) { this.chain.push({ method: 'select', args }); return this; }
  insert(...args: any[]) { this.chain.push({ method: 'insert', args }); return this; }
  update(...args: any[]) { this.chain.push({ method: 'update', args }); return this; }
  delete(...args: any[]) { this.chain.push({ method: 'delete', args }); return this; }
  upsert(...args: any[]) { this.chain.push({ method: 'upsert', args }); return this; }
  eq(...args: any[]) { this.chain.push({ method: 'eq', args }); return this; }
  in(...args: any[]) { this.chain.push({ method: 'in', args }); return this; }
  order(...args: any[]) { this.chain.push({ method: 'order', args }); return this; }
  limit(...args: any[]) { this.chain.push({ method: 'limit', args }); return this; }

  private buildOriginal() {
    let q = originalSupabase.from(this.table) as any;
    for (const step of this.chain) {
      q = q[step.method](...step.args);
    }
    return q;
  }

  private buildMock() {
    let m = new MockQueryBuilder(this.table) as any;
    for (const step of this.chain) {
      m = m[step.method](...step.args);
    }
    return m;
  }

  async execute(isSingle: boolean, isMaybeSingle: boolean) {
    try {
      const q = this.buildOriginal();
      let res;
      if (isSingle) {
        res = await q.single();
      } else if (isMaybeSingle) {
        res = await q.maybeSingle();
      } else {
        res = await q;
      }

      const isUserTable = this.table === 'users';
      const shouldFallback = res.error && (res.error.code !== 'PGRST116' || (!isUserTable && res.error.code === 'PGRST116'));

      if (shouldFallback) {
        console.warn(`Supabase query error (${res.error.code || 'unknown'}) on table "${this.table}", falling back to local database: ${res.error.message}`);
        const mock = this.buildMock();
        return await mock.execute(isSingle, isMaybeSingle);
      }
      return res;
    } catch (err: any) {
      const isUserTable = this.table === 'users';
      const shouldFallback = err.code !== 'PGRST116' || (!isUserTable && err.code === 'PGRST116');

      if (shouldFallback) {
        console.warn(`Supabase query exception (${err.code || 'unknown'}) on table "${this.table}", falling back to local database: ${err.message}`);
        const mock = this.buildMock();
        return await mock.execute(isSingle, isMaybeSingle);
      }
      throw err;
    }
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute(false, false).then(onfulfilled, onrejected);
  }

  async single() {
    return this.execute(true, false);
  }

  async maybeSingle() {
    return this.execute(false, true);
  }
}

export const supabase = {
  ...originalSupabase,
  from(table: string) {
    return new QueryBuilderWrapper(table);
  },
  async checkConnection() {
    try {
      const start = Date.now();
      const { error } = await originalSupabase.from('users').select('id').limit(1);
      const duration = Date.now() - start;
      if (error && error.code !== 'PGRST116') {
        return { online: false, error: error.message, durationMs: duration };
      }
      return { online: true, durationMs: duration };
    } catch (err: any) {
      return { online: false, error: err.message || String(err), durationMs: 0 };
    }
  }
} as any;
