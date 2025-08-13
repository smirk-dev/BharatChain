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
} from '@mui/material';
import {
  LocalHospital,
  CalendarToday,
  Assignment,
  Vaccines,
  Receipt,
  Add,
  Edit,
  Visibility,
  Schedule,
  CheckCircle,
  Pending,
  Warning,
  Person,
  Phone,
  Email,
  LocationOn,
  Medical,
  History,
} from '@mui/icons-material';

const HealthcareModule = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [insuranceClaims, setInsuranceClaims] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form states
  const [appointmentForm, setAppointmentForm] = useState({
    doctorName: '',
    hospital: '',
    department: '',
    date: '',
    time: '',
    reason: '',
  });

  const [medicalRecordForm, setMedicalRecordForm] = useState({
    recordType: '',
    doctor: '',
    hospital: '',
    diagnosis: '',
    treatment: '',
    medications: '',
    date: '',
  });

  const [vaccinationForm, setVaccinationForm] = useState({
    vaccineName: '',
    hospital: '',
    doctor: '',
    date: '',
    nextDose: '',
    certificate: null,
  });

  const [insuranceForm, setInsuranceForm] = useState({
    claimType: '',
    hospital: '',
    amount: '',
    billDate: '',
    description: '',
    documents: null,
  });

  // Demo data
  const demoAppointments = [
    {
      id: 1,
      doctorName: 'Dr. Rajesh Kumar',
      hospital: 'AIIMS Delhi',
      department: 'Cardiology',
      date: '2025-08-15',
      time: '10:30 AM',
      status: 'confirmed',
      reason: 'Routine check-up'
    },
    {
      id: 2,
      doctorName: 'Dr. Priya Sharma',
      hospital: 'Safdarjung Hospital',
      department: 'Dermatology',
      date: '2025-08-20',
      time: '2:00 PM',
      status: 'pending',
      reason: 'Skin allergy consultation'
    }
  ];

  const demoMedicalRecords = [
    {
      id: 1,
      recordType: 'Consultation',
      doctor: 'Dr. Amit Singh',
      hospital: 'Max Hospital',
      diagnosis: 'Hypertension',
      treatment: 'Lifestyle changes, medication',
      medications: 'Amlodipine 5mg',
      date: '2025-08-10',
      status: 'verified'
    },
    {
      id: 2,
      recordType: 'Lab Report',
      doctor: 'Dr. Sunita Devi',
      hospital: 'Apollo Hospital',
      diagnosis: 'Blood sugar normal',
      treatment: 'Continue current diet',
      medications: 'None',
      date: '2025-08-05',
      status: 'verified'
    }
  ];

  const demoVaccinations = [
    {
      id: 1,
      vaccineName: 'COVID-19 (Covishield)',
      hospital: 'Primary Health Center',
      doctor: 'Dr. Ramesh Gupta',
      date: '2025-07-15',
      doseNumber: '1st Dose',
      nextDose: '2025-08-15',
      certificateId: 'COV-2025-001234',
      status: 'completed'
    },
    {
      id: 2,
      vaccineName: 'Hepatitis B',
      hospital: 'City Hospital',
      doctor: 'Dr. Meera Patel',
      date: '2025-06-20',
      doseNumber: '2nd Dose',
      nextDose: '2026-06-20',
      certificateId: 'HEP-2025-005678',
      status: 'completed'
    }
  ];

  const demoInsuranceClaims = [
    {
      id: 1,
      claimType: 'Hospitalization',
      hospital: 'Fortis Hospital',
      amount: '₹45,000',
      billDate: '2025-08-01',
      claimDate: '2025-08-03',
      status: 'approved',
      description: 'Emergency surgery'
    },
    {
      id: 2,
      claimType: 'Outpatient',
      hospital: 'Local Clinic',
      amount: '₹2,500',
      billDate: '2025-07-28',
      claimDate: '2025-07-30',
      status: 'processing',
      description: 'Consultation and medicines'
    }
  ];

  useEffect(() => {
    // Load demo data
    setAppointments(demoAppointments);
    setMedicalRecords(demoMedicalRecords);
    setVaccinations(demoVaccinations);
    setInsuranceClaims(demoInsuranceClaims);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
      case 'verified':
      case 'approved':
        return <CheckCircle color="success" />;
      case 'pending':
      case 'processing':
        return <Pending color="warning" />;
      case 'cancelled':
      case 'rejected':
        return <Warning color="error" />;
      default:
        return <Schedule color="disabled" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
      case 'verified':
      case 'approved':
        return 'success';
      case 'pending':
      case 'processing':
        return 'warning';
      case 'cancelled':
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleSubmitForm = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSuccess(`${dialogType} submitted successfully!`);
    setDialogOpen(false);
    setLoading(false);
    
    // Reset forms
    setAppointmentForm({
      doctorName: '',
      hospital: '',
      department: '',
      date: '',
      time: '',
      reason: '',
    });
  };

  const openDialog = (type) => {
    setDialogType(type);
    setDialogOpen(true);
  };

  // Stats for the header
  const healthcareStats = {
    appointments: appointments.length,
    records: medicalRecords.length,
    vaccinations: vaccinations.length,
    claims: insuranceClaims.length,
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <LocalHospital sx={{ mr: 2, color: 'primary.main' }} />
          Healthcare Services
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Comprehensive healthcare management integrated with BharatChain
        </Typography>
      </Box>

      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                <CalendarToday />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {healthcareStats.appointments}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Appointments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
                <Assignment />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {healthcareStats.records}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Medical Records
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                <Vaccines />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {healthcareStats.vaccinations}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Vaccinations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                <Receipt />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {healthcareStats.claims}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Insurance Claims
              </Typography>
            </CardContent>
          </Card>
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
          <Tab icon={<CalendarToday />} label="Appointments" />
          <Tab icon={<Assignment />} label="Medical Records" />
          <Tab icon={<Vaccines />} label="Vaccinations" />
          <Tab icon={<Receipt />} label="Insurance Claims" />
        </Tabs>
      </Paper>

      {/* Appointments Tab */}
      {currentTab === 0 && (
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">My Appointments</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => openDialog('Appointment')}
              >
                Book Appointment
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Hospital</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>{appointment.doctorName}</TableCell>
                      <TableCell>{appointment.hospital}</TableCell>
                      <TableCell>{appointment.department}</TableCell>
                      <TableCell>
                        {appointment.date} at {appointment.time}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(appointment.status)}
                          label={appointment.status}
                          color={getStatusColor(appointment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
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

      {/* Medical Records Tab */}
      {currentTab === 1 && (
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Medical Records</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => openDialog('Medical Record')}
              >
                Add Record
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Record Type</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Hospital</TableCell>
                    <TableCell>Diagnosis</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {medicalRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.recordType}</TableCell>
                      <TableCell>{record.doctor}</TableCell>
                      <TableCell>{record.hospital}</TableCell>
                      <TableCell>{record.diagnosis}</TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(record.status)}
                          label={record.status}
                          color={getStatusColor(record.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
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

      {/* Vaccinations Tab */}
      {currentTab === 2 && (
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Vaccination Records</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => openDialog('Vaccination')}
              >
                Add Vaccination
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Vaccine</TableCell>
                    <TableCell>Hospital</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Dose</TableCell>
                    <TableCell>Next Dose</TableCell>
                    <TableCell>Certificate ID</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vaccinations.map((vaccination) => (
                    <TableRow key={vaccination.id}>
                      <TableCell>{vaccination.vaccineName}</TableCell>
                      <TableCell>{vaccination.hospital}</TableCell>
                      <TableCell>{vaccination.date}</TableCell>
                      <TableCell>{vaccination.doseNumber}</TableCell>
                      <TableCell>{vaccination.nextDose}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {vaccination.certificateId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Download Certificate">
                          <IconButton size="small">
                            <Visibility />
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

      {/* Insurance Claims Tab */}
      {currentTab === 3 && (
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Insurance Claims</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => openDialog('Insurance Claim')}
              >
                Submit Claim
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Claim Type</TableCell>
                    <TableCell>Hospital</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Bill Date</TableCell>
                    <TableCell>Claim Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {insuranceClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell>{claim.claimType}</TableCell>
                      <TableCell>{claim.hospital}</TableCell>
                      <TableCell>{claim.amount}</TableCell>
                      <TableCell>{claim.billDate}</TableCell>
                      <TableCell>{claim.claimDate}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(claim.status)}
                          label={claim.status}
                          color={getStatusColor(claim.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
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

      {/* Universal Dialog for Forms */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'Appointment' && 'Book New Appointment'}
          {dialogType === 'Medical Record' && 'Add Medical Record'}
          {dialogType === 'Vaccination' && 'Add Vaccination Record'}
          {dialogType === 'Insurance Claim' && 'Submit Insurance Claim'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'Appointment' && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Doctor Name"
                  value={appointmentForm.doctorName}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, doctorName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hospital"
                  value={appointmentForm.hospital}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, hospital: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={appointmentForm.department}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, department: e.target.value })}
                    label="Department"
                  >
                    <MenuItem value="cardiology">Cardiology</MenuItem>
                    <MenuItem value="dermatology">Dermatology</MenuItem>
                    <MenuItem value="neurology">Neurology</MenuItem>
                    <MenuItem value="orthopedics">Orthopedics</MenuItem>
                    <MenuItem value="pediatrics">Pediatrics</MenuItem>
                    <MenuItem value="general">General Medicine</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Preferred Date"
                  type="date"
                  value={appointmentForm.date}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Preferred Time"
                  type="time"
                  value={appointmentForm.time}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reason for Visit"
                  multiline
                  rows={3}
                  value={appointmentForm.reason}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })}
                />
              </Grid>
            </Grid>
          )}
          
          {/* Add more form types as needed */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitForm} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HealthcareModule;
