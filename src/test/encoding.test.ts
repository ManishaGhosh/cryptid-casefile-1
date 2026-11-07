import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Built from char codes so this file never contains the literal sequences.
const BAD_SEQUENCES: Array<{ label: string; value: string }> = [
  { label: 'U+FFFD replacement character', value: String.fromCharCode(0xfffd) },
  { label: 'mojibake lead "\u00e2\u20ac"', value: String.fromCharCode(0xe2, 0x20ac) },
  { label: 'mojibake "\u00c3"', value: String.fromCharCode(0xc3) },
];

function collect(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collect(full, out);
    else if (/\.(ts|tsx|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

describe('source encoding', () => {
  it('has no replacement characters or mojibake in .ts/.tsx/.css files under src/', () => {
    const offenders: string[] = [];
    for (const file of collect(join(process.cwd(), 'src'))) {
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        for (const { label, value } of BAD_SEQUENCES) {
          if (line.includes(value)) offenders.push(`${file}:${i + 1} (${label})`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });
});
