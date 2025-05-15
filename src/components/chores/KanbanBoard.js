import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import ChoreItem from './ChoreItem';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { styled } from '@mui/material/styles';

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
  border: `1px solid ${theme.palette.divider}`
}));

// Styled component for the draggable item
const DraggableItem = styled('div')(({ theme, isDragging }) => ({
  opacity: isDragging ? 0.8 : 1,
  margin: theme.spacing(0.5, 0)
}));

const COLUMNS = {
  todo: {
    id: 'todo',
    title: '📝 To Do',
    statuses: ['todo', 'open']
  },
  in_progress: {
    id: 'in_progress',
    title: '🏃 In Progress',
    statuses: ['in_progress']
  },
  done: {
    id: 'done',
    title: '✨ Done',
    statuses: ['done']
  }
};

// Mapping from column ID to status
const COLUMN_TO_STATUS = {
  todo: 'todo',
  in_progress: 'in_progress',
  done: 'done'
};

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
          gridTemplateColumns: 'repeat(3, 1fr)',
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
                <Typography variant="h6" gutterBottom>
                  {column.title} ({getChoresByStatus(column.statuses).length})
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
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