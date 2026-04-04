/** Flattens a Zod error into a readable string. */

export const formatValidationError = errors => {
  if (!errors?.issues) return 'Validation failed';
  return errors.issues.map(i => i.message).join(', ');
};
