-- Auto-complete legacy single-request Approval 3 rows after Approval 2.
-- Business rule: once Approval 1 and Approval 2 are approved, Approval 3
-- must be filled automatically by system using an active MDM_MATERIAL user.

WITH legacy_targets AS (
    SELECT
        a.request_id,
        COALESCE(
            a.approval_3_user_id,
            mdm_user.user_id
        ) AS approval_3_user_id
    FROM public.mat_single_request_approval a
    LEFT JOIN LATERAL (
        SELECT mu.user_id
        FROM public.mst_user mu
        JOIN public.mst_page_access mpa
            ON mpa.user_group_id = mu.user_group
        WHERE mpa.user_group_name = 'MDM_MATERIAL'
            AND mu.is_active = true
        ORDER BY random()
        LIMIT 1
    ) AS mdm_user ON true
    WHERE a.approval_1_status = 'APPROVED'
        AND a.approval_2_status = 'APPROVED'
        AND (a.approval_3_status IS NULL OR a.approval_3_status = 'WAITING')
        AND COALESCE(a.approval_3_user_id, mdm_user.user_id) IS NOT NULL
)
UPDATE public.mat_single_request_approval AS approval
SET approval_3_user_id = legacy.approval_3_user_id,
    approval_3_at = COALESCE(
        approval.approval_3_at,
        approval.approval_2_at,
        approval.updated_at,
        NOW()
    ),
    approval_3_status = 'APPROVED',
    updated_at = NOW()
FROM legacy_targets AS legacy
WHERE approval.request_id = legacy.request_id;

UPDATE public.mat_single_request AS request
SET assigned_to = 'Completed',
    updated_at = NOW()
FROM public.mat_single_request_approval AS approval
WHERE request.id = approval.request_id
    AND approval.approval_1_status = 'APPROVED'
    AND approval.approval_2_status = 'APPROVED'
    AND approval.approval_3_status = 'APPROVED'
    AND request.assigned_to = 'Approval 3';
