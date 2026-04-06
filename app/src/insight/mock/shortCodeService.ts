// Mock Short Code Service — simulates backend POST /api/v1/sync
// In production this would be a real API call.

import { MOCK_STUDENTS, getStudentByCode, type MockStudent } from './mockStudents';

// In-memory store for generated codes (survives page reload via sessionStorage)
const STORAGE_KEY = 'li-short-codes';

function loadCodes(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveCodes(map: Record<string, string>) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part1}-${part2}`;
}

/**
 * Simulates POST /api/v1/sync
 * Takes lq-store JSON, "uploads" it, returns a Short Code.
 */
export async function syncToInsight(lqStoreJson: string): Promise<string> {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 800));

  const codes = loadCodes();
  // Use a simple hash of the JSON as fingerprint
  const fingerprint = btoa(lqStoreJson).slice(0, 20);

  if (codes[fingerprint]) return codes[fingerprint];

  const code = generateCode();
  codes[fingerprint] = code;
  saveCodes(codes);
  return code;
}

/**
 * Simulates GET /api/v1/student?code=X7B-9P2
 * Teacher enters code → get student data.
 */
export async function fetchStudentByCode(code: string): Promise<MockStudent | null> {
  await new Promise(r => setTimeout(r, 500));
  return getStudentByCode(code) ?? null;
}

/**
 * Get all mock students (for teacher demo with pre-loaded data).
 */
export function getAllMockStudents(): MockStudent[] {
  return MOCK_STUDENTS;
}
