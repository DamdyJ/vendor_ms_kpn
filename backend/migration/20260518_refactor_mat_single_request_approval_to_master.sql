BEGIN;

ALTER TABLE public.mat_single_request
    ADD COLUMN IF NOT EXISTS approval_1_user_id varchar(100) NULL,
    ADD COLUMN IF NOT EXISTS approval_1_status varchar(20) NULL DEFAULT 'WAITING',
    ADD COLUMN IF NOT EXISTS approval_1_at timestamptz NULL,
    ADD COLUMN IF NOT EXISTS approval_1_remark text NULL,
    ADD COLUMN IF NOT EXISTS approval_2_user_id varchar(100) NULL,
    ADD COLUMN IF NOT EXISTS approval_2_status varchar(20) NULL,
    ADD COLUMN IF NOT EXISTS approval_2_at timestamptz NULL,
    ADD COLUMN IF NOT EXISTS approval_2_remark text NULL,
    ADD COLUMN IF NOT EXISTS approval_3_user_id varchar(100) NULL,
    ADD COLUMN IF NOT EXISTS approval_3_status varchar(20) NULL,
    ADD COLUMN IF NOT EXISTS approval_3_at timestamptz NULL,
    ADD COLUMN IF NOT EXISTS approval_3_remark text NULL;

UPDATE public.mat_single_request r
SET approval_1_user_id = a.approval_1_user_id,
    approval_1_status = COALESCE(a.approval_1_status, r.approval_1_status),
    approval_1_at = a.approval_1_at,
    approval_1_remark = a.approval_1_remark,
    approval_2_user_id = a.approval_2_user_id,
    approval_2_status = a.approval_2_status,
    approval_2_at = a.approval_2_at,
    approval_2_remark = a.approval_2_remark,
    approval_3_user_id = a.approval_3_user_id,
    approval_3_status = a.approval_3_status,
    approval_3_at = a.approval_3_at,
    approval_3_remark = a.approval_3_remark
FROM public.mat_single_request_approval a
WHERE a.request_id = r.id;

ALTER TABLE public.mat_single_request
    ADD CONSTRAINT chk_mat_single_request_approval_1_status
        CHECK (approval_1_status IS NULL OR approval_1_status IN ('WAITING', 'APPROVED', 'REWORK', 'REJECTED')),
    ADD CONSTRAINT chk_mat_single_request_approval_2_status
        CHECK (approval_2_status IS NULL OR approval_2_status IN ('WAITING', 'APPROVED', 'REWORK', 'REJECTED')),
    ADD CONSTRAINT chk_mat_single_request_approval_3_status
        CHECK (approval_3_status IS NULL OR approval_3_status IN ('WAITING', 'APPROVED', 'REWORK', 'REJECTED'));

ALTER TABLE public.mat_single_request_approval
    DROP CONSTRAINT IF EXISTS fk_mat_single_request_approval_request,
    DROP CONSTRAINT IF EXISTS uq_mat_single_request_approval_request,
    DROP CONSTRAINT IF EXISTS chk_mat_single_request_approval_1_status,
    DROP CONSTRAINT IF EXISTS chk_mat_single_request_approval_2_status,
    DROP CONSTRAINT IF EXISTS chk_mat_single_request_approval_3_status;

DROP INDEX IF EXISTS idx_mat_single_request_approval_request_id;
DROP INDEX IF EXISTS idx_mat_single_request_approval_3_user_id;

ALTER TABLE public.mat_single_request_approval
    ADD COLUMN IF NOT EXISTS approval_3_type varchar(20) NOT NULL DEFAULT 'SYSTEM',
    ADD COLUMN IF NOT EXISTS approval_3_group varchar(100) NOT NULL DEFAULT 'MDM_MATERIAL',
    ADD COLUMN IF NOT EXISTS created_by varchar(100) NULL,
    ADD COLUMN IF NOT EXISTS updated_by varchar(100) NULL;

DELETE FROM public.mat_single_request_approval
WHERE id NOT IN (
    SELECT MIN(id)
    FROM public.mat_single_request_approval
    GROUP BY requester_user_id
);

ALTER TABLE public.mat_single_request_approval
    DROP COLUMN IF EXISTS request_id,
    DROP COLUMN IF EXISTS approval_1_at,
    DROP COLUMN IF EXISTS approval_1_status,
    DROP COLUMN IF EXISTS approval_1_remark,
    DROP COLUMN IF EXISTS approval_2_at,
    DROP COLUMN IF EXISTS approval_2_status,
    DROP COLUMN IF EXISTS approval_2_remark,
    DROP COLUMN IF EXISTS approval_3_user_id,
    DROP COLUMN IF EXISTS approval_3_at,
    DROP COLUMN IF EXISTS approval_3_status,
    DROP COLUMN IF EXISTS approval_3_remark;

ALTER TABLE public.mat_single_request_approval
    ADD CONSTRAINT uq_mat_single_request_approval_requester UNIQUE (requester_user_id),
    ADD CONSTRAINT chk_mat_single_request_approval_3_type
        CHECK (approval_3_type IN ('SYSTEM'));

CREATE INDEX IF NOT EXISTS idx_mat_single_request_created_by
    ON public.mat_single_request(created_by);
CREATE INDEX IF NOT EXISTS idx_mat_single_request_approval_1_user_id
    ON public.mat_single_request(approval_1_user_id);
CREATE INDEX IF NOT EXISTS idx_mat_single_request_approval_2_user_id
    ON public.mat_single_request(approval_2_user_id);
CREATE INDEX IF NOT EXISTS idx_mat_single_request_approval_3_user_id
    ON public.mat_single_request(approval_3_user_id);
CREATE INDEX IF NOT EXISTS idx_mat_single_request_approval_requester_user_id
    ON public.mat_single_request_approval(requester_user_id);

COMMIT;

-- Verification
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'mat_single_request_approval'
ORDER BY ordinal_position;

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'mat_single_request'
ORDER BY ordinal_position;
