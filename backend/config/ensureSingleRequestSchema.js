const CHANGE_EXTEND_REASON_SQL = `
ALTER TABLE mat_single_request
ADD COLUMN IF NOT EXISTS change_extend_reason TEXT NULL;
`;

async function ensureSingleRequestSchema(db) {
    await db.query(CHANGE_EXTEND_REASON_SQL);
}

module.exports = {
    CHANGE_EXTEND_REASON_SQL,
    ensureSingleRequestSchema,
};
