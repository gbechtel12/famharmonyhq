# FamHarmonyHQ - Shared Family Data Access

This document outlines the implementation of shared family data access within FamHarmonyHQ, a family organization application.

## Overview

FamHarmonyHQ allows multiple family members to access and manage shared family data, including schedules, chores, rewards, and more. The application uses Firebase Authentication for user management and Firestore for data storage.

## Architecture

### Data Structure

All family-related data is organized under a family-centric data model:

```
/families/{familyId}/ - Root collection for family data
  /events/ - Family calendar events
  /chores/ - Family chores and tasks
  /rewards/ - Reward system items
  /redemptions/ - Reward redemption history
  /mealPlans/ - Family meal planning data
  /groceryLists/ - Shopping lists
  /subUsers/ - Child profiles without authentication
```

Users are stored in a separate collection but reference their family:

```
/users/{userId} - User data
  - familyId: Reference to the family the user belongs to
```

Family invitations are managed through:

```
/familyInvites/{inviteId} - Invitations to join families
```

### Authentication & Authorization

1. **Authentication**: Firebase Authentication handles user login and signup
2. **Family Association**: Users can create or join a family
3. **Authorization**: Firestore security rules ensure users can only access data related to their family

## User Flow

1. **New User**:
   - Sign up through email/password or Google
   - Create a new family or join an existing one using an invite code

2. **Returning User**:
   - Sign in through email/password or Google
   - Access family data automatically

3. **Family Management**:
   - Create/manage family
   - Invite other members using email
   - Add child profiles

## Implementation Details

### Components

- **AuthContext**: Manages user authentication state
- **FamilyContext**: Manages family data and related operations
- **FamilySetup**: Component for creating/joining families
- **FamilyManagement**: Component for managing family members

### Services

All data service modules include family-specific data paths:

- **familyService**: Manages families, invitations, and members
- **rewardsService**: Manages rewards associated with a family
- **eventService**: Manages calendar events
- **agendaService**: Consolidates daily agenda items

### Security

Firestore security rules enforce that:

1. Users can only access their own profile data
2. Family data is only accessible to members of that family
3. Management operations are restricted to family administrators

## Technical Implementation

### FamilyContext

The `FamilyContext` provides a central interface for family-related operations:

```jsx
// Creating a family
const createFamily = async (familyName) => {
  const familyId = await familyService.createFamily(user.uid, familyName);
  await userService.updateFamilyId(user.uid, familyId);
  // ...
};

// Joining a family
const joinFamily = async (inviteId) => {
  const familyId = await familyService.acceptInvite(inviteId, user.uid);
  // ...
};

// Inviting members
const createFamilyInvite = async (email) => {
  const invite = await familyService.createInvite(user.familyId, email);
  // ...
};
```

### Data Access Pattern

All data access follows the same pattern of requiring a familyId:

```jsx
// Example: Fetching rewards for a family
const rewards = await rewardsService.getRewards(familyId);

// Example: Creating an event
await eventService.createEvent(familyId, eventData);
```

## Best Practices

1. **Always validate familyId**: All service methods require a valid familyId
2. **Use subcollections**: Store related data in subcollections
3. **Security rules**: Implement tight security rules to restrict data access
4. **Reference integrity**: Maintain references between related entities 