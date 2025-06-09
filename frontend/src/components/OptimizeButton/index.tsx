import React from 'react';
import { Button } from '@mui/material';

interface OptimizeButtonProps {
  onOptimize: () => void;
}

const OptimizeButton: React.FC<OptimizeButtonProps> = ({ onOptimize }) => (
  <Button variant="contained" color="primary" onClick={onOptimize}>
    Run Optimisation
  </Button>
);

export default OptimizeButton;