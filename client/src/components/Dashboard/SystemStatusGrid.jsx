import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Collapse
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Refresh,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';

const SystemStatusGrid = ({ 
  onRefresh,
  isLoading = false,
  compact = false 
}) => {
  const [expanded, setExpanded] = useState(!compact);
  
  const systemServices = [
    { 
      name: 'ब्लॉकचेन नेटवर्क', 
      englishName: 'Blockchain Network', 
      status: 'Connected',
      statusHindi: 'जुड़ा हुआ',
      icon: '🔗',
      gradient: 'linear-gradient(135deg, #138808 0%, #50C878 100%)',
      uptime: '99.9%',
      responseTime: '120ms'
    },
    { 
      name: 'IPFS भंडारण', 
      englishName: 'IPFS Storage', 
      status: 'Online',
      statusHindi: 'ऑनलाइन',
      icon: '☁️',
      gradient: 'linear-gradient(135deg, #005A5B 0%, #4169E1 100%)',
      uptime: '99.5%',
      responseTime: '85ms'
    },
    { 
      name: 'AI प्रसंस्करण', 
      englishName: 'AI Processing', 
      status: 'Available',
      statusHindi: 'उपलब्ध',
      icon: '🤖',
      gradient: 'linear-gradient(135deg, #E49B0F 0%, #FFA500 100%)',
      uptime: '98.8%',
      responseTime: '250ms'
    },
    { 
      name: 'दस्तावेज़ सत्यापन', 
      englishName: 'Document Verification', 
      status: 'Active',
      statusHindi: 'सक्रिय',
      icon: '✅',
      gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
      uptime: '99.7%',
      responseTime: '95ms'
    },
    { 
      name: 'सरकारी APIs', 
      englishName: 'Government APIs', 
      status: 'Connected',
      statusHindi: 'जुड़ा हुआ',
      icon: '🏛️',
      gradient: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
      uptime: '99.2%',
      responseTime: '180ms'
    },
    { 
      name: 'मोबाइल सेवाएं', 
      englishName: 'Mobile Services', 
      status: 'Active',
      statusHindi: 'सक्रिय',
      icon: '📱',
      gradient: 'linear-gradient(135deg, #4B0082 0%, #8A2BE2 100%)',
      uptime: '99.6%',
      responseTime: '75ms'
    },
    { 
      name: 'भुगतान गेटवे', 
      englishName: 'Payment Gateway', 
      status: 'Secure',
      statusHindi: 'सुरक्षित',
      icon: '💳',
      gradient: 'linear-gradient(135deg, #006400 0%, #32CD32 100%)',
      uptime: '99.9%',
      responseTime: '65ms'
    },
    { 
      name: 'आपातकालीन सिस्टम', 
      englishName: 'Emergency System', 
      status: 'Ready',
      statusHindi: 'तैयार',
      icon: '🚨',
      gradient: 'linear-gradient(135deg, #B22222 0%, #FF6347 100%)',
      uptime: '100%',
      responseTime: '45ms'
    }
  ];

  return (
    <Card className="bharat-card" sx={{ mt: 4 }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 4,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              flexGrow: 1, 
              color: '#000080',
              fontFamily: '"Playfair Display", serif',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
              minWidth: 0
            }}
          >
            🔧 सिस्टम स्थिति • System Status
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {compact && (
              <Tooltip title={expanded ? "कम दिखाएं • Show Less" : "अधिक दिखाएं • Show More"}>
                <IconButton
                  onClick={() => setExpanded(!expanded)}
                  sx={{ 
                    color: '#FF9933',
                    background: 'linear-gradient(135deg, rgba(255, 153, 51, 0.1) 0%, rgba(255, 215, 0, 0.1) 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #FF9933 0%, #FFD700 100%)',
                      color: 'white'
                    }
                  }}
                >
                  {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Tooltip>
            )}
            
            <Tooltip title="स्थिति रीफ्रेश करें • Refresh Status">
              <IconButton 
                onClick={onRefresh}
                disabled={isLoading}
                size="large" 
                sx={{ 
                  color: '#FF9933',
                  background: 'linear-gradient(135deg, rgba(255, 153, 51, 0.1) 0%, rgba(255, 215, 0, 0.1) 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #FF9933 0%, #FFD700 100%)',
                    color: 'white'
                  }
                }}
              >
                <Refresh 
                  sx={{ 
                    animation: isLoading ? 'spin 1s linear infinite' : 'none'
                  }} 
                />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Services Grid */}
        <AnimatePresence>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Grid container spacing={3}>
              {systemServices.map((service, index) => (
                <Grid 
                  item 
                  xs={12} 
                  sm={6} 
                  md={compact ? 6 : 4} 
                  lg={compact ? 4 : 3} 
                  key={index}
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: { xs: 2, sm: 3 }, 
                      background: service.gradient,
                      borderRadius: 4,
                      color: 'white',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      minHeight: { xs: '140px', sm: '160px' },
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                      cursor: isLoading ? 'wait' : 'pointer',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)'
                      }
                    }}>
                      {/* Background Pattern */}
                      <Box sx={{ 
                        position: 'absolute', 
                        top: -10, 
                        right: -10, 
                        fontSize: { xs: '3rem', sm: '4rem' }, 
                        opacity: 0.1,
                        display: { xs: 'none', sm: 'block' }
                      }}>
                        {service.icon}
                      </Box>
                      
                      {/* Icon */}
                      <Typography sx={{ 
                        fontSize: { xs: '2rem', sm: '3rem' }, 
                        mb: 2, 
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                        position: 'relative',
                        zIndex: 2
                      }}>
                        {service.icon}
                      </Typography>
                      
                      {/* Service Name */}
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700, 
                          mb: 1, 
                          fontFamily: '"Playfair Display", serif',
                          fontSize: { xs: '0.9rem', sm: '1.1rem' },
                          lineHeight: 1.2,
                          position: 'relative',
                          zIndex: 2
                        }}
                      >
                        {service.name}
                      </Typography>
                      
                      {/* English Name */}
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mb: 1, 
                          opacity: 0.9, 
                          fontWeight: 500,
                          fontSize: { xs: '0.7rem', sm: '0.8rem' },
                          position: 'relative',
                          zIndex: 2
                        }}
                      >
                        {service.englishName}
                      </Typography>
                      
                      {/* Status Chip */}
                      <Chip
                        label={`${service.statusHindi} • ${service.status}`}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          fontWeight: 600,
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          fontSize: { xs: '0.6rem', sm: '0.7rem' },
                          position: 'relative',
                          zIndex: 2,
                          mb: 1
                        }}
                      />
                      
                      {/* Additional Info */}
                      {!compact && (
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          width: '100%', 
                          mt: 1,
                          fontSize: { xs: '0.6rem', sm: '0.7rem' },
                          opacity: 0.8,
                          position: 'relative',
                          zIndex: 2
                        }}>
                          <Typography variant="caption">
                            ⏱ {service.responseTime}
                          </Typography>
                          <Typography variant="caption">
                            📊 {service.uptime}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Collapse>
        </AnimatePresence>
        
        {/* Summary when collapsed */}
        {compact && !expanded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-around', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
              p: 3,
              background: 'linear-gradient(135deg, rgba(255, 153, 51, 0.1) 0%, rgba(255, 215, 0, 0.1) 100%)',
              borderRadius: 3,
              border: '1px solid rgba(255, 153, 51, 0.2)'
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#138808', fontWeight: 700 }}>
                  {systemServices.filter(s => s.status.includes('Connected') || s.status.includes('Active') || s.status.includes('Online')).length}
                </Typography>
                <Typography variant="caption" sx={{ color: '#7B3F00' }}>
                  सक्रिय • Active
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#FF9933', fontWeight: 700 }}>
                  99.6%
                </Typography>
                <Typography variant="caption" sx={{ color: '#7B3F00' }}>
                  उपलब्धता • Uptime
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#4169E1', fontWeight: 700 }}>
                  110ms
                </Typography>
                <Typography variant="caption" sx={{ color: '#7B3F00' }}>
                  औसत • Avg Response
                </Typography>
              </Box>
            </Box>
          </motion.div>
        )}
        
        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography className="bharat-sanskrit" sx={{ 
            fontSize: { xs: '0.8rem', sm: '1rem' }, 
            color: '#7B3F00',
            mb: 1
          }}>
            वसुधैव कुटुम्बकम् • The World is One Family
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ 
            mt: 1, 
            fontStyle: 'italic',
            fontSize: { xs: '0.7rem', sm: '0.8rem' }
          }}>
            "Powered by BharatChain - Connecting India's Digital Future with Blockchain Technology"
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SystemStatusGrid;