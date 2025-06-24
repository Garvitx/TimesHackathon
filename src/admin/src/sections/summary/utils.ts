import type { UserProps } from './user-table-row';

// ----------------------------------------------------------------------

export const visuallyHidden = {
  border: 0,
  margin: -1,
  padding: 0,
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  position: 'absolute',
  whiteSpace: 'nowrap',
  clip: 'rect(0 0 0 0)',
} as const;

// ----------------------------------------------------------------------

export function emptyRows(page: number, rowsPerPage: number, arrayLength: number) {
  return page ? Math.max(0, (1 + page) * rowsPerPage - arrayLength) : 0;
}

// ----------------------------------------------------------------------

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

// ----------------------------------------------------------------------

export function getComparator<Key extends keyof any>(
  order: 'asc' | 'desc',
  orderBy: Key
): (
  a: {
    [key in Key]: number | string;
  },
  b: {
    [key in Key]: number | string;
  }
) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// ----------------------------------------------------------------------

type ApplyFilterProps<T> = {
  inputData: T[];
  filterName: string;                            // the search term
  comparator: (a: T, b: T) => number;            // your sort comparator
};

export function applyFilter<T extends Record<string, any>>({
  inputData,
  comparator,
  filterName,
}: ApplyFilterProps<T>): T[] {
  // 1) Stable sort
  const stabilized = inputData
    .map((el, idx) => [el, idx] as const)
    .sort((a, b) => {
      const order = comparator(a[0], b[0]);
      return order !== 0 ? order : a[1] - b[1];
    })
    .map(([el]) => el);

  // 2) If there's a filter term, filter on `.name` or `.title`
  if (filterName) {
    const term = filterName.toLowerCase();
    return stabilized.filter((item) => {
      const field: string =
        // try `name`
        typeof item.name === 'string'
          ? item.name
          // else try `title`
          : typeof item.title === 'string'
          ? item.title
          // else nothing
          : '';
      return field.toLowerCase().includes(term);
    });
  }

  // 3) No filter term? Just return sorted list.
  return stabilized;
}
