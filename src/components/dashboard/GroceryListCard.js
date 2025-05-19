import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent,
  Button, 
  Typography, 
  Box, 
  Skeleton,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Link } from 'react-router-dom';
import { useFamily } from '../../contexts/FamilyContext';
import { groceryService } from '../../services/groceryService';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';

function GroceryListCard({ fullScreen = false }) {
  const theme = useTheme();
  const { family } = useFamily();
  const [groceryItems, setGroceryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGroceryList = async () => {
      if (!family?.id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Use the groceryService to fetch grocery items
        const groceryList = await groceryService.getGroceryList(family.id);
        setGroceryItems(groceryList.items || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching grocery list:', err);
        setError('Unable to load grocery list');
        setLoading(false);
      }
    };

    fetchGroceryList();
  }, [family]);

  // Define theme-aware styles
  const cardBackground = theme.palette.mode === 'dark' 
    ? 'linear-gradient(to bottom right, #1e293b, #334155)' 
    : 'linear-gradient(to bottom right, #f1f5f9, #e2e8f0)';

  const cardBorder = theme.palette.mode === 'dark' 
    ? '1px solid #64748b' 
    : '1px solid #94a3b8';
    
  const iconColor = theme.palette.mode === 'dark' 
    ? '#94a3b8' 
    : '#475569';
    
  const headerBackground = theme.palette.mode === 'dark'
    ? 'rgba(0, 0, 0, 0.2)'
    : 'rgba(255, 255, 255, 0.7)';

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader
          title={<Skeleton width="40%" />}
        />
        <CardContent>
          <List>
            {[1, 2, 3, 4].map((i) => (
              <ListItem key={i} sx={{ px: 0 }}>
                <ListItemIcon>
                  <Skeleton variant="circular" width={24} height={24} />
                </ListItemIcon>
                <ListItemText
                  primary={<Skeleton width="60%" />}
                />
              </ListItem>
            ))}
          </List>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <Skeleton width={120} height={36} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: '100%', background: cardBackground, border: cardBorder }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ShoppingCartIcon sx={{ fontSize: 18, mr: 0.5, color: iconColor }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Grocery List
              </Typography>
            </Box>
          }
          sx={{ 
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: headerBackground,
            py: 1.5,
            px: 2
          }}
        />
        <CardContent>
          <ErrorState 
            title="Couldn't load grocery list" 
            message={error}
            onRetry={() => window.location.reload()}
          />
        </CardContent>
      </Card>
    );
  }

  if (!groceryItems.length) {
    return (
      <Card sx={{ height: '100%', background: cardBackground, border: cardBorder }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ShoppingCartIcon sx={{ fontSize: 18, mr: 0.5, color: iconColor }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Grocery List
              </Typography>
            </Box>
          }
          sx={{ 
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: headerBackground,
            py: 1.5,
            px: 2
          }}
        />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: fullScreen ? 'calc(100vh - 160px)' : '240px' }}>
          <EmptyState 
            title="No items in grocery list" 
            message="Add items to your grocery list to see them here."
            icon={<ShoppingCartIcon />}
            actionText="Add Items"
            onAction={() => window.location.href = '/grocery-list'}
          />
        </CardContent>
      </Card>
    );
  }

  // Show only top 5 items in preview
  const previewItems = groceryItems.slice(0, 5);

  return (
    <Card 
      sx={{ 
        height: '100%',
        background: cardBackground,
        border: cardBorder
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ShoppingCartIcon sx={{ fontSize: 18, mr: 0.5, color: iconColor }} />
            <Typography variant="subtitle1" fontWeight="medium">
              Grocery List
            </Typography>
          </Box>
        }
        subheader={`${groceryItems.length} items`}
        sx={{ 
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: headerBackground,
          py: 1.5,
          px: 2
        }}
      />
      <CardContent sx={{ p: 0 }}>
        <List dense>
          {previewItems.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 && <Divider component="li" />}
              <ListItem sx={{ px: 2, py: 0.75 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckBoxOutlineBlankIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2">
                      {item.name}
                    </Typography>
                  }
                  secondary={
                    item.quantity && (
                      <Typography variant="caption" color="text.secondary">
                        Qty: {item.quantity}
                      </Typography>
                    )
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
          {groceryItems.length > 5 && (
            <>
              <Divider />
              <ListItem sx={{ px: 2, py: 0.75 }}>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary">
                      +{groceryItems.length - 5} more items
                    </Typography>
                  }
                />
              </ListItem>
            </>
          )}
        </List>
        <Box sx={{ p: 2, pt: 1 }}>
          <Button
            component={Link}
            to="/grocery-list"
            endIcon={<ArrowForwardIcon />}
            variant="outlined"
            size="small"
            fullWidth
            sx={{ mt: 1 }}
          >
            View Full List
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export default GroceryListCard; 