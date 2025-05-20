import React, { useState, useEffect, useCallback } from 'react';
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
import { Link, useNavigate } from 'react-router-dom';
import { useFamily } from '../../contexts/FamilyContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import { groceryService } from '../../services/groceryService';
import { withErrorHandling } from '../../utils/errorHandler';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';

function GroceryListCard({ fullScreen = false, isLoading = false }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { family } = useFamily();
  const { handleError } = useFeedback();
  const [groceryItems, setGroceryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGroceryList = useCallback(async () => {
    if (!family?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    console.log(`Fetching grocery list for family ${family.id}`);
    
    try {
      // Use the withErrorHandling utility for better error handling
      const groceryList = await withErrorHandling(
        () => groceryService.getGroceryList(family.id),
        {
          context: 'grocery-list-card',
          dataType: 'groceryList',
          fallbackData: { items: [] }
        }
      );
      
      console.log(`Loaded grocery list with ${groceryList.items?.length || 0} items`);
      setGroceryItems(groceryList.items || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching grocery list:', err);
      handleError(err, 'grocery-list-card');
      setError('Unable to load grocery list');
    } finally {
      setLoading(false);
    }
  }, [family, handleError]);

  useEffect(() => {
    if (!family?.id) return;
    
    console.log(`Loading grocery list for family ${family.id} (isLoading: ${isLoading})`);
    fetchGroceryList().catch(err => {
      console.error('Failed to fetch grocery list:', err);
    });
  }, [fetchGroceryList, family?.id, isLoading]);

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
            onRetry={fetchGroceryList}
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
            onAction={() => navigate('/grocery')}
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
            to="/grocery"
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