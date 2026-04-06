/** Normalize a math answer string for comparison:
 *  strips whitespace, replaces Unicode minus (−) with hyphen (-), lowercases */
export function normalizeInput(s: string): string {
  return s.trim().replace(/\s/g, '').replace(/[−\u2212]/g, '-').toLowerCase();
}
