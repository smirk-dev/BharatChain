import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { motion } from 'framer-motion';
import { 
  TrendingUp,
  TrendingDown,
  Refresh
} from '@mui/icons-material';

const StatCard = ({ 
  stat, 
  index, 
  onRefresh,
  isLoading = false 
}) => {
  const getTrendIcon = (trend) => {
    if (trend.includes('+')) return <TrendingUp />;
    if (trend.includes('-')) return <TrendingDown />;
    return null;
  };

  const getTrendColor = (trend) => {
    if (trend.includes('+')) return 'success';
    if (trend.includes('-')) return 'error';
    return 'info';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      whileHover={{ scale: 1.05, rotateY: 5 }}
      style={{ height: '100%' }}
    >
      <Card 
        className="bharat-card bharat-glow"
        sx={{ 
          p: 3, 
          height: '100%',
          background: stat.gradient,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          minHeight: { xs: '200px', sm: '220px' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        {/* Background Pattern */}
        <Box sx={{ 
          position: 'absolute', 
          top: -20, 
          right: -20, 
          fontSize: { xs: '4rem', sm: '6rem' }, 
          opacity: 0.1,
          display: { xs: 'none', sm: 'block' }
        }}>
          {stat.icon}
        </Box>
        
        {/* Content */}
        <CardContent sx={{ position: 'relative', zIndex: 2, p: { xs: 2, sm: 3 } }}>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 2,
            flexWrap: 'wrap',
            gap: 1
          }}>
            <Typography sx={{ 
              fontSize: { xs: '2rem', sm: '3rem' }, 
              mr: { xs: 1, sm: 2 }
            }}>
              {stat.icon}
            </Typography>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Chip 
                label={stat.trend} 
                size="small" 
                color={getTrendColor(stat.trend)}
                icon={getTrendIcon(stat.trend)}
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 700,
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' }
                }} 
              />
            </Box>
            {onRefresh && (
              <Tooltip title="Refresh">
                <IconButton
                  size="small"
                  onClick={onRefresh}
                  disabled={isLoading}
                  sx={{ 
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  <Refresh 
                    sx={{ 
                      fontSize: { xs: '1rem', sm: '1.2rem' },
                      animation: isLoading ? 'spin 1s linear infinite' : 'none'
                    }} 
                  />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          )}
          
          {/* Value */}
          <Typography 
            variant="h2" 
            sx={{ 
              fontWeight: 900, 
              mb: 1, 
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              fontSize: { xs: '2rem', sm: '3rem', md: '3.5rem' },
              lineHeight: 1.2
            }}
          >
            {isLoading ? '...' : stat.value}
          </Typography>
          
          {/* Title */}
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              opacity: 0.95, 
              fontFamily: '"Playfair Display", serif',
              fontSize: { xs: '1rem', sm: '1.25rem' },
              lineHeight: 1.2,
              mb: 0.5
            }}
          >
            {stat.title}
          </Typography>
          
          {/* Subtitle */}
          <Typography 
            variant="body2" 
            sx={{ 
              opacity: 0.8, 
              fontWeight: 500,
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              mb: 1
            }}
          >
            {stat.subtitle}
          </Typography>
          
          {/* Description */}
          <Typography 
            variant="caption" 
            sx={{ 
              opacity: 0.7, 
              display: 'block', 
              fontStyle: 'italic',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              lineHeight: 1.3
            }}
          >
            {stat.description}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatCard;