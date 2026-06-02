ALTER TABLE mat_single_request
ADD COLUMN IF NOT EXISTS change_extend_reason TEXT NULL;

COMMENT ON COLUMN mat_single_request.change_extend_reason IS
'Requester reason captured for Change and Extend ticket types.';
