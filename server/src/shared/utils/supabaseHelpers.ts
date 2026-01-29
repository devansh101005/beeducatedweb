// Supabase Helper Utilities
// Safely handle Supabase join results and type casting

/**
 * Unwraps a single row from a Supabase join result.
 * Supabase sometimes returns joins as arrays even for single relations.
 *
 * @example
 * const { data } = await supabase.from('students').select('*, batch:batches(*)').single();
 * const batch = unwrapJoinOne(data.batch); // Safely extracts single batch
 *
 * @param value - The join result (could be T, T[], or null)
 * @returns The single value or null
 */
export function unwrapJoinOne<T>(value: T | T[] | null | undefined): T | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value[0] : null;
  }

  return value;
}

/**
 * Unwraps multiple rows from a Supabase join result.
 * Ensures the result is always an array.
 *
 * @example
 * const { data } = await supabase.from('batches').select('*, students:students(*)').single();
 * const students = unwrapJoinMany(data.students); // Always returns array
 *
 * @param value - The join result (could be T, T[], or null)
 * @returns Array of values (empty array if null)
 */
export function unwrapJoinMany<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return [value];
}

/**
 * Type guard to check if a Supabase error occurred.
 *
 * @example
 * const { data, error } = await supabase.from('students').select('*');
 * if (isSupabaseError(error)) {
 *   throw new Error(error.message);
 * }
 */
export function isSupabaseError(
  error: { message: string; details?: string; hint?: string; code?: string } | null
): error is { message: string; details?: string; hint?: string; code?: string } {
  return error !== null;
}

/**
 * Safely casts a joined relation field from Supabase query result.
 * Use when you need to assert the type of a joined field.
 *
 * @example
 * const { data } = await supabase.from('students').select('*, user:users(*)').single();
 * const user = castJoinResult<User>(data.user);
 */
export function castJoinResult<T>(value: unknown): T | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? (value[0] as T) : null;
  }

  return value as T;
}

/**
 * Creates a type-safe mapper for Supabase query results with joins.
 * Useful when mapping database rows to domain objects.
 *
 * @example
 * const mapStudent = createJoinMapper<DBStudent, Student>((row) => ({
 *   id: row.id,
 *   name: row.name,
 *   batch: unwrapJoinOne(row.batch),
 * }));
 *
 * const students = data.map(mapStudent);
 */
export function createJoinMapper<TInput, TOutput>(
  mapper: (input: TInput) => TOutput
): (input: TInput) => TOutput {
  return mapper;
}
