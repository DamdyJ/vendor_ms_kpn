-- Material single request approval snapshot
-- Created: 2026-05-11
-- Purpose:
-- 1. Keep mat_single_request as the main request header/current form data.
-- 2. Store the latest approval data in a single row per request.
-- 3. Keep Approval 1, Approval 2, and Approval 3 fields separated for easier reads on the UI/query side.
-- 4. Use request_id as the row anchor, and requester_user_id for direct requestor/user filtering.

BEGIN;

ALTER TABLE public.mat_single_request
    ADD COLUMN IF NOT EXISTS material_code varchar(50) NULL;

ALTER TABLE public.mat_single_request
    ADD COLUMN IF NOT EXISTS assigned_to varchar(100) NOT NULL DEFAULT 'Approval 1';

ALTER TABLE public.mat_single_request
    ALTER COLUMN assigned_to SET DEFAULT 'Approval 1';

UPDATE public.mat_single_request
SET assigned_to = 'Approval 1'
WHERE assigned_to IS NULL;

ALTER TABLE public.mat_single_request
    ALTER COLUMN assigned_to SET NOT NULL;

COMMENT ON COLUMN public.mat_single_request.material_code IS
    'Final material code assigned by Master Data when the request is completed.';

CREATE TABLE IF NOT EXISTS public.mat_single_request_approval (
    id bigserial PRIMARY KEY,
    request_id bigint NOT NULL,
    requester_user_id varchar(100) NOT NULL,
    approval_1_user_id varchar(100) NULL,
    approval_1_at timestamptz NULL,
    approval_1_status varchar(20) NULL DEFAULT 'WAITING',
    approval_1_remark text NULL,
    approval_2_user_id varchar(100) NULL,
    approval_2_at timestamptz NULL,
    approval_2_status varchar(20) NULL,
    approval_2_remark text NULL,
    approval_3_user_id varchar(100) NULL,
    approval_3_at timestamptz NULL,
    approval_3_status varchar(20) NULL,
    approval_3_remark text NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_mat_single_request_approval_request UNIQUE (request_id),
    CONSTRAINT fk_mat_single_request_approval_request
        FOREIGN KEY (request_id)
        REFERENCES public.mat_single_request(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_mat_single_request_approval_1_status
        CHECK (
            approval_1_status IS NULL
            OR approval_1_status IN ('WAITING', 'APPROVED', 'REWORK', 'REJECTED')
        ),
    CONSTRAINT chk_mat_single_request_approval_2_status
        CHECK (
            approval_2_status IS NULL
            OR approval_2_status IN ('WAITING', 'APPROVED', 'REWORK', 'REJECTED')
        ),
    CONSTRAINT chk_mat_single_request_approval_3_status
        CHECK (
            approval_3_status IS NULL
            OR approval_3_status IN ('WAITING', 'APPROVED', 'REWORK', 'REJECTED')
        )
);

ALTER TABLE public.mat_single_request_approval
    ALTER COLUMN approval_1_status SET DEFAULT 'WAITING';

COMMENT ON TABLE public.mat_single_request_approval IS
    'Current approval snapshot for material single requests, one row per request.';

COMMENT ON COLUMN public.mat_single_request_approval.request_id IS
    'References the specific material request being approved.';

COMMENT ON COLUMN public.mat_single_request_approval.requester_user_id IS
    'User ID from mst_user.user_id who created the material request. Mirrors mat_single_request.created_by for direct filtering.';

COMMENT ON COLUMN public.mat_single_request_approval.approval_1_user_id IS
    'User ID from mst_user.user_id who handled the latest action for Approval 1.';

COMMENT ON COLUMN public.mat_single_request_approval.approval_1_at IS
    'Timestamp of the latest action for Approval 1.';

COMMENT ON COLUMN public.mat_single_request_approval.approval_1_status IS
    'Latest status for Approval 1.';

COMMENT ON COLUMN public.mat_single_request_approval.approval_1_remark IS
    'Latest remark from Approval 1.';

COMMENT ON COLUMN public.mat_single_request_approval.approval_2_user_id IS
    'User ID from mst_user.user_id who handled the latest action for Approval 2.';

COMMENT ON COLUMN public.mat_single_request_approval.approval_2_at IS
    'Timestamp of the latest action for Approval 2.';

COMMENT ON COLUMN public.mat_single_request_approval.approval_2_status IS
    'Latest status for Approval 2.';

COMMENT ON COLUMN public.mat_single_request_approval.approval_2_remark IS
    'Latest remark from Approval 2.';

COMMENT ON COLUMN public.mat_single_request_approval.approval_3_user_id IS
    'User ID from mst_user.user_id who handled the latest action for Approval 3 / Master Data.';

COMMENT ON COLUMN public.mat_single_request_approval.approval_3_at IS
    'Timestamp of the latest action for Approval 3 / Master Data.';

COMMENT ON COLUMN public.mat_single_request_approval.approval_3_status IS
    'Latest status for Approval 3 / Master Data.';

COMMENT ON COLUMN public.mat_single_request_approval.approval_3_remark IS
    'Latest remark from Approval 3 / Master Data.';

CREATE INDEX IF NOT EXISTS idx_mat_single_request_approval_request_id
    ON public.mat_single_request_approval (request_id);

CREATE INDEX IF NOT EXISTS idx_mat_single_request_approval_requester_user_id
    ON public.mat_single_request_approval (requester_user_id);

CREATE INDEX IF NOT EXISTS idx_mat_single_request_approval_3_user_id
    ON public.mat_single_request_approval (approval_3_user_id);

COMMIT;
