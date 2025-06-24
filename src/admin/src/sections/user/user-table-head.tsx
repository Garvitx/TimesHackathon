// src/components/user-table-head.tsx
import React from 'react';
import Box from '@mui/material/Box';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import Checkbox from '@mui/material/Checkbox';
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
  rowCount: number;              // total number of rows (for the "select all" checkbox)
  numSelected: number;           // how many rows are selected
  order: 'asc' | 'desc';         // sort direction
  onSort: (id: string) => void;  // callback when a sortable header is clicked
  headLabel: HeadLabel[];        // array of columns to render
  onSelectAllRows: (checked: boolean) => void;
};

export function UserTableHead({
  order,
  onSort,
  orderBy,
  rowCount,
  headLabel,
  numSelected,
  onSelectAllRows,
}: UserTableHeadProps) {
  return (
    <TableHead>
      <TableRow>
        {/* 1) The “select all” checkbox */}
        <TableCell padding="checkbox">
          <Checkbox
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onSelectAllRows(event.target.checked)
            }
          />
        </TableCell>

        {/* 2) Render each header cell according to headLabel[] */}
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
