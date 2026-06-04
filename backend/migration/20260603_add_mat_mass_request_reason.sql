ALTER TABLE mat_mass_request
ADD COLUMN IF NOT EXISTS mass_request_reason TEXT NULL;

COMMENT ON COLUMN mat_mass_request.mass_request_reason IS
'Requester reason captured when submitting a mass material request batch.';
