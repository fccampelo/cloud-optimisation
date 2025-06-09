import React from 'react';
import { Typography, Box } from '@mui/material';
import { Cost } from '../../types';

interface CostSummaryProps {
  costs: Cost | null;
}

const CostSummary: React.FC<CostSummaryProps> = ({ costs }) => {
  if (!costs) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Cost Summary
        </Typography>
        <Typography>No cost data available.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Cost Summary
      </Typography>
      <Typography>Total Hourly: ${costs.totalHourly.toFixed(2)}</Typography>
      <Typography>Projected Monthly: ${costs.projectedMonthly.toFixed(2)}</Typography>
    </Box>
  );
};

export default CostSummary;