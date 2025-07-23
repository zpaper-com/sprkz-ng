import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Feature } from '../../contexts/AdminContext';

interface FeatureTableProps {
  features: Feature[];
  loading: boolean;
  onEdit: (feature: Feature) => void;
  onDelete: (id: number) => void;
}

const FeatureTable: React.FC<FeatureTableProps> = ({
  features,
  loading,
  onEdit,
  onDelete,
}) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (features.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="body1" color="textSecondary">
          No features found. Click "Add Feature" to create your first feature.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Name</strong></TableCell>
            <TableCell><strong>Description</strong></TableCell>
            <TableCell><strong>Notes</strong></TableCell>
            <TableCell><strong>Creation Date</strong></TableCell>
            <TableCell align="right"><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {features.map((feature) => (
            <TableRow key={feature.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {feature.name}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="textSecondary">
                  {feature.description || '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="textSecondary">
                  {feature.notes || '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {new Date(feature.creationDate).toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Edit Feature">
                  <IconButton
                    size="small"
                    onClick={() => onEdit(feature)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Feature">
                  <IconButton
                    size="small"
                    onClick={() => onDelete(feature.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default FeatureTable;