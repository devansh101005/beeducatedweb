// Unit tests for the fee-reminder escalation classifier.
// Pure function: daysUntilDue -> reminder type (or null = no email today).
import { describe, it, expect } from 'vitest';
import { classifyReminder } from '../src/services/reminderService';

describe('classifyReminder', () => {
  it('fires the pre-due ladder on exactly 7, 3, 1 and 0 days before due', () => {
    expect(classifyReminder(7)).toBe('due_in_7');
    expect(classifyReminder(3)).toBe('due_in_3');
    expect(classifyReminder(1)).toBe('due_tomorrow');
    expect(classifyReminder(0)).toBe('due_today');
  });

  it('stays silent on non-ladder days before due', () => {
    expect(classifyReminder(8)).toBeNull();
    expect(classifyReminder(6)).toBeNull();
    expect(classifyReminder(4)).toBeNull();
    expect(classifyReminder(2)).toBeNull();
    expect(classifyReminder(30)).toBeNull();
  });

  it('escalates weekly for the first three overdue weeks', () => {
    expect(classifyReminder(-7)).toBe('overdue_week_1');
    expect(classifyReminder(-14)).toBe('overdue_week_2');
    expect(classifyReminder(-21)).toBe('overdue_week_3');
  });

  it('stays silent between weekly overdue marks', () => {
    expect(classifyReminder(-1)).toBeNull();
    expect(classifyReminder(-6)).toBeNull();
    expect(classifyReminder(-8)).toBeNull();
    expect(classifyReminder(-13)).toBeNull();
    expect(classifyReminder(-20)).toBeNull();
  });

  it('fires week-4+ reminders every 7 days from day -28 onward, forever', () => {
    expect(classifyReminder(-28)).toBe('overdue_week_4_plus');
    expect(classifyReminder(-35)).toBe('overdue_week_4_plus');
    expect(classifyReminder(-42)).toBe('overdue_week_4_plus');
    expect(classifyReminder(-70)).toBe('overdue_week_4_plus');
  });

  it('does not fire week-4+ on days not divisible by 7', () => {
    expect(classifyReminder(-29)).toBeNull();
    expect(classifyReminder(-30)).toBeNull();
    expect(classifyReminder(-36)).toBeNull();
  });
});
