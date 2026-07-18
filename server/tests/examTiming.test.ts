// Unit tests for server-side exam duration enforcement.
// isDurationExpired: started_at + duration_minutes + 60s grace vs now.
import { describe, it, expect } from 'vitest';
import { examAttemptService } from '../src/services/examAttemptService';

// The helper is private by design; tests reach it via an any-cast rather
// than widening the service's public API.
const isDurationExpired = (
  examAttemptService as unknown as {
    isDurationExpired(attempt: { started_at: string }, exam: { duration_minutes: number }): boolean;
  }
).isDurationExpired.bind(examAttemptService);

const minutesAgo = (mins: number): string => new Date(Date.now() - mins * 60_000).toISOString();

describe('examAttemptService.isDurationExpired', () => {
  it('is not expired right after starting', () => {
    expect(isDurationExpired({ started_at: minutesAgo(0) }, { duration_minutes: 60 })).toBe(false);
  });

  it('is not expired while inside the duration', () => {
    expect(isDurationExpired({ started_at: minutesAgo(59) }, { duration_minutes: 60 })).toBe(false);
  });

  it('is not expired inside the 60s grace window past the duration', () => {
    // 60 minutes + ~30s elapsed — still within duration + 60s grace
    const startedAt = new Date(Date.now() - (60 * 60_000 + 30_000)).toISOString();
    expect(isDurationExpired({ started_at: startedAt }, { duration_minutes: 60 })).toBe(false);
  });

  it('is expired once duration + grace have fully elapsed', () => {
    expect(isDurationExpired({ started_at: minutesAgo(62) }, { duration_minutes: 60 })).toBe(true);
  });

  it('never expires an exam with no duration configured', () => {
    expect(isDurationExpired({ started_at: minutesAgo(9999) }, { duration_minutes: 0 })).toBe(false);
  });
});
