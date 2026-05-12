-- Single material request + approval bundle for DBeaver
-- Created: 2026-05-12
-- Purpose:
-- 1. Create/patch mat_single_request.
-- 2. Create/patch mat_single_request_attachment.
-- 3. Create/patch mat_single_request_approval.
-- 4. Backfill initial approval rows for existing single requests.
--
-- How to run in DBeaver:
-- Use "Execute SQL Script" / Alt+X, not single-statement Ctrl+Enter.

BEGIN;

CREATE TABLE IF NOT EXISTS public.mat_single_request (
    id bigserial PRIMARY KEY,
    request_no varchar(30) NOT NULL,
    ticket_type varchar(20) NOT NULL DEFAULT 'Create',
    material_group_code varchar(10) NOT NULL,
    material_sub_group_id int4 NULL,
    plant_code varchar(20) NULL,
    sloc_code varchar(20) NULL,
    material_description varchar(255) NOT NULL,
    base_uom varchar(20) NOT NULL,
    long_text_1 text NULL,
    long_text_2 text NULL,
    long_text_3 text NULL,
    template_payload jsonb NULL,
    status varchar(20) NOT NULL DEFAULT 'Submit',
    assigned_to varchar(100) NOT NULL DEFAULT 'Approval 1',
    material_code varchar(50) NULL,
    created_by varchar(100) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_mat_single_request_no UNIQUE (request_no)
);

ALTER TABLE public.mat_single_request
    ADD COLUMN IF NOT EXISTS request_no varchar(30) NULL,
    ADD COLUMN IF NOT EXISTS ticket_type varchar(20) NOT NULL DEFAULT 'Create',
    ADD COLUMN IF NOT EXISTS material_group_code varchar(10) NULL,
    ADD COLUMN IF NOT EXISTS material_sub_group_id int4 NULL,
    ADD COLUMN IF NOT EXISTS plant_code varchar(20) NULL,
    ADD COLUMN IF NOT EXISTS sloc_code varchar(20) NULL,
    ADD COLUMN IF NOT EXISTS material_description varchar(255) NULL,
    ADD COLUMN IF NOT EXISTS base_uom varchar(20) NULL,
    ADD COLUMN IF NOT EXISTS long_text_1 text NULL,
    ADD COLUMN IF NOT EXISTS long_text_2 text NULL,
    ADD COLUMN IF NOT EXISTS long_text_3 text NULL,
    ADD COLUMN IF NOT EXISTS template_payload jsonb NULL,
    ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'Submit',
    ADD COLUMN IF NOT EXISTS assigned_to varchar(100) NOT NULL DEFAULT 'Approval 1',
    ADD COLUMN IF NOT EXISTS material_code varchar(50) NULL,
    ADD COLUMN IF NOT EXISTS created_by varchar(100) NULL,
    ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT NOW();

ALTER TABLE public.mat_single_request
    ALTER COLUMN ticket_type SET DEFAULT 'Create',
    ALTER COLUMN status SET DEFAULT 'Submit',
    ALTER COLUMN assigned_to SET DEFAULT 'Approval 1',
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at SET DEFAULT NOW();

UPDATE public.mat_single_request
SET ticket_type = COALESCE(ticket_type, 'Create'),
    status = COALESCE(status, 'Submit'),
    assigned_to = COALESCE(assigned_to, 'Approval 1'),
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW());

ALTER TABLE public.mat_single_request
    ALTER COLUMN request_no SET NOT NULL,
    ALTER COLUMN ticket_type SET NOT NULL,
    ALTER COLUMN material_group_code SET NOT NULL,
    ALTER COLUMN material_description SET NOT NULL,
    ALTER COLUMN base_uom SET NOT NULL,
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN assigned_to SET NOT NULL,
    ALTER COLUMN created_by SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_mat_single_request_no'
            AND conrelid = 'public.mat_single_request'::regclass
    ) THEN
        ALTER TABLE public.mat_single_request
            ADD CONSTRAINT uq_mat_single_request_no UNIQUE (request_no);
    END IF;

    IF to_regclass('public.mat_item_sub_group') IS NOT NULL
        AND NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'fk_mat_single_request_sub_group'
                AND conrelid = 'public.mat_single_request'::regclass
        )
    THEN
        ALTER TABLE public.mat_single_request
            ADD CONSTRAINT fk_mat_single_request_sub_group
            FOREIGN KEY (material_sub_group_id)
            REFERENCES public.mat_item_sub_group(id);
    END IF;
END $$;

COMMENT ON COLUMN public.mat_single_request.material_code IS
    'Final material code assigned by Master Data when the request is completed.';

CREATE INDEX IF NOT EXISTS idx_mat_single_request_status
    ON public.mat_single_request(status);

CREATE INDEX IF NOT EXISTS idx_mat_single_request_created_by
    ON public.mat_single_request(created_by);

CREATE INDEX IF NOT EXISTS idx_mat_single_request_group
    ON public.mat_single_request(material_group_code);

CREATE INDEX IF NOT EXISTS idx_mat_single_request_sub_group
    ON public.mat_single_request(material_sub_group_id);

