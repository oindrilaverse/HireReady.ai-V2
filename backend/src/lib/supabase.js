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
    }
    catch (e) {
        console.error("Failed to initialize local JSON database:", e);
    }
}
function readLocalDB() {
    try {
        return JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
    }
    catch (e) {
        return { users: [], resumes: [], analyses: [], job_matches: [], ai_chats: [] };
    }
}
function writeLocalDB(data) {
    try {
        fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2));
    }
    catch (e) { }
}
class MockQueryBuilder {
    table;
    operation;
    data = null;
    filters = [];
    orderCol = '';
    orderAsc = true;
    constructor(table) {
        this.table = table;
        this.operation = 'select';
    }
    select(columns, options) {
        if (this.operation !== 'insert' && this.operation !== 'update') {
            this.operation = 'select';
        }
        return this;
    }
    insert(data) {
        this.operation = 'insert';
        this.data = data;
        return this;
    }
    update(data) {
        this.operation = 'update';
        this.data = data;
        return this;
    }
    delete() {
        this.operation = 'delete';
        return this;
    }
    eq(col, val) {
        this.filters.push({ col, val, op: 'eq' });
        return this;
    }
    in(col, val) {
        this.filters.push({ col, val, op: 'in' });
        return this;
    }
    order(col, options) {
        if (!options?.foreignTable) {
            this.orderCol = col;
            this.orderAsc = options?.ascending !== false;
        }
        return this;
    }
    limit(num, options) {
        return this;
    }
    // Executing the query
    async execute(isSingle = false, isMaybeSingle = false) {
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
                filtered = filtered.filter((row) => {
                    const actualKey = colName.find(k => k in row) || filter.col;
                    const rowVal = row[actualKey];
                    if (filter.op === 'eq') {
                        return String(rowVal) === String(filter.val);
                    }
                    else if (filter.op === 'in') {
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
                    if (valA < valB)
                        return this.orderAsc ? -1 : 1;
                    if (valA > valB)
                        return this.orderAsc ? 1 : -1;
                    return 0;
                });
            }
            // Handle relations (analyses for resumes, resumes for users, jobMatches/aiChats)
            if (this.table === 'users') {
                filtered = filtered.map(user => {
                    const resumes = (db.resumes || []).filter((r) => r.userId === user.id || r.user_id === user.id);
                    const aiChats = (db.ai_chats || []).filter((c) => c.userId === user.id || c.user_id === user.id);
                    resumes.forEach((resume) => {
                        resume.analyses = (db.analyses || []).filter((a) => a.resumeId === resume.id || a.resume_id === resume.id);
                        resume.jobMatches = (db.job_matches || []).filter((m) => m.resumeId === resume.id || m.resume_id === resume.id);
                    });
                    return {
                        ...user,
                        resumes,
                        aiChats,
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
        if (this.operation === 'insert') {
            const inputData = Array.isArray(this.data) ? this.data : [this.data];
            const insertedRows = [];
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
            db[this.table] = rows.map((row) => {
                let match = true;
                for (const filter of this.filters) {
                    const val = row[filter.col];
                    if (filter.op === 'eq' && String(val) !== String(filter.val))
                        match = false;
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
            db[this.table] = rows.filter((row) => {
                let match = true;
                for (const filter of this.filters) {
                    const val = row[filter.col];
                    if (filter.op === 'eq' && String(val) !== String(filter.val))
                        match = false;
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
    table;
    chain = [];
    constructor(table) {
        this.table = table;
    }
    select(...args) { this.chain.push({ method: 'select', args }); return this; }
    insert(...args) { this.chain.push({ method: 'insert', args }); return this; }
    update(...args) { this.chain.push({ method: 'update', args }); return this; }
    delete(...args) { this.chain.push({ method: 'delete', args }); return this; }
    eq(...args) { this.chain.push({ method: 'eq', args }); return this; }
    in(...args) { this.chain.push({ method: 'in', args }); return this; }
    order(...args) { this.chain.push({ method: 'order', args }); return this; }
    limit(...args) { this.chain.push({ method: 'limit', args }); return this; }
    buildOriginal() {
        let q = originalSupabase.from(this.table);
        for (const step of this.chain) {
            q = q[step.method](...step.args);
        }
        return q;
    }
    buildMock() {
        let m = new MockQueryBuilder(this.table);
        for (const step of this.chain) {
            m = m[step.method](...step.args);
        }
        return m;
    }
    async execute(isSingle, isMaybeSingle) {
        try {
            const q = this.buildOriginal();
            let res;
            if (isSingle) {
                res = await q.single();
            }
            else if (isMaybeSingle) {
                res = await q.maybeSingle();
            }
            else {
                res = await q;
            }
            if (res.error && (res.error.message?.includes('fetch') || res.error.message?.includes('getaddrinfo') || res.error.message?.includes('ENOTFOUND'))) {
                console.warn(`Supabase offline error detected on table "${this.table}", falling back to local database`);
                const mock = this.buildMock();
                return await mock.execute(isSingle, isMaybeSingle);
            }
            return res;
        }
        catch (err) {
            if (err.message?.includes('fetch') || err.message?.includes('getaddrinfo') || err.message?.includes('ENOTFOUND')) {
                console.warn(`Supabase offline exception detected on table "${this.table}", falling back to local database`);
                const mock = this.buildMock();
                return await mock.execute(isSingle, isMaybeSingle);
            }
            throw err;
        }
    }
    then(onfulfilled, onrejected) {
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
    from(table) {
        return new QueryBuilderWrapper(table);
    }
};
//# sourceMappingURL=supabase.js.map