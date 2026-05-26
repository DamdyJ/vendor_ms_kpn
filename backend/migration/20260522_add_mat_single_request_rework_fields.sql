ALTER TABLE mat_single_request
    ADD COLUMN IF NOT EXISTS rework_stage VARCHAR(32),
    ADD COLUMN IF NOT EXISTS rework_by_user_id VARCHAR(64),
    ADD COLUMN IF NOT EXISTS rework_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS rework_reason TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'mat_single_request_rework_by_user_id_fkey'
    ) THEN
        ALTER TABLE mat_single_request
            ADD CONSTRAINT mat_single_request_rework_by_user_id_fkey
            FOREIGN KEY (rework_by_user_id)
            REFERENCES mst_user(user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_mat_single_request_rework_stage'
    ) THEN
        ALTER TABLE mat_single_request
            ADD CONSTRAINT chk_mat_single_request_rework_stage
            CHECK (
                rework_stage IS NULL OR
                rework_stage IN ('Approval 1', 'Approval 2', 'Approval 3')
            );
    END IF;
END $$;

COMMENT ON COLUMN mat_single_request.rework_stage IS
    'Latest approval stage that requested requester rework.';
COMMENT ON COLUMN mat_single_request.rework_by_user_id IS
    'User id of approver or ADMIN who requested latest rework.';
COMMENT ON COLUMN mat_single_request.rework_at IS
    'Timestamp when latest requester rework was requested.';
COMMENT ON COLUMN mat_single_request.rework_reason IS
    'Reason text for latest requester rework request.';

CREATE INDEX IF NOT EXISTS idx_mat_single_request_rework_by_user_id
    ON mat_single_request (rework_by_user_id);
