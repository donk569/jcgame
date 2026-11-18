import Module from 'pg-query-emscripten';
import { readFileSync } from 'node:fs';

const pg = await new Module();

for (const f of ['supabase/schema.sql', 'supabase/seed.sql']) {
  const sql = readFileSync(f, 'utf8');
  try {
    const res = pg.parse(sql);
    if (res.error) throw new Error(res.error.message || res.error);
    console.log(`✓ ${f} 语法正确（${res.parse_tree.stmts.length} 条语句）`);
  } catch (e) {
    console.log(`✗ ${f} 语法错误: ${e.message}`);
    const stmts = sql.split(/;\s*\n/).filter((s) => s.trim());
    for (let i = 0; i < stmts.length; i++) {
      try {
        pg.parse(stmts[i] + ';');
      } catch (e2) {
        console.log(`  第 ${i + 1} 段:`, stmts[i].trim().slice(0, 80).replace(/\n/g, ' '));
        console.log(`   → ${String(e2.message).slice(0, 140)}`);
      }
    }
  }
}
