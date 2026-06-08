BEGIN;

ALTER TABLE public.mat_single_request_approval
    ADD COLUMN IF NOT EXISTS approval_3_user_id varchar(100) NULL;

COMMIT;
