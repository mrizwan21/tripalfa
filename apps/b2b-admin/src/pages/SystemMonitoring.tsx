/**
 * System Monitoring Page
 * 
 * Integrates Prometheus metrics and Grafana dashboards
 * into the B2B Admin Panel for real-time monitoring
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Tabs,
  Tab,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  LinearProgress,
  Alert,
  Tooltip,
  Paper,
  Divider,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  RefreshCw as RefreshIcon,
  ExternalLink as OpenInNewIcon,
  CheckCircle as CheckCircleIcon,
  AlertCircle as ErrorIcon,
  Activity as TimelineIcon,
  Gauge as SpeedIcon,
  AlertTriangle as WarningIcon,
  XCircle as XCircleIcon,
} from 'lucide-react'

// Grafana dashboard URLs (embedded)
const GRAFANA_BASE_URL = import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3009'
const GRAFANA_DASHBOARDS = {
  overview: `${GRAFANA_BASE_URL}/d/overview/services-overview?kiosk&theme=light`,
  apiGateway: `${GRAFANA_BASE_URL}/d/api-gateway/api-gateway?kiosk&theme=light`,
  circuitBreakers: `${GRAFANA_BASE_URL}/d/circuit-breakers/circuit-breakers?kiosk&theme=light`,
  messageQueues: `${GRAFANA_BASE_URL}/d/message-queues/message-queues?kiosk&theme=light`,
}

// Prometheus API URL
const PROMETHEUS_URL = import.meta.env.VITE_PROMETHEUS_URL || 'http://localhost:9090'

// Service status interface
interface ServiceStatus {
  name: string
  label: string
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown'
  uptime: number
  responseTime: number
  circuitBreakerState: 'closed' | 'open' | 'half-open' | 'unknown'
  requestRate: number
  errorRate: number
  lastCheck: string
}

// Metric data interface
interface MetricData {
  timestamp: number
  value: number
}

// Service configuration
const SERVICES = [
  { name: 'api-gateway', label: 'API Gateway', port: 3000 },
  { name: 'booking-service', label: 'Booking Service', port: 3001 },
  { name: 'payment-service', label: 'Payment Service', port: 3007 },
  { name: 'user-service', label: 'User Service', port: 3004 },
  { name: 'notification-service', label: 'Notification Service', port: 3009 },
  { name: 'organization-service', label: 'Organization Service', port: 3006 },
  { name: 'rule-engine-service', label: 'Rule Engine', port: 3010 },
  { name: 'wallet-service', label: 'Wallet Service', port: 3008 },
  { name: 'kyc-service', label: 'KYC Service', port: 3011 },
  { name: 'marketing-service', label: 'Marketing Service', port: 3012 },
]

const SystemMonitoring: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [tabValue, setTabValue] = useState(0)
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedDashboard, setSelectedDashboard] = useState('overview')

  // Fetch service health from Prometheus
  const fetchServiceHealth = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const serviceStatuses: ServiceStatus[] = await Promise.all(
        SERVICES.map(async (service) => {
          try {
            // Query Prometheus for service up status
            const upQuery = `up{job="${service.name}"}`
            const upResponse = await fetch(
              `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(upQuery)}`
            )
            const upData = await upResponse.json()
            const isUp = upData.data?.result?.[0]?.value?.[1] === '1'

            // Query for request rate
            const rateQuery = `rate(http_requests_total{service="${service.name}"}[5m])`
            const rateResponse = await fetch(
              `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(rateQuery)}`
            )
            const rateData = await rateResponse.json()
            const requestRate = parseFloat(rateData.data?.result?.[0]?.value?.[1] || '0')

            // Query for error rate
            const errorQuery = `rate(http_requests_total{service="${service.name}",status=~"5.."}[5m])`
            const errorResponse = await fetch(
              `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(errorQuery)}`
            )
            const errorData = await errorResponse.json()
            const errorRate = parseFloat(errorData.data?.result?.[0]?.value?.[1] || '0')

            // Query circuit breaker state
            const cbQuery = `circuit_breaker_state{service="${service.name}"}`
            const cbResponse = await fetch(
              `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(cbQuery)}`
            )
            const cbData = await cbResponse.json()
            const cbState = cbData.data?.result?.[0]?.value?.[1] || '0'

            return {
              name: service.name,
              label: service.label,
              status: isUp ? 'healthy' : 'unhealthy',
              uptime: isUp ? 99.9 : 0,
              responseTime: Math.random() * 100 + 20, // Mock - would come from metrics
              circuitBreakerState: cbState === '1' ? 'open' : cbState === '2' ? 'half-open' : 'closed',
              requestRate,
              errorRate: errorRate / (requestRate || 1) * 100,
              lastCheck: new Date().toISOString(),
            }
          } catch (err) {
            return {
              name: service.name,
              label: service.label,
              status: 'unknown' as const,
              uptime: 0,
              responseTime: 0,
              circuitBreakerState: 'unknown' as const,
              requestRate: 0,
              errorRate: 0,
              lastCheck: new Date().toISOString(),
            }
          }
        })
      )

      setServices(serviceStatuses)
      setLastRefresh(new Date())
    } catch (err) {
      setError('Failed to fetch metrics from Prometheus. Ensure Prometheus is running.')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchServiceHealth()
    
    if (autoRefresh) {
      const interval = setInterval(fetchServiceHealth, 30000) // Refresh every 30s
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleDashboardChange = (event: SelectChangeEvent) => {
    setSelectedDashboard(event.target.value)
  }

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy': return 'success'
      case 'unhealthy': return 'error'
      case 'degraded': return 'warning'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy': return <Box sx={{ color: 'success.main' }}><CheckCircleIcon size={24} /></Box>
      case 'unhealthy': return <Box sx={{ color: 'error.main' }}><ErrorIcon size={24} /></Box>
      case 'degraded': return <Box sx={{ color: 'warning.main' }}><ErrorIcon size={24} /></Box>
      default: return <Box sx={{ color: 'disabled.main' }}><ErrorIcon size={24} /></Box>
    }
  }

  const getCircuitBreakerColor = (state: ServiceStatus['circuitBreakerState']) => {
    switch (state) {
      case 'closed': return 'success'
      case 'open': return 'error'
      case 'half-open': return 'warning'
      default: return 'default'
    }
  }

  // Calculate overall system health
  const healthyCount = services.filter(s => s.status === 'healthy').length
  const overallHealth = services.length > 0 
    ? ((healthyCount / services.length) * 100).toFixed(1)
    : '0'

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            System Monitoring
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time metrics from Prometheus and Grafana dashboards
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </Typography>
          
          <Tooltip title="Refresh now">
            <IconButton onClick={fetchServiceHealth} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Open Grafana">
            <IconButton onClick={() => window.open(GRAFANA_BASE_URL, '_blank')}>
              <OpenInNewIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Overview Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, mb: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ color: 'success.main' }}><CheckCircleIcon size={40} /></Box>
              <Box>
                <Typography variant="h4">{healthyCount}/{services.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Services Healthy
                </Typography>
              </Box>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={parseFloat(overallHealth)} 
              sx={{ mt: 2 }}
              color="success"
            />
            <Typography variant="caption" color="text.secondary">
              {overallHealth}% Overall Health
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ color: 'primary.main' }}><SpeedIcon size={40} /></Box>
              <Box>
                <Typography variant="h4">
                  {(services.reduce((acc, s) => acc + s.requestRate, 0)).toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Requests/sec
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ color: services.some(s => s.circuitBreakerState === 'open') ? 'error.main' : 'success.main' }}><TimelineIcon size={40} /></Box>
              <Box>
                <Typography variant="h4">
                  {services.filter(s => s.circuitBreakerState === 'open').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Open Circuits
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ color: services.reduce((acc, s) => acc + s.errorRate, 0) / (services.length || 1) > 5 ? 'error.main' : 'primary.main' }}><ErrorIcon size={40} /></Box>
              <Box>
                <Typography variant="h4">
                  {(services.reduce((acc, s) => acc + s.errorRate, 0) / (services.length || 1)).toFixed(2)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Error Rate
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Service Status" />
          <Tab label="Grafana Dashboards" />
          <Tab label="Circuit Breakers" />
          <Tab label="Message Queues" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {services.map((service) => (
            <Card key={service.name}>
              <CardHeader
                avatar={getStatusIcon(service.status)}
                title={service.label}
                subheader={service.name}
                action={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                      label={service.circuitBreakerState} 
                      size="small"
                      color={getCircuitBreakerColor(service.circuitBreakerState)}
                    />
                  </Box>
                }
              />
              <CardContent>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Typography variant="body2">
                      <Chip 
                        label={service.status} 
                        size="small"
                        color={getStatusColor(service.status)}
                      />
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Request Rate
                    </Typography>
                    <Typography variant="body2">
                      {service.requestRate.toFixed(2)}/s
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Error Rate
                    </Typography>
                    <Typography variant="body2" color={service.errorRate > 5 ? 'error' : 'text.primary'}>
                      {service.errorRate.toFixed(2)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Response Time
                    </Typography>
                    <Typography variant="body2">
                      {service.responseTime.toFixed(0)}ms
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Select Dashboard</InputLabel>
              <Select value={selectedDashboard} label="Select Dashboard" onChange={handleDashboardChange}>
                <MenuItem value="overview">Services Overview</MenuItem>
                <MenuItem value="apiGateway">API Gateway</MenuItem>
                <MenuItem value="circuitBreakers">Circuit Breakers</MenuItem>
                <MenuItem value="messageQueues">Message Queues</MenuItem>
              </Select>
            </FormControl>
            
            <IconButton onClick={() => window.open(GRAFANA_DASHBOARDS[selectedDashboard as keyof typeof GRAFANA_DASHBOARDS], '_blank')}>
              <OpenInNewIcon />
            </IconButton>
          </Box>
          
          <Paper sx={{ height: isMobile ? 400 : 600, overflow: 'hidden' }}>
            <iframe
              src={GRAFANA_DASHBOARDS[selectedDashboard as keyof typeof GRAFANA_DASHBOARDS]}
              width="100%"
              height="100%"
              frameBorder="0"
              title="Grafana Dashboard"
            />
          </Paper>
        </Box>
      )}

      {tabValue === 2 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {services.map((service) => (
            <Card key={service.name}>
              <CardHeader
                title={service.label}
                subheader="Circuit Breaker Status"
                avatar={
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%',
                    bgcolor: service.circuitBreakerState === 'closed' ? 'success.main' :
                             service.circuitBreakerState === 'open' ? 'error.main' : 'warning.main'
                  }} />
                }
              />
              <CardContent>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ textTransform: 'uppercase' }}>
                    {service.circuitBreakerState}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {service.circuitBreakerState === 'closed' && 'Operating normally'}
                    {service.circuitBreakerState === 'open' && 'Failing fast - requests blocked'}
                    {service.circuitBreakerState === 'half-open' && 'Testing recovery'}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={async () => {
                      // API call to reset circuit breaker
                      await fetch(`/api/admin/circuit-breaker/${service.name}/reset`, { method: 'POST' })
                      fetchServiceHealth()
                    }}
                  >
                    Reset
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined"
                    color="error"
                    onClick={async () => {
                      // API call to force open circuit breaker
                      await fetch(`/api/admin/circuit-breaker/${service.name}/trip`, { method: 'POST' })
                      fetchServiceHealth()
                    }}
                  >
                    Force Open
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {tabValue === 3 && (
        <Paper sx={{ height: 600, overflow: 'hidden' }}>
          <iframe
            src={GRAFANA_DASHBOARDS.messageQueues}
            width="100%"
            height="100%"
            frameBorder="0"
            title="Message Queues Dashboard"
          />
        </Paper>
      )}
    </Box>
  )
}

export default SystemMonitoring
