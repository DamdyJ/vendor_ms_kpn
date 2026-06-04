const {
    resolveSingleRequestApprovalStage,
    isRequestStatusVisibleInApprovalList,
    isAdminMaterialApprover,
    getApprovalStageFieldPrefix,
    assertRequiredActionReason,
    INITIAL_APPROVAL_STATUS,
} = require("./singleRequestApproval");

const SQL_NOW_EXPRESSION = Object.freeze({ __sql: "NOW()" });

const matchesActorUserId = (assigneeUserId, actorUserId) =>
    assigneeUserId != null &&
    actorUserId != null &&
    String(assigneeUserId) === String(actorUserId);

/**
 * Convert a mass-request inbox row (with first_item_* fields) to the shape
 * that resolveSingleRequestApprovalStage / canActorApproveSingleRequestStage
 * expects — i.e. approval_N_user_id, approval_N_status fields directly.
 *
 * All items in a mass batch share the same approval chain, so reading from
 * the first item's fields is correct.
 */
const mapMassRowToApprovalShape = (row = {}) => {
    const approval = { ...row };
    approval.approval_1_user_id = row.first_item_approval_1_user_id;
    approval.approval_1_status = row.first_item_approval_1_status;
    approval.approval_2_user_id = row.first_item_approval_2_user_id;
    approval.approval_2_status = row.first_item_approval_2_status;
    approval.approval_3_user_id = row.first_item_approval_3_user_id;
    approval.approval_3_status = row.first_item_approval_3_status;
    approval.status = row.first_item_status;

    // Mass requests always use "Create" ticket type
    approval.ticket_type = "Create";
    approval.ticketType = "Create";

    return approval;
};

/**
 * Resolve the active approval stage for a mass request batch.
 *
 * Delegates to the single-request stage resolver after mapping
 * first_item_* fields → approval_N_* fields.
 *
 * @param {object} row - Mass request inbox row with first_item_* fields.
 * @returns {string|null} "Approval 1", "Approval 2", "Approval 3", or null.
 */
const resolveMassRequestApprovalStage = (row = {}) => {
    return resolveSingleRequestApprovalStage(mapMassRowToApprovalShape(row));
};

/**
 * Check whether a mass request is eligible to appear in the approval inbox.
 *
 * A request is eligible when:
 * - It has an active approval stage (waiting for someone to act), OR
 * - Its status is a visible terminal/transitional status
 *   (SUBMIT, REWORK, REJECT, REJECTED, CANCEL, DONE).
 *
 * @param {object} row - Mass request inbox row with first_item_* fields.
 * @returns {boolean}
 */
const isMassRequestApprovalInboxEligible = (row = {}) => {
    const approval = mapMassRowToApprovalShape(row);
    return (
        Boolean(resolveSingleRequestApprovalStage(approval)) ||
        isRequestStatusVisibleInApprovalList(approval.status)
    );
};

/**
 * Filter mass request inbox rows for a given actor.
 *
 * - ADMIN sees everything.
 * - Non-admin: only rows where the actor is assigned to the active
 *   approval stage, or where they were the approver on a rejected stage.
 *
 * @param {object[]} rows - Mass request inbox rows.
 * @param {object} opts
 * @param {string|null} opts.actorUserId
 * @param {string|null} opts.actorUsername
 * @returns {object[]} Filtered rows.
 */
const filterMassRequestApprovalInboxRows = (
    rows = [],
    { actorUserId, actorUsername } = {}
) => {
    const isAdmin = isAdminMaterialApprover(actorUsername);

    return rows.filter(row => {
        if (!isMassRequestApprovalInboxEligible(row)) {
            return false;
        }

        if (isAdmin) {
            return true;
        }

        const approval = mapMassRowToApprovalShape(row);
        const stage = resolveSingleRequestApprovalStage(approval);

        if (stage === "Approval 1") {
            return matchesActorUserId(
                approval.approval_1_user_id,
                actorUserId
            );
        }

        if (stage === "Approval 2") {
            return matchesActorUserId(
                approval.approval_2_user_id,
                actorUserId
            );
        }

        if (stage === "Approval 3") {
            return matchesActorUserId(
                approval.approval_3_user_id,
                actorUserId
            );
        }

        // Show rejected rows where this actor was the rejecting approver
        if (
            [1, 2, 3].some(step => {
                const statusField = `first_item_approval_${step}_status`;
                const userIdField = `first_item_approval_${step}_user_id`;
                return (
                    String(row[statusField] || "").trim().toUpperCase() ===
                        "REJECTED" &&
                    matchesActorUserId(row[userIdField], actorUserId)
                );
            })
        ) {
            return true;
        }

        return false;
    });
};

/**
 * Check whether the actor can approve the current stage of a mass request.
 *
 * @param {object} opts
 * @param {object} opts.row - Mass request inbox row with first_item_* fields.
 * @param {string|null} opts.actorUserId
 * @param {string|null} opts.actorUsername
 * @returns {boolean}
 */
const canActorApproveMassRequestStage = ({
    row = {},
    actorUserId,
    actorUsername,
} = {}) => {
    if (isAdminMaterialApprover(actorUsername)) {
        return true;
    }

    const approval = mapMassRowToApprovalShape(row);
    const stage = resolveSingleRequestApprovalStage(approval);

    if (stage === "Approval 1") {
        return matchesActorUserId(approval.approval_1_user_id, actorUserId);
    }

    if (stage === "Approval 2") {
        return matchesActorUserId(approval.approval_2_user_id, actorUserId);
    }

    if (stage === "Approval 3") {
        return matchesActorUserId(approval.approval_3_user_id, actorUserId);
    }

    return false;
};

