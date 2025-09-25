import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button
} from '@mui/material';
import { motion } from 'framer-motion';

const QuickActionCard = ({ 
  action, 
  index,
  isLoading = false 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ scale: 1.08, rotateY: 8 }}
      whileTap={{ scale: 0.95 }}
      style={{ height: '100%' }}
    >
      <Card 
        className="bharat-action-card bharat-glow"
        sx={{ 
          height: '100%', 
          cursor: 'pointer',
          background: 'rgba(255, 255, 255, 0.95)',
          border: '2px solid transparent',
          position: 'relative',
          overflow: 'hidden',
          minHeight: { xs: '240px', sm: '280px' },
          backdropFilter: 'blur(20px)',
          '&:hover': {
            borderColor: '#FF9933',
            boxShadow: '0 20px 60px rgba(255, 153, 51, 0.3)',
            '& .action-button': {
              background: action.gradient,
              transform: 'translateY(-2px)'
            }
          }
        }}
        onClick={!isLoading ? action.action : undefined}
      >
        {/* Background Pattern */}
        <Box sx={{ 
          position: 'absolute', 
          top: -10, 
          right: -10, 
          fontSize: { xs: '3rem', sm: '5rem' }, 
          opacity: 0.08, 
          color: '#FF9933',
          display: { xs: 'none', sm: 'block' }
        }}>
          {action.bgPattern}
        </Box>
        
        <CardContent sx={{ 
          textAlign: 'center', 
          p: { xs: 3, sm: 4 }, 
          position: 'relative', 
          zIndex: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          {/* Icon */}
          <Box sx={{ 
            fontSize: { xs: '3rem', sm: '4rem' }, 
            mb: 3,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
          }}>
            {action.icon}
          </Box>
          
          {/* Content */}
          <Box sx={{ flexGrow: 1 }}>
            {/* Title */}
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                color: '#000080',
                fontFamily: '"Playfair Display", serif',
                mb: 1,
                fontSize: { xs: '1.2rem', sm: '1.5rem' },
                lineHeight: 1.2
              }}
            >
              {action.title}
            </Typography>
            
            {/* Subtitle */}
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                color: '#7B3F00',
                mb: 2,
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              {action.subtitle}
            </Typography>
            
            {/* Description */}
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 1,
                fontWeight: 500,
                color: '#7B3F00',
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                lineHeight: 1.4
              }}
            >
              {action.description}
            </Typography>
            
            {/* English Description */}
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 3,
                fontStyle: 'italic',
                opacity: 0.8,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                lineHeight: 1.4
              }}
            >
              {action.englishDesc}
            </Typography>
          </Box>
          
          {/* Action Button */}
          <Button
            className="action-button"
            variant="contained"
            size={window.innerWidth < 600 ? "medium" : "large"}
            disabled={isLoading}
            sx={{ 
              mt: 2,
              borderRadius: '25px',
              px: { xs: 3, sm: 4 },
              py: { xs: 1, sm: 1.5 },
              fontWeight: 700,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #FF9933 0%, #FFD700 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px rgba(255, 153, 51, 0.3)',
              fontSize: { xs: '0.8rem', sm: '0.9rem' },
              '&:disabled': {
                background: 'linear-gradient(135deg, #ccc 0%, #eee 100%)',
                color: '#999'
              }
            }}
            startIcon={<span style={{ fontSize: { xs: '1rem', sm: '1.2rem' } }}>🚀</span>}
          >
            {isLoading ? 'लोड हो रहा है... • Loading...' : 'शुरू करें • Start'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default QuickActionCard;