-- Add approval workflow fields to mat_sap_data table
-- Simple workflow: pending -> approved (updates created_by) or rejected

-- Add minimal approval workflow columns
ALTER TABLE public.mat_sap_data 
ADD COLUMN requested_by varchar(100) NULL,
ADD COLUMN requested_at timestamptz NULL,
ADD COLUMN rejected_by varchar(100) NULL,
ADD COLUMN rejection_reason text NULL;

-- Add approval_status to track workflow state
ALTER TABLE public.mat_sap_data 
ADD COLUMN approval_status varchar(20) NULL DEFAULT 'approved';

-- Add constraint for approval status
ALTER TABLE public.mat_sap_data 
ADD CONSTRAINT mat_sap_data_approval_status_check 
CHECK (approval_status IN ('pending', 'approved', 'rejected') OR approval_status IS NULL);

-- Create indexes for efficient querying
CREATE INDEX idx_mat_sap_data_approval_status ON public.mat_sap_data (approval_status, requested_at) WHERE approval_status IS NOT NULL;
CREATE INDEX idx_mat_sap_data_pending_approval ON public.mat_sap_data (approval_status) WHERE approval_status = 'pending';
CREATE INDEX idx_mat_sap_data_requested_by ON public.mat_sap_data (requested_by) WHERE requested_by IS NOT NULL;

-- Update existing records to have approved status (for legacy data)
UPDATE public.mat_sap_data 
SET approval_status = 'approved'
WHERE approval_status IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.mat_sap_data.approval_status IS 'Approval workflow status: pending, approved, rejected';
COMMENT ON COLUMN public.mat_sap_data.requested_by IS 'User who requested this material';
COMMENT ON COLUMN public.mat_sap_data.requested_at IS 'Timestamp when material was requested';
COMMENT ON COLUMN public.mat_sap_data.rejected_by IS 'User who rejected this material';
COMMENT ON COLUMN public.mat_sap_data.rejection_reason IS 'Reason for rejection if status is rejected';