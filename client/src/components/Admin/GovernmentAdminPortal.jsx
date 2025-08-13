import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Badge,
  IconButton,
  Tooltip,
  AppBar,
  Toolbar,
  Menu,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Dashboard,
  SupervisorAccount,
  VerifiedUser,
  ReportProblem,
  Description,
  Analytics,
  Settings,
  Notifications,
  CheckCircle,
  Pending,
  Warning,
  Error as ErrorIcon,
  Person,
  School,
  Business,
  Security,
  Assignment,
  Timeline,
  TrendingUp,
  Group,
  Flag,
  Gavel,
  Speed,
  AccountBalance,
  LocationCity,
  Public,
  MoreVert,
  Edit,
  Visibility,
  Schedule,
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
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const GovernmentAdminPortal = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('central');
  const [notifications, setNotifications] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [departmentStats, setDepartmentStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState([]);

  // Demo data
  const demoDepartments = [
    { id: 'central', name: 'Central Government', level: 'Central', color: '#FF6B35' },
    { id: 'state', name: 'State Government', level: 'State', color: '#138808' },
    { id: 'municipal', name: 'Municipal Corporation', level: 'Local', color: '#2196F3' },
    { id: 'panchayat', name: 'Panchayat Raj', level: 'Local', color: '#9C27B0' },
  ];

  const demoStats = {
    central: {
      totalCitizens: 1247,
      pendingVerifications: 87,
      resolvedGrievances: 456,
      pendingGrievances: 123,
      documentsProcessed: 2340,
      averageResolutionTime: 3.2,
      efficiency: 87.5,
    },
    state: {
      totalCitizens: 8923,
      pendingVerifications: 234,
      resolvedGrievances: 1876,
      pendingGrievances: 345,
      documentsProcessed: 5670,
      averageResolutionTime: 4.1,
      efficiency: 82.3,
    },
    municipal: {
      totalCitizens: 45267,
      pendingVerifications: 567,
      resolvedGrievances: 3245,
      pendingGrievances: 789,
      documentsProcessed: 12340,
      averageResolutionTime: 2.8,
      efficiency: 91.2,
    },
    panchayat: {
      totalCitizens: 12456,
      pendingVerifications: 123,
      resolvedGrievances: 987,
      pendingGrievances: 234,
      documentsProcessed: 3456,
      averageResolutionTime: 5.5,
      efficiency: 78.9,
    }
  };

  const demoOfficers = [
    {
      id: 1,
      name: 'Rajesh Kumar Singh',
      designation: 'District Collector',
      department: 'Revenue',
      level: 'District',
      workload: 89,
      efficiency: 94,
      status: 'active',
      lastActive: '2 hours ago'
    },
    {
      id: 2,
      name: 'Priya Sharma',
      designation: 'Deputy Commissioner',
      department: 'Health',
      level: 'State',
      workload: 76,
      efficiency: 87,
      status: 'active',
      lastActive: '1 hour ago'
    },
    {
      id: 3,
      name: 'Amit Verma',
      designation: 'Assistant Director',
      department: 'Education',
      level: 'State',
      workload: 92,
      efficiency: 91,
      status: 'busy',
      lastActive: '30 minutes ago'
    },
    {
      id: 4,
      name: 'Sunita Devi',
      designation: 'Block Development Officer',
      department: 'Rural Development',
      level: 'Block',
      workload: 67,
      efficiency: 89,
      status: 'active',
      lastActive: '45 minutes ago'
    }
  ];

  const demoPendingApprovals = [
    {
      id: 1,
      type: 'Document Verification',
      applicantName: 'Rahul Sharma',
      documentType: 'Aadhar Card',
      submittedDate: '2025-08-10',
      priority: 'high',
      assignedOfficer: 'Rajesh Kumar Singh',
      status: 'pending'
    },
    {
      id: 2,
      type: 'Grievance Resolution',
      applicantName: 'Meera Patel',
      category: 'Water Supply',
      submittedDate: '2025-08-08',
      priority: 'urgent',
      assignedOfficer: 'Priya Sharma',
      status: 'under_review'
    },
    {
      id: 3,
      type: 'Certificate Issuance',
      applicantName: 'Vikash Yadav',
      certificateType: 'Income Certificate',
      submittedDate: '2025-08-12',
      priority: 'medium',
      assignedOfficer: 'Amit Verma',
      status: 'pending'
    }
  ];

  const demoPerformanceData = [
    { month: 'Jan', central: 85, state: 78, municipal: 89, panchayat: 72 },
    { month: 'Feb', central: 87, state: 81, municipal: 91, panchayat: 75 },
    { month: 'Mar', central: 89, state: 83, municipal: 93, panchayat: 78 },
    { month: 'Apr', central: 88, state: 82, municipal: 92, panchayat: 79 },
    { month: 'May', central: 90, state: 85, municipal: 94, panchayat: 81 },
    { month: 'Jun', central: 88, state: 82, municipal: 91, panchayat: 79 },
  ];

  const demoWorkloadData = [
    { name: 'Document Verification', pending: 287, completed: 1245, efficiency: 81 },
    { name: 'Grievance Resolution', pending: 156, completed: 789, efficiency: 83 },
    { name: 'Certificate Issuance', pending: 98, completed: 567, efficiency: 85 },
    { name: 'License Processing', pending: 67, completed: 345, efficiency: 84 },
    { name: 'Welfare Schemes', pending: 123, completed: 456, efficiency: 79 },
  ];

  useEffect(() => {
    // Load demo data
    setOfficers(demoOfficers);
    setPendingApprovals(demoPendingApprovals);
    setPerformanceMetrics(demoPerformanceData);
  }, []);

  const getCurrentStats = () => {
    return demoStats[selectedDepartment] || demoStats.central;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
      case 'completed':
      case 'verified':
        return <CheckCircle color="success" />;
      case 'pending':
      case 'submitted':
        return <Pending color="warning" />;
      case 'under_review':
        return <Schedule color="info" />;
      case 'rejected':
        return <ErrorIcon color="error" />;
      default:
        return <Warning color="disabled" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'completed':
      case 'verified':
        return 'success';
      case 'pending':
      case 'submitted':
        return 'warning';
      case 'under_review':
        return 'info';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getOfficerStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'busy':
        return 'warning';
      case 'offline':
        return 'error';
      default:
        return 'default';
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
                  {trend > 0 ? '+' : ''}{trend}% this month
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

  const currentStats = getCurrentStats();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <AccountBalance sx={{ mr: 2, color: 'primary.main' }} />
          Government Admin Portal
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Multi-tier governance dashboard for efficient administration
        </Typography>
      </Box>

      {/* Department Selector */}
      <Card elevation={1} sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">Department:</Typography>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                {demoDepartments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          bgcolor: dept.color,
                          borderRadius: '50%'
                        }}
                      />
                      {dept.name}
                      <Chip label={dept.level} size="small" />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Key Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Citizens"
            value={currentStats.totalCitizens.toLocaleString()}
            subtitle="Registered users"
            icon={<Group />}
            color="primary.main"
            trend={8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Verifications"
            value={currentStats.pendingVerifications}
            subtitle="Awaiting approval"
            icon={<Assignment />}
            color="warning.main"
            trend={-12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Resolved Grievances"
            value={currentStats.resolvedGrievances}
            subtitle="This month"
            icon={<CheckCircle />}
            color="success.main"
            trend={15}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Efficiency Rate"
            value={`${currentStats.efficiency}%`}
            subtitle={`Avg. time: ${currentStats.averageResolutionTime} days`}
            icon={<Speed />}
            color="info.main"
            trend={3}
          />
        </Grid>
      </Grid>

      {/* Navigation Tabs */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={(e, newValue) => setCurrentTab(newValue)}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Dashboard />} label="Overview" />
          <Tab icon={<SupervisorAccount />} label="Officers" />
          <Tab icon={<Assignment />} label="Pending Approvals" />
          <Tab icon={<Analytics />} label="Performance" />
          <Tab icon={<Settings />} label="Workflow" />
        </Tabs>
      </Paper>

      {/* Overview Tab */}
      {currentTab === 0 && (
        <Grid container spacing={3}>
          {/* Performance Chart */}
          <Grid item xs={12} lg={8}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Department Performance Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={demoPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="central" stroke="#FF6B35" strokeWidth={3} />
                    <Line type="monotone" dataKey="state" stroke="#138808" strokeWidth={3} />
                    <Line type="monotone" dataKey="municipal" stroke="#2196F3" strokeWidth={3} />
                    <Line type="monotone" dataKey="panchayat" stroke="#9C27B0" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Workload Distribution */}
          <Grid item xs={12} lg={4}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Workload Distribution
                </Typography>
                <List>
                  {demoWorkloadData.map((item, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={item.name}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Pending: {item.pending} | Completed: {item.completed}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                              <Typography variant="caption" sx={{ mr: 1 }}>
                                Efficiency: {item.efficiency}%
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Officers Tab */}
      {currentTab === 1 && (
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Government Officers</Typography>
              <Button variant="contained" startIcon={<Person />}>
                Add Officer
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Designation</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Workload</TableCell>
                    <TableCell>Efficiency</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {officers.map((officer) => (
                    <TableRow key={officer.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            {officer.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {officer.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Last active: {officer.lastActive}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{officer.designation}</TableCell>
                      <TableCell>{officer.department}</TableCell>
                      <TableCell>
                        <Chip label={officer.level} size="small" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: 60, mr: 1 }}>
                            <Typography variant="caption">{officer.workload}%</Typography>
                          </Box>
                          <Chip
                            label={officer.workload > 85 ? 'High' : officer.workload > 70 ? 'Medium' : 'Low'}
                            color={officer.workload > 85 ? 'error' : officer.workload > 70 ? 'warning' : 'success'}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>{officer.efficiency}%</TableCell>
                      <TableCell>
                        <Chip
                          label={officer.status}
                          color={getOfficerStatusColor(officer.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Profile">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Pending Approvals Tab */}
      {currentTab === 2 && (
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Pending Approvals & Actions
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Applicant</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Assigned Officer</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingApprovals.map((approval) => (
                    <TableRow key={approval.id}>
                      <TableCell>{approval.type}</TableCell>
                      <TableCell>{approval.applicantName}</TableCell>
                      <TableCell>
                        {approval.documentType || approval.category || approval.certificateType}
                      </TableCell>
                      <TableCell>{approval.submittedDate}</TableCell>
                      <TableCell>
                        <Chip
                          label={approval.priority}
                          color={getPriorityColor(approval.priority)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{approval.assignedOfficer}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(approval.status)}
                          label={approval.status.replace('_', ' ')}
                          color={getStatusColor(approval.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="small" variant="contained" color="success" sx={{ mr: 1 }}>
                          Approve
                        </Button>
                        <Button size="small" variant="outlined" color="error">
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Performance Tab */}
      {currentTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Resolution Trends
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={demoPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey={selectedDepartment} stroke="#FF6B35" fill="#FF6B35" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Department Efficiency Comparison
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { name: 'Central', efficiency: demoStats.central.efficiency },
                    { name: 'State', efficiency: demoStats.state.efficiency },
                    { name: 'Municipal', efficiency: demoStats.municipal.efficiency },
                    { name: 'Panchayat', efficiency: demoStats.panchayat.efficiency },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="efficiency" fill="#FF6B35" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Workflow Tab */}
      {currentTab === 4 && (
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Workflow Automation Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Automatic Approvals
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="Auto-approve verified documents" />
                    <Switch defaultChecked />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Auto-assign grievances by location" />
                    <Switch defaultChecked />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Priority escalation for urgent cases" />
                    <Switch defaultChecked />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Send SMS notifications" />
                    <Switch />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Performance Thresholds
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Maximum Resolution Time (days)"
                    type="number"
                    defaultValue="7"
                    size="small"
                  />
                  <TextField
                    label="Efficiency Target (%)"
                    type="number"
                    defaultValue="85"
                    size="small"
                  />
                  <TextField
                    label="Workload Limit per Officer"
                    type="number"
                    defaultValue="50"
                    size="small"
                  />
                  <Button variant="contained">
                    Save Settings
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default GovernmentAdminPortal;
