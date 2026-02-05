import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Chip, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Alert,
  Snackbar,
  Autocomplete,
  Chip as MuiChip
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  PriorityHigh as PriorityHighIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useBookingManagement } from '../../hooks/useBookingManagement';
import { usePermissions } from '../../hooks/usePermissions';
import { Booking, Customer, Supplier, User } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface BookingManagementPageProps {
  onBookingSelect?: (booking: Booking) => void;
}

export const BookingManagementPage: React.FC<BookingManagementPageProps> = ({ onBookingSelect }) => {
  const { 
    bookings, 
    customers, 
    suppliers, 
    agents, 
    loading, 
    error, 
    searchBookings, 
    createBooking, 
    updateBooking, 
    assignAgent, 
    updatePriority,
    getBookingsByQueue
  } = useBookingManagement();

  const { hasPermission } = usePermissions();
  
  const [searchParams, setSearchParams] = useState({
    status: [] as string[],
    customer: '',
    agent: '',
    serviceType: '',
    priority: [] as string[],
    queueType: 'pending'
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });

  // Form state for creating bookings
  const [bookingForm, setBookingForm] = useState({
    type: 'flight',
    details: {
      origin: '',
      destination: '',
      travelDate: '',
      passengers: [{ firstName: '', lastName: '', type: 'adult', dateOfBirth: '' }]
    },
    customerInfo: {
      type: 'individual',
      name: '',
      email: '',
      phone: '',
      companyName: '',
      companyRegistrationNumber: ''
    },
    paymentInfo: {
      method: 'wallet',
      amount: 0,
      currency: 'USD'
    },
    bookingOptions: {
      hold: false,
      priority: 'medium',
      remarks: '',
      tags: [] as string[]
    }
  });

  useEffect(() => {
    loadBookings();
  }, [searchParams, pagination.page]);

  const loadBookings = async () => {
    try {
      const result = await searchBookings({
        ...searchParams,
        page: pagination.page,
        limit: pagination.limit
      });
      setPagination(prev => ({ ...prev, total: result.pagination.total }));
    } catch (err) {
      showSnackbar('Failed to load bookings', 'error');
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadBookings();
  };

  const handleCreateBooking = async () => {
    try {
      await createBooking(bookingForm);
      setOpenCreateDialog(false);
      setBookingForm({
        type: 'flight',
        details: {
          origin: '',
          destination: '',
          travelDate: '',
          passengers: [{ firstName: '', lastName: '', type: 'adult', dateOfBirth: '' }]
        },
        customerInfo: {
          type: 'individual',
          name: '',
          email: '',
          phone: '',
          companyName: '',
          companyRegistrationNumber: ''
        },
        paymentInfo: {
          method: 'wallet',
          amount: 0,
          currency: 'USD'
        },
        bookingOptions: {
          hold: false,
          priority: 'medium',
          remarks: '',
          tags: []
        }
      });
      showSnackbar('Booking created successfully', 'success');
      loadBookings();
    } catch (err) {
      showSnackbar('Failed to create booking', 'error');
    }
  };

  const handleAssignAgent = async (agentId: string) => {
    if (!selectedBooking) return;
    try {
      await assignAgent(selectedBooking.id, agentId);
      setOpenAssignDialog(false);
      showSnackbar('Agent assigned successfully', 'success');
      loadBookings();
    } catch (err) {
      showSnackbar('Failed to assign agent', 'error');
    }
  };

  type Priority = 'low' | 'medium' | 'high' | 'urgent';
  const handleUpdatePriority = async (priority: Priority) => {
    if (!selectedBooking) return;
    try {
      await updatePriority(selectedBooking.id, priority);
      showSnackbar('Priority updated successfully', 'success');
      loadBookings();
    } catch (err) {
      showSnackbar('Failed to update priority', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'PENDING': return 'warning';
      case 'CANCELLED': return 'error';
      case 'HOLD': return 'info';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Booking Management
        </Typography>
        {hasPermission('create_booking') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
          >
            Create Booking
          </Button>
        )}
      </Box>

      {/* Search and Filter Section */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Search & Filter" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  multiple
                  value={searchParams.status}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, status: e.target.value as string[] }))}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {['PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED', 'EXPIRED', 'HOLD'].map((status) => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Customer"
                value={searchParams.customer}
                onChange={(e) => setSearchParams(prev => ({ ...prev, customer: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Agent"
                value={searchParams.agent}
                onChange={(e) => setSearchParams(prev => ({ ...prev, agent: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Service Type</InputLabel>
                <Select
                  value={searchParams.serviceType}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, serviceType: e.target.value }))}
                >
                  {['flight', 'hotel', 'package', 'transfer', 'visa', 'insurance'].map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  multiple
                  value={searchParams.priority}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, priority: e.target.value as string[] }))}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {['low', 'medium', 'high', 'urgent'].map((priority) => (
                    <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Queue Type</InputLabel>
                <Select
                  value={searchParams.queueType}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, queueType: e.target.value }))}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                disabled={loading}
              >
                Search
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchParams({
                    status: [],
                    customer: '',
                    agent: '',
                    serviceType: '',
                    priority: [],
                    queueType: 'pending'
                  });
                  setPagination(prev => ({ ...prev, page: 1 }));
                  loadBookings();
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader 
          title="Bookings" 
          action={
            <Pagination
              count={Math.ceil(pagination.total / pagination.limit)}
              page={pagination.page}
              onChange={(_, page) => setPagination(prev => ({ ...prev, page }))}
              color="primary"
            />
          }
        />
        <CardContent>
          {loading ? (
            <Typography>Loading bookings...</Typography>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Reference</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Agent</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {booking.reference}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={booking.type} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {booking.customerInfo.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {booking.customerInfo.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={booking.status} 
                          color={getStatusColor(booking.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={booking.bookingOptions.priority} 
                          color={getPriorityColor(booking.bookingOptions.priority) as any}
                          size="small"
                          icon={booking.bookingOptions.priority === 'urgent' ? <PriorityHighIcon /> : undefined}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatCurrency(booking.pricing.sellingAmount, booking.pricing.currency)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {booking.assignedAgent ? (
                          <Typography variant="body2">
                            {booking.assignedAgent.name}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            Unassigned
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(booking.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          {hasPermission('assign_booking') && (
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setOpenAssignDialog(true);
                              }}
                              title="Assign Agent"
                            >
                              <AssignmentIcon />
                            </IconButton>
                          )}
                          {hasPermission('update_priority') && (
                            <IconButton
                              size="small"
                              onClick={() => handleUpdatePriority(booking.bookingOptions.priority === 'urgent' ? 'high' : 'urgent')}
                              title="Update Priority"
                            >
                              <PriorityHighIcon />
                            </IconButton>
                          )}
                          {hasPermission('view_bookings') && (
                            <IconButton
                              size="small"
                              onClick={() => onBookingSelect?.(booking)}
                              title="View Details"
                            >
                              <EditIcon />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create Booking Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Booking</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Service Type</InputLabel>
                <Select
                  value={bookingForm.type}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  {['flight', 'hotel', 'package', 'transfer', 'visa', 'insurance'].map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Customer Type</InputLabel>
                <Select
                  value={bookingForm.customerInfo.type}
                  onChange={(e) => setBookingForm(prev => ({ 
                    ...prev, 
                    customerInfo: { ...prev.customerInfo, type: e.target.value }
                  }))}
                >
                  <MenuItem value="individual">Individual</MenuItem>
                  <MenuItem value="corporate">Corporate</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {bookingForm.type === 'flight' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Origin"
                    value={bookingForm.details.origin}
                    onChange={(e) => setBookingForm(prev => ({ 
                      ...prev, 
                      details: { ...prev.details, origin: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Destination"
                    value={bookingForm.details.destination}
                    onChange={(e) => setBookingForm(prev => ({ 
                      ...prev, 
                      details: { ...prev.details, destination: e.target.value }
                    }))}
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Name"
                value={bookingForm.customerInfo.name}
                onChange={(e) => setBookingForm(prev => ({ 
                  ...prev, 
                  customerInfo: { ...prev.customerInfo, name: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Email"
                type="email"
                value={bookingForm.customerInfo.email}
                onChange={(e) => setBookingForm(prev => ({ 
                  ...prev, 
                  customerInfo: { ...prev.customerInfo, email: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Phone"
                value={bookingForm.customerInfo.phone}
                onChange={(e) => setBookingForm(prev => ({ 
                  ...prev, 
                  customerInfo: { ...prev.customerInfo, phone: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={bookingForm.paymentInfo.amount}
                onChange={(e) => setBookingForm(prev => ({ 
                  ...prev, 
                  paymentInfo: { ...prev.paymentInfo, amount: parseFloat(e.target.value) }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={bookingForm.paymentInfo.method}
                  onChange={(e) => setBookingForm(prev => ({ 
                    ...prev, 
                    paymentInfo: { ...prev.paymentInfo, method: e.target.value }
                  }))}
                >
                  {['wallet', 'credit_card', 'debit_card', 'net_banking', 'upi'].map((method) => (
                    <MenuItem key={method} value={method}>{method}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={bookingForm.bookingOptions.priority}
                  onChange={(e) => setBookingForm(prev => ({ 
                    ...prev, 
                    bookingOptions: { ...prev.bookingOptions, priority: e.target.value }
                  }))}
                >
                  {['low', 'medium', 'high', 'urgent'].map((priority) => (
                    <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                multiline
                rows={3}
                value={bookingForm.bookingOptions.remarks}
                onChange={(e) => setBookingForm(prev => ({ 
                  ...prev, 
                  bookingOptions: { ...prev.bookingOptions, remarks: e.target.value }
                }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateBooking}>Create Booking</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Agent Dialog */}
      <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)}>
        <DialogTitle>Assign Agent</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Assign {selectedBooking?.reference} to:
          </Typography>
          <Autocomplete
            options={agents}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => <TextField {...params} label="Select Agent" />}
            onChange={(_, value) => value && handleAssignAgent(value.id)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};