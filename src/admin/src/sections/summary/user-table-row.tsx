// src/components/UserTableRow.tsx

import React, { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

export type UserProps = {
  id: string;
  email: string;
  role: string; // e.g. 'Editor'
};

type UserTableRowProps = {
  row: UserProps;
  selected: boolean;
  onSelectRow: () => void;
  onDelete: (id: string) => void;
};

export function UserTableRow({
  row,
  selected,
  onSelectRow,
  onDelete,
}: UserTableRowProps) {
  const [hovered, setHovered] = useState(false);

  const handleRowHover = useCallback(() => {
    setHovered(true);
  }, []);
  const handleRowUnhover = useCallback(() => {
    setHovered(false);
  }, []);

  return (
    <TableRow
      hover
      selected={selected}
      onMouseEnter={handleRowHover}
      onMouseLeave={handleRowUnhover}
      sx={{
        '&:hover': {
          backgroundColor: '#F0F0F0',
        },
      }}
    >
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onChange={onSelectRow} />
      </TableCell>

      <TableCell sx={{ py: 1.5 }}>
        <Typography variant="body2">{row.email}</Typography>
      </TableCell>

      <TableCell sx={{ py: 1.5 }}>
        <Box
          sx={{
            display: 'inline-block',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            bgcolor: (theme) => theme.palette.info.light,
            color: (theme) => theme.palette.info.dark,
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {row.role}
        </Box>
      </TableCell>

      <TableCell align="right" sx={{ py: 1.5 }}>
        <IconButton
          color="error"
          onClick={() => onDelete(row.id)}
          sx={{
            '&:hover': {
              bgcolor: (theme) => theme.palette.error.light + '33',
            },
          }}
        >
          <Iconify icon="mingcute:delete-line" width={20} height={20} />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}

export default UserTableRow;
