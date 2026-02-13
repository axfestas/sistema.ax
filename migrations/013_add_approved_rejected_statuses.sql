-- Migration: Add approved and rejected statuses to reservation_requests
-- This migration adds support for approving and rejecting reservation requests

-- The status column already exists, we just need to document the new valid values:
-- Current: 'pending', 'contacted', 'converted', 'cancelled'
-- New: 'approved', 'rejected'

-- No schema changes needed, just adding comment for documentation
-- Valid statuses are now: 'pending', 'contacted', 'approved', 'rejected', 'converted', 'cancelled'

-- Note: The application layer will handle the validation of these new statuses
