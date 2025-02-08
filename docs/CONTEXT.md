# Hair Booking App Documentation

## Architecture Overview

### Frontend
- **Framework**: React Native with TypeScript
- **Tooling**: Expo & Expo Router
- **UI Components**: React Native Paper

### Backend/Database
- **Platform**: Supabase (leveraging PostgreSQL and its built-in authentication & real-time features)

### AI Processing
- **Service**: DeepSeek (for advanced search, service recommendations, and personalized booking insights)

### Payment Integration
- Integration with third-party payment gateways (e.g., Stripe, Apple Pay) ensuring secure, PCI-compliant transactions

### Notifications
- Push notifications (via Expo's notification services)
- Optional email/SMS alerts for appointment confirmations, reminders, and cancellation alerts

## User Flows

### 1. Authentication & User Profile

#### Sign In/Sign Up Options
- Users can sign in using either a phone number or email
- New users complete a registration form with:
  - Name
  - Email
  - Phone number
  - Gender
  - Age
  - Additional notes (e.g., hair restrictions, allergies)
  - Past procedures (if applicable)
- Supabase handles user authentication and stores user profiles securely

#### Profile Management
- Users can update their personal details from the Settings tab
- Secure session management via Supabase authentication tokens

### 2. Making a Reservation

#### Step 2.1: Selecting the Procedure

##### Procedure Dropdown
- Users choose from available hair salon services:
  - Haircut
  - Hair coloring
  - Hair treatment
  - Styling
  - Extensions
- Each service has a predefined time span that may vary by gender

##### Service Duration Determination
- App computes required appointment duration based on:
  - Selected procedure
  - Gender of the client
- DeepSeek enhances experience with personalized service recommendations

##### Booking for Others
- "Are you making a reservation for others?" checkbox reveals additional fields:
  - Other person's name
  - Age
  - Gender
  - Relevant notes

#### Step 2.2: Choosing Date and Time

##### Date & Time Picker
- User selects preferred date
- Available time slots dynamically fetched from Supabase
- Slots filtered based on service duration requirements

##### Availability Display
- Shows only valid time slots that accommodate entire service
- Real-time updates for latest availability

#### Step 2.3: Payment and Reservation Confirmation

##### Payment Entry
- Secure credit card entry
- Multiple payment options (e.g., Apple Pay)
- Integration with third-party payment gateway

##### Cancellation Policy
- Clear notice about $10 fee for cancellations within 24 hours of appointment

##### Confirmation
- Reservation confirmed after successful payment
- Confirmation sent via push notification and optionally email/SMS

### 3. Viewing & Managing Reservations

#### My Reservations Tab
- Lists upcoming and past reservations including:
  - Service type
  - Date & time
  - Assigned stylist
  - Booking details
  - Duration
  - Specific notes

#### Cancellation
- Direct cancellation from reservation screen
- Automated $10 fee enforcement for late cancellations
- Real-time backend synchronization

### 4. Settings

#### Profile Management
- Update personal details
- Manage payment methods
- Customize notification preferences
- Configure app preferences (language, theme)

## Technical Implementation

### Project Structure

### Backend Components

#### User Database (Supabase)
- Stores user profiles securely
- Manages authentication tokens
- Encrypts sensitive data

#### Reservations Database (Supabase)
- Tracks bookings and availability
- Provides real-time updates
- Manages cancellation history

#### Service Duration Logic

### Database Schema

#### Users Table
```sql
users (
  id: uuid PRIMARY KEY,
  email: text UNIQUE,
  phone: text UNIQUE,
  full_name: text,
  gender: text,
  age: integer,
  notes: text,
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now()
)
```

#### Profiles Table
```sql
profiles (
  id: uuid PRIMARY KEY REFERENCES users(id),
  avatar_url: text,
  preferred_language: text DEFAULT 'en',
  notification_preferences: jsonb,
  payment_methods: jsonb[]
)
```

#### Services Table
```sql
services (
  id: uuid PRIMARY KEY,
  name: text,
  description: text,
  base_duration: integer, // in minutes
  base_price: decimal,
  gender_specific_details: jsonb, // contains duration and price adjustments
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now()
)
```

#### Stylists Table
```sql
stylists (
  id: uuid PRIMARY KEY,
  full_name: text,
  specializations: text[],
  availability: jsonb, // weekly schedule
  is_active: boolean DEFAULT true,
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now()
)
```

#### Appointments Table
```sql
appointments (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  service_id: uuid REFERENCES services(id),
  stylist_id: uuid REFERENCES stylists(id),
  start_time: timestamp,
  end_time: timestamp,
  status: text, // 'scheduled', 'completed', 'cancelled'
  booking_for_other: boolean DEFAULT false,
  other_person_details: jsonb,
  total_price: decimal,
  cancellation_fee: decimal,
  notes: text,
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now()
)
```

#### Payments Table
```sql
payments (
  id: uuid PRIMARY KEY,
  appointment_id: uuid REFERENCES appointments(id),
  amount: decimal,
  status: text, // 'pending', 'completed', 'refunded'
  payment_method: text,
  transaction_id: text,
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now()
)
```

## Development Roadmap

### Phase 1: Project Setup & Authentication (Week 1)
1. Initialize project with Expo
   - Set up TypeScript configuration
   - Configure ESLint and Prettier
   - Install essential dependencies

2. Supabase Integration
   - Set up Supabase project
   - Implement database schema
   - Configure authentication rules

3. Authentication Screens
   - Implement sign-in screen
   - Implement sign-up screen
   - Add phone/email verification
   - Create authentication context/store

### Phase 2: Core User Profile Features (Week 2)
1. User Profile Management
   - Create profile creation flow
   - Implement profile editing
   - Add avatar upload functionality

2. Settings Implementation
   - Build settings screen
   - Add language selection
   - Implement theme switching
   - Configure notification preferences

### Phase 3: Service Booking Core (Week 3)
1. Services Management
   - Create services listing
   - Implement service details view
   - Add service search functionality
   - Integrate DeepSeek for recommendations

2. Booking Flow - Part 1
   - Implement service selection
   - Create duration calculator
   - Add "booking for others" functionality

### Phase 4: Booking System Completion (Week 4)
1. Booking Flow - Part 2
   - Build date/time selection
   - Implement availability checking
   - Create booking confirmation flow

2. Stylist Integration
   - Create stylist profiles
   - Implement stylist availability
   - Add stylist selection to booking flow

### Phase 5: Payments & Notifications (Week 5)
1. Payment Integration
   - Integrate Stripe/payment gateway
   - Implement payment flow
   - Add payment method management
   - Handle cancellation fees

2. Notification System
   - Set up Expo notifications
   - Implement booking confirmations
   - Add reminder notifications
   - Create cancellation alerts

### Phase 6: Appointment Management (Week 6)
1. Appointments View
   - Create appointments list
   - Implement appointment details
   - Add cancellation functionality
   - Build appointment history

2. Real-time Updates
   - Implement real-time booking updates
   - Add availability synchronization
   - Create booking conflict resolution

### Phase 7: Testing & Polish (Week 7)
1. Testing
   - Unit tests for core functionality
   - Integration tests for booking flow
   - End-to-end testing
   - Performance testing

2. UI/UX Polish
   - Implement loading states
   - Add error handling
   - Create success/error animations
   - Optimize navigation flows

### Phase 8: Deployment & Launch Preparation (Week 8)
1. Deployment
   - Configure production environment
   - Set up CI/CD pipeline
   - Prepare App Store/Play Store listings

2. Launch Preparation
   - Documentation completion
   - User guide creation
   - Support system setup
   - Beta testing coordination

### Development Guidelines
- Each phase should be completed with full testing before moving to the next
- Regular code reviews and documentation updates
- Daily commits and weekly sprint reviews
- Feature branches for each major component
- Continuous integration with main/development branches

### Testing Strategy
- Unit tests for all utilities and hooks
- Integration tests for complex flows
- E2E tests for critical paths
- Performance monitoring
- Regular security audits

### Quality Assurance Checklist
- Code linting and formatting
- TypeScript strict mode compliance
- Accessibility standards
- Performance benchmarks
- Security best practices
- Cross-platform testing
