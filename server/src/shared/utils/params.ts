// Request param helpers

/**
 * Normalize an Express 5 route param (can be string | string[]) to a string.
 */
export const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  return param || '';
};
