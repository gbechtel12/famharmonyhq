import React from 'react';
import { Box, Typography } from '@mui/material';
import ChoreItem from './ChoreItem';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { styled } from '@mui/material/styles';
import { COLUMNS, COLUMN_TO_STATUS } from './choreConstants';

// Styled component for the droppable area
const DroppableColumn = styled('div')(({ theme, isDraggingOver }) => ({
  padding: theme.spacing(2),
  backgroundColor: isDraggingOver ? theme.palette.action.hover : theme.palette.background.default,
  minHeight: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  transition: 'background-color 0.2s ease',
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: isDraggingOver ? theme.shadows[3] : 'none'
}));

// Styled component for the draggable item
const DraggableItem = styled('div')(({ theme, isDragging }) => ({
  opacity: isDragging ? 0.8 : 1,
  margin: theme.spacing(0.5, 0),
  transform: isDragging ? 'scale(1.02)' : 'scale(1)',
  transition: 'transform 0.2s ease'
}));

// Column header with title and count
const ColumnHeader = styled(Typography)(({ theme, columnColor }) => ({
  padding: theme.spacing(1),
  marginBottom: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: columnColor ? `${columnColor}20` : 'transparent',
  color: columnColor || theme.palette.text.primary,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `2px solid ${columnColor || theme.palette.divider}`
}));

export default function KanbanBoard({ chores, onStatusChange, onEdit, onDelete, onToggleComplete }) {
  const getChoresByStatus = (statusArray) => {
    return chores.filter(chore => statusArray.includes(chore.status || 'todo'));
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area or in the same place
    if (!destination || 
       (destination.droppableId === source.droppableId && 
        destination.index === source.index)) {
      return;
    }
    
    // If the chore was moved to a different column
    if (destination.droppableId !== source.droppableId) {
      const newStatus = COLUMN_TO_STATUS[destination.droppableId];
      onStatusChange(draggableId, newStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)'
          },
          gap: 2,
          width: '100%',
          overflowX: 'auto',
          minHeight: '70vh'
        }}
      >
        {Object.entries(COLUMNS).map(([columnId, column]) => (
          <Droppable droppableId={columnId} key={columnId}>
            {(provided, snapshot) => (
              <DroppableColumn
                {...provided.droppableProps}
                ref={provided.innerRef}
                isDraggingOver={snapshot.isDraggingOver}
              >
                <ColumnHeader variant="h6" columnColor={column.color}>
                  {column.title}
                  <Box
                    component="span"
                    sx={{
                      bgcolor: column.color,
                      color: '#fff',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {getChoresByStatus(column.statuses).length}
                  </Box>
                </ColumnHeader>
                <Box 
                  sx={{ 
                    flexGrow: 1,
                    minHeight: '100px',
                    transition: 'background-color 0.2s ease',
                    backgroundColor: snapshot.isDraggingOver ? `${column.color}10` : 'transparent',
                    borderRadius: 1,
                    padding: 1
                  }}
                >
                  {getChoresByStatus(column.statuses).map((chore, index) => (
                    <Draggable key={chore.id} draggableId={chore.id} index={index}>
                      {(provided, snapshot) => (
                        <DraggableItem
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          isDragging={snapshot.isDragging}
                          style={provided.draggableProps.style}
                        >
                          <ChoreItem
                            chore={chore}
                            onStatusChange={onStatusChange}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onToggleComplete={onToggleComplete}
                          />
                        </DraggableItem>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              </DroppableColumn>
            )}
          </Droppable>
        ))}
      </Box>
    </DragDropContext>
  );
} 