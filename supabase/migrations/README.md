# Database Migrations

## Development Reset Strategy

For development, we use a complete reset approach:

1. Run `complete_reset.sql` in your Supabase SQL Editor
   - This drops and recreates all tables
   - Fully idempotent - safe to run multiple times
   - Run this at the beginning of each dev cycle

## What the reset script includes:

### Core Tables
- **Profiles table**: Custom user settings (extends Supabase auth.users)
  - Auto-creates profile on user signup
  - Stores username, display name, avatar, preferences

- **Dogs table**: User's dogs with comprehensive info
  - Name, breed, age, weight
  - Photo URL, personality traits array
  - Medical notes, training level
  - Flexible metadata JSONB field

### Activity & Health Tracking
- **Dog Activities table**: Daily activity logging
  - Walk tracking (duration, distance)
  - Feeding records (amount, time)
  - Play sessions, grooming, bathroom breaks
  - Medication administration

- **Veterinary Records table**: Complete health history
  - Visit dates, vet/clinic info
  - Diagnosis and treatment notes
  - Medications prescribed
  - Document storage (lab results, x-rays)
  - Cost tracking

- **Training Sessions table**: Progress tracking
  - Commands practiced
  - Success rates (0-100%)
  - Duration and treats used
  - Session notes

### Organization & AI
- **Reminders table**: Scheduled tasks
  - Medication, vet appointments, grooming
  - Recurring schedules (daily/weekly/monthly)
  - Completion tracking

- **Conversations table**: AI chat sessions
  - Linked to specific dogs
  - Model selection (default: Gemini)

- **Messages table**: Chat history
  - User/assistant/system roles
  - Metadata storage

### Security
- Full Row Level Security (RLS) policies
- Users only access their own data
- Automatic updated_at timestamps
- Optimized indexes for performance

## Usage

```sql
-- In Supabase SQL Editor, run:
-- 1. Select all content from complete_reset.sql
-- 2. Execute
```

Note: This approach is for development only. For production, use proper incremental migrations.