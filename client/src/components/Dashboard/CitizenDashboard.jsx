import React from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar
} from '@mui/material';
import { 
  TrendingUp, 
  Security, 
  Speed,
  Storage 
} from '@mui/icons-material';

const Dashboard = () => {
  const recentTransactions = [
    { id: '0x1234...', type: 'Document Upload', time: '2 mins ago', status: 'Confirmed' },
    { id: '0x5678...', type: 'Identity Verification', time: '15 mins ago', status: 'Pending' },
    { id: '0x9012...', type: 'Data Transfer', time: '1 hour ago', status: 'Confirmed' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        BharatChain Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>
              <List>
                {recentTransactions.map((tx, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                        <Security fontSize="small" />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={tx.type}
                      secondary={`${tx.id} • ${tx.time}`}
                    />
                    <Chip
                      label={tx.status}
                      color={tx.status === 'Confirmed' ? 'success' : 'warning'}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Network Status */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Network Health
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Block Height</Typography>
                  <Typography variant="body2" fontWeight="bold">1,234,567</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Gas Price</Typography>
                  <Typography variant="body2" fontWeight="bold">21 gwei</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">TPS</Typography>
                  <Typography variant="body2" fontWeight="bold">1,500</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
