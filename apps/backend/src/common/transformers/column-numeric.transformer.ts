import { ValueTransformer } from 'typeorm';

/**
 * Keeps `decimal` columns honest with their declared TypeScript type.
 *
 * The Postgres driver returns `numeric`/`decimal` values as strings to avoid the
 * precision loss of a JS double, so an entity field declared as `number` holds a
 * string at runtime unless a transformer converts it back. Every read path then
 * has to defend itself, and any consumer that trusts the declared type does
 * arithmetic on a string without TypeScript complaining.
 *
 * Safe for `decimal(10,2)` money columns: the widest value (99999999.99) has ten
 * significant digits, well inside the ~15 a double represents exactly enough to
 * round-trip at two decimals. This does NOT make float arithmetic safe — money is
 * still aggregated with decimal.js.
 */
export class ColumnNumericTransformer implements ValueTransformer {
  /** Entity -> database. The driver serializes the number itself. */
  to(value: number | null): number | null {
    return value;
  }

  /** Database -> entity. */
  from(value: string | null): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    return parseFloat(value);
  }
}

export const columnNumericTransformer = new ColumnNumericTransformer();
