import React from 'react';
import Box from '@mui/material/Box';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';
import { visuallyHidden } from './utils';

// ----------------------------------------------------------------------
// Define a type for each header cell
export type HeadLabel = {
  id: string;                    // key for sorting (empty for non‐sortable, e.g. "actions")
  label: string;                 // what to display in the header
  align?: 'left' | 'right' | 'center';
  width?: number | string;       // optional width or minWidth
};

type UserTableHeadProps = {
  orderBy: string;               // which column is currently sorted
  order: 'asc' | 'desc';         // sort direction
  onSort: (id: string) => void;  // callback when a sortable header is clicked
  headLabel: HeadLabel[];        // array of columns to render
};

export function UserTableHead({
  order,
  onSort,
  orderBy,
  headLabel,
}: UserTableHeadProps) {
  return (
    <TableHead>
      <TableRow>
        {headLabel.map((headCell) => {
          // If id is empty or “actions”, treat as non‐sortable
          const isSortable = headCell.id !== '' && headCell.id.toLowerCase() !== 'actions';

          return (
            <TableCell
              key={headCell.id || 'actions-header'}
              align={headCell.align ?? 'left'}
              sortDirection={orderBy === headCell.id ? order : false}
              sx={{
                width: headCell.width,
                minWidth: headCell.width,
                backgroundColor: '#F5F5F5', // light gray header background
                fontWeight: 600,            // bold text in header
              }}
            >
              {isSortable ? (
                <TableSortLabel
                  hideSortIcon
                  active={orderBy === headCell.id}
                  direction={orderBy === headCell.id ? order : 'asc'}
                  onClick={() => onSort(headCell.id)}
                >
                  {headCell.label}
                  {orderBy === headCell.id ? (
                    <Box component="span" sx={{ ...visuallyHidden }}>
                      {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                    </Box>
                  ) : null}
                </TableSortLabel>
              ) : (
                // Non‐sortable (e.g. the “actions” column) just shows an empty label
                headCell.label
              )}
            </TableCell>
          );
        })}
      </TableRow>
    </TableHead>
  );
}
