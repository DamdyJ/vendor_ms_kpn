BEGIN;

ALTER TABLE public.mat_single_request
    ADD COLUMN IF NOT EXISTS final_code varchar(11) NULL;

COMMENT ON COLUMN public.mat_single_request.final_code IS
'Final material code composed at Approval 3 from mat_item_group.code, mat_item_sub_group.code, and user-entered 3-digit suffix.';

COMMIT;
