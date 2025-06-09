import React from 'react';
import { Typography, List, ListItem, ListItemText, Divider } from '@mui/material';
import { Resource } from '../../types';

interface ResourceListProps {
  resources: Resource[];
}

const ResourceList: React.FC<ResourceListProps> = ({ resources }) => (
  <>
    <Typography variant="h6" gutterBottom>
      Resources
    </Typography>
    <List>
      {resources.map(r => (
        <React.Fragment key={r.id}>
          <ListItem>
            <ListItemText
              primary={`${r.name} (${r.type})`}
              secondary={`Status: ${r.status} | Hourly: $${r.hourlyRate} | Monthly: $${r.projectedMonthlyCost}`}
            />
          </ListItem>
          <Divider />
        </React.Fragment>
      ))}
    </List>
  </>
);

export default ResourceList;