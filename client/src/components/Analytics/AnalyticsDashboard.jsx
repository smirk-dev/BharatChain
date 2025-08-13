import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  People,
  Description,
  ReportProblem,
  CheckCircle,
  Pending,
  Warning,
  Speed,
  Analytics,
  Timeline,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const AnalyticsDashboard = ({ 
  citizenStats, 
  documentStats, 
  grievanceStats, 
  monthlyData,
  recentActivity 
}) => {
  // Demo data for visualization
  const demoMonthlyData = monthlyData || [
    { month: 'Jan', citizens: 120, documents: 45, grievances: 23, resolved: 18 },
    { month: 'Feb', citizens: 180, documents: 67, grievances: 31, resolved: 28 },
    { month: 'Mar', citizens: 250, documents: 89, grievances: 42, resolved: 35 },
    { month: 'Apr', citizens: 320, documents: 112, grievances: 38, resolved: 33 },
    { month: 'May', citizens: 410, documents: 145, grievances: 45, resolved: 40 },
    { month: 'Jun', citizens: 520, documents: 178, grievances: 52, resolved: 47 },
  ];

  const demoGrievanceData = [
    { name: 'Infrastructure', value: 35, color: '#FF6B35' },
    { name: 'Healthcare', value: 25, color: '#138808' },
    { name: 'Education', value: 20, color: '#2196F3' },
    { name: 'Water Supply', value: 12, color: '#FF9800' },
    { name: 'Other', value: 8, color: '#9C27B0' },
  ];

  const demoStatusData = [
    { name: 'Resolved', value: 68, color: '#4CAF50' },
    { name: 'In Progress', value: 22, color: '#FF9800' },
    { name: 'Pending', value: 10, color: '#F44336' },
  ];

  const demoRecentActivity = recentActivity || [
    { type: 'citizen', action: 'New citizen registered', time: '5 minutes ago', user: 'Rahul Sharma' },
    { type: 'document', action: 'Document verified', time: '12 minutes ago', user: 'Priya Singh' },
    { type: 'grievance', action: 'Grievance resolved', time: '25 minutes ago', user: 'Amit Kumar' },
    { type: 'citizen', action: 'Profile updated', time: '1 hour ago', user: 'Sunita Devi' },
    { type: 'document', action: 'Document uploaded', time: '2 hours ago', user: 'Vikash Yadav' },
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'citizen': return <People color="primary" />;
      case 'document': return <Description color="info" />;
      case 'grievance': return <ReportProblem color="warning" />;
      default: return <Timeline color="secondary" />;
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {subtitle}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp color="success" sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  +{trend}% this month
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const ProgressCard = ({ title, completed, total, color }) => {
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    return (
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mr: 1 }}>
              {completed}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              / {total}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: color,
                borderRadius: 4,
              },
            }}
          />
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            {percentage.toFixed(1)}% completed
          </Typography>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Analytics sx={{ mr: 2 }} />
          Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Real-time insights into BharatChain platform performance
        </Typography>
      </Box>

      {/* Key Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Citizens"
            value={citizenStats?.total || "1,247"}
            subtitle="Registered users"
            icon={<People />}
            color="primary.main"
            trend={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Documents"
            value={documentStats?.total || "3,456"}
            subtitle="Uploaded & verified"
            icon={<Description />}
            color="info.main"
            trend={8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Grievances"
            value={grievanceStats?.total || "892"}
            subtitle="Total submitted"
            icon={<ReportProblem />}
            color="warning.main"
            trend={-3}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Resolution Rate"
            value="87.5%"
            subtitle="Avg. resolution time: 3.2 days"
            icon={<Speed />}
            color="success.main"
            trend={5}
          />
        </Grid>
      </Grid>

      {/* Progress Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <ProgressCard
            title="Document Verification"
            completed={2856}
            total={3456}
            color="#2196F3"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ProgressCard
            title="Grievance Resolution"
            completed={780}
            total={892}
            color="#4CAF50"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ProgressCard
            title="Citizen Verification"
            completed={1089}
            total={1247}
            color="#FF9800"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Monthly Trends */}
        <Grid item xs={12} lg={8}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={demoMonthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="citizens" 
                    stroke="#FF6B35" 
                    strokeWidth={3}
                    dot={{ fill: '#FF6B35', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="documents" 
                    stroke="#2196F3" 
                    strokeWidth={3}
                    dot={{ fill: '#2196F3', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="grievances" 
                    stroke="#FF9800" 
                    strokeWidth={3}
                    dot={{ fill: '#FF9800', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Grievance Categories */}
        <Grid item xs={12} lg={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Grievance Categories
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={demoGrievanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {demoGrievanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Distribution and Recent Activity */}
      <Grid container spacing={3}>
        {/* Status Distribution */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Grievance Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={demoStatusData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {demoStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List>
                {demoRecentActivity.map((activity, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'background.paper' }}>
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.action}
                        secondary={
                          <Box>
                            <Typography variant="body2" component="span">
                              {activity.user}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                              {activity.time}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < demoRecentActivity.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard;