CREATE TABLE IF NOT EXISTS public.mat_single_request_attachment (
    id bigserial PRIMARY KEY,
    request_id bigint NOT NULL,
    file_name varchar(255) NOT NULL,
    file_path varchar(500) NOT NULL,
    file_type varchar(100) NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_mat_single_request_attachment_request'
            AND conrelid = 'public.mat_single_request_attachment'::regclass
    ) THEN
        ALTER TABLE public.mat_single_request_attachment
            ADD CONSTRAINT fk_mat_single_request_attachment_request
            FOREIGN KEY (request_id)
            REFERENCES public.mat_single_request(id)
            ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mat_single_request_attachment_request_id
    ON public.mat_single_request_attachment(request_id);

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
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.mat_single_request_approval
    ADD COLUMN IF NOT EXISTS request_id bigint NULL,
    ADD COLUMN IF NOT EXISTS requester_user_id varchar(100) NULL,
    ADD COLUMN IF NOT EXISTS approval_1_user_id varchar(100) NULL,
    ADD COLUMN IF NOT EXISTS approval_1_at timestamptz NULL,
    ADD COLUMN IF NOT EXISTS approval_1_status varchar(20) NULL DEFAULT 'WAITING',
    ADD COLUMN IF NOT EXISTS approval_1_remark text NULL,
    ADD COLUMN IF NOT EXISTS approval_2_user_id varchar(100) NULL,
    ADD COLUMN IF NOT EXISTS approval_2_at timestamptz NULL,
    ADD COLUMN IF NOT EXISTS approval_2_status varchar(20) NULL,
    ADD COLUMN IF NOT EXISTS approval_2_remark text NULL,
    ADD COLUMN IF NOT EXISTS approval_3_user_id varchar(100) NULL,
    ADD COLUMN IF NOT EXISTS approval_3_at timestamptz NULL,
    ADD COLUMN IF NOT EXISTS approval_3_status varchar(20) NULL,
    ADD COLUMN IF NOT EXISTS approval_3_remark text NULL,
    ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT NOW();

ALTER TABLE public.mat_single_request_approval
    ALTER COLUMN approval_1_status SET DEFAULT 'WAITING',
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at SET DEFAULT NOW();

INSERT INTO public.mat_single_request_approval (
    request_id,
    requester_user_id,
    approval_1_status,
    created_at,
    updated_at
)
SELECT
    r.id,
    r.created_by,
    'WAITING',
    NOW(),
    NOW()
FROM public.mat_single_request r
WHERE r.created_by IS NOT NULL
    AND NOT EXISTS (
        SELECT 1
        FROM public.mat_single_request_approval a
        WHERE a.request_id = r.id
    );

UPDATE public.mat_single_request_approval
SET approval_1_status = COALESCE(approval_1_status, 'WAITING'),
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW());

ALTER TABLE public.mat_single_request_approval
    ALTER COLUMN request_id SET NOT NULL,
    ALTER COLUMN requester_user_id SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_mat_single_request_approval_request'
            AND conrelid = 'public.mat_single_request_approval'::regclass
    ) THEN
        ALTER TABLE public.mat_single_request_approval
            ADD CONSTRAINT uq_mat_single_request_approval_request UNIQUE (request_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_mat_single_request_approval_request'
            AND conrelid = 'public.mat_single_request_approval'::regclass
    ) THEN
        ALTER TABLE public.mat_single_request_approval
            ADD CONSTRAINT fk_mat_single_request_approval_request
            FOREIGN KEY (request_id)
            REFERENCES public.mat_single_request(id)
            ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_mat_single_request_approval_1_status'
            AND conrelid = 'public.mat_single_request_approval'::regclass
    ) THEN
        ALTER TABLE public.mat_single_request_approval
            ADD CONSTRAINT chk_mat_single_request_approval_1_status
            CHECK (
                approval_1_status IS NULL
                OR approval_1_status IN ('WAITING', 'APPROVED', 'REWORK', 'REJECTED')
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_mat_single_request_approval_2_status'
            AND conrelid = 'public.mat_single_request_approval'::regclass
    ) THEN
        ALTER TABLE public.mat_single_request_approval
            ADD CONSTRAINT chk_mat_single_request_approval_2_status
            CHECK (
                approval_2_status IS NULL
                OR approval_2_status IN ('WAITING', 'APPROVED', 'REWORK', 'REJECTED')
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_mat_single_request_approval_3_status'
            AND conrelid = 'public.mat_single_request_approval'::regclass
    ) THEN
        ALTER TABLE public.mat_single_request_approval
            ADD CONSTRAINT chk_mat_single_request_approval_3_status
            CHECK (
                approval_3_status IS NULL
                OR approval_3_status IN ('WAITING', 'APPROVED', 'REWORK', 'REJECTED')
            );
    END IF;
END $$;

COMMENT ON TABLE public.mat_single_request_approval IS
    'Current approval snapshot for material single requests, one row per request.';

COMMENT ON COLUMN public.mat_single_request_approval.request_id IS
    'References the specific material request being approved.';

COMMENT ON COLUMN public.mat_single_request_approval.requester_user_id IS
    'User ID from mst_user.user_id who created the material request. Mirrors mat_single_request.created_by for direct filtering.';

COMMENT ON COLUMN public.mat_single_request_approval.approval_3_user_id IS
    'Random active user from MDM_MATERIAL group after Approval 1 and Approval 2 are approved.';

CREATE INDEX IF NOT EXISTS idx_mat_single_request_approval_request_id
    ON public.mat_single_request_approval(request_id);

CREATE INDEX IF NOT EXISTS idx_mat_single_request_approval_requester_user_id
    ON public.mat_single_request_approval(requester_user_id);

CREATE INDEX IF NOT EXISTS idx_mat_single_request_approval_3_user_id
    ON public.mat_single_request_approval(approval_3_user_id);

COMMIT;

SELECT
    to_regclass('public.mat_single_request') AS mat_single_request,
    to_regclass('public.mat_single_request_attachment') AS mat_single_request_attachment,
    to_regclass('public.mat_single_request_approval') AS mat_single_request_approval;
