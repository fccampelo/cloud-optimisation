import React from 'react';
import { Typography, List, ListItem, ListItemText, Chip, Divider } from '@mui/material';
import { AlertData } from '../../types';

interface AlertFeedProps {
  alerts: AlertData[];
}

const AlertFeed: React.FC<AlertFeedProps> = ({ alerts }) => (
  <>
    <Typography variant="h6" gutterBottom>
      Alerts
    </Typography>
    <List>
      {alerts.map(a => (
        <React.Fragment key={a.id}>
          <ListItem>
            <ListItemText
              primary={a.message}
              secondary={`Resource ID: ${a.resourceId} | Time: ${new Date(a.timestamp).toLocaleString()}`}
            />
            <Chip label={a.severity} color={a.severity === 'critical' ? 'error' : 'warning'} />
          </ListItem>
          <Divider />
        </React.Fragment>
      ))}
    </List>
  </>
);

export default AlertFeed;