/**
 * Build a patch object to apply to ALL items in a mass batch after approval.
 *
 * For mass requests, all items share the same approval chain stage.
 * The patch marks the current stage as APPROVED and advances status/assignment.
 *
 * Mass requests only use the "Create" ticket type, so after Approval 2
 * the batch is fully approved (DONE / Completed).
 *
 * @param {object} opts
 * @param {string} opts.activeStage - "Approval 1" or "Approval 2".
 * @param {string|null} opts.actorUserId
 * @param {string|null} opts.actorUsername
 * @param {string|null} opts.remark
 * @returns {object} Patch with fields to apply to each item row.
 */
const buildMassRequestApprovePatch = ({
    activeStage,
    actorUserId,
    actorUsername,
    remark,
} = {}) => {
    const fieldPrefix = getApprovalStageFieldPrefix(activeStage);
    const safeRemark = remark ?? null;

    let nextStatus;
    let nextAssignment;

    if (activeStage === "Approval 1") {
        nextStatus = "Submit";
        nextAssignment = "Approval 2";
    } else if (activeStage === "Approval 2") {
        nextStatus = "Submit";
        nextAssignment = "Approval 3";
    } else if (activeStage === "Approval 3") {
        nextStatus = "DONE";
        nextAssignment = "Completed";
    } else {
        throw new Error(`Unsupported approval stage: ${activeStage}`);
    }

    const patch = {
        [`${fieldPrefix}_status`]: "APPROVED",
        [`${fieldPrefix}_at`]: SQL_NOW_EXPRESSION,
        [`${fieldPrefix}_remark`]: safeRemark,
        status: nextStatus,
        assigned_to: nextAssignment,
    };

    // When transitioning from Approval 2 → 3, set Approval 3 status to WAITING
    // so it appears in the Approval 3 inbox.
    if (activeStage === "Approval 2") {
        patch.approval_3_status = INITIAL_APPROVAL_STATUS;
    }

    return patch;
};

/**
 * Build a patch object to apply to ALL items in a mass batch for rework request.
 *
 * @param {object} opts
 * @param {string} opts.activeStage - The stage requesting rework.
 * @param {string|null} opts.actorUserId
 * @param {string|null} opts.reason - Required for rework.
 * @returns {object}
 */
const buildMassRequestReworkPatch = ({
    activeStage,
    actorUserId,
    reason,
} = {}) => {
    const safeReason = assertRequiredActionReason(reason, "rework");
    const fieldPrefix = getApprovalStageFieldPrefix(activeStage);

    return {
        status: "Rework",
        assigned_to: "Requester",
        [`${fieldPrefix}_status`]: "REWORK",
        [`${fieldPrefix}_remark`]: safeReason,
        [`${fieldPrefix}_at`]: SQL_NOW_EXPRESSION,
    };
};

/**
 * Build a patch object to apply to ALL items in a mass batch for rejection.
 *
 * @param {object} opts
 * @param {string} opts.activeStage - The stage rejecting the request.
 * @param {string|null} opts.reason - Required for reject.
 * @returns {object}
 */
const buildMassRequestRejectPatch = ({
    activeStage,
    reason,
} = {}) => {
    const safeReason = assertRequiredActionReason(reason, "reject");
    const fieldPrefix = getApprovalStageFieldPrefix(activeStage);

    return {
        status: "CANCEL",
        assigned_to: "Cancelled",
        [`${fieldPrefix}_status`]: "REJECTED",
        [`${fieldPrefix}_at`]: SQL_NOW_EXPRESSION,
        [`${fieldPrefix}_remark`]: safeReason,
    };
};

/**
 * Update approval_1_user_id and/or approval_2_user_id on a single
 * in-flight mass-request item when the administrator retargets the
 * approver master.  Unlike the single-request path this does NOT
 * touch status, assigned_to, or approval_3 — the mass approve flow
 * already picks a fresh MDM_MATERIAL user at the Approval 2 → 3
 * transition and manages its own stage progression.
 */
const syncMassRequestItemApprovalSnapshot = async (
    client,
    itemId,
    patch = {}
) => {
    const setClauses = [];
    const params = [itemId];
    let paramIdx = 2;

    if (Object.prototype.hasOwnProperty.call(patch, "approval_1_user_id")) {
        setClauses.push(`approval_1_user_id = $${paramIdx}`);
        params.push(patch.approval_1_user_id ?? null);
        paramIdx++;
    }

    if (Object.prototype.hasOwnProperty.call(patch, "approval_2_user_id")) {
        setClauses.push(`approval_2_user_id = $${paramIdx}`);
        params.push(patch.approval_2_user_id ?? null);
        paramIdx++;
    }

    if (setClauses.length === 0) {
        return;
    }

    setClauses.push("updated_at = NOW()");

    await client.query(
        `UPDATE mat_mass_request_item
         SET ${setClauses.join(", ")}
         WHERE id = $1`,
        params
    );
};

module.exports = {
    resolveMassRequestApprovalStage,
    isMassRequestApprovalInboxEligible,
    filterMassRequestApprovalInboxRows,
    canActorApproveMassRequestStage,
    buildMassRequestApprovePatch,
    buildMassRequestReworkPatch,
    buildMassRequestRejectPatch,
    mapMassRowToApprovalShape,
    syncMassRequestItemApprovalSnapshot,
};
