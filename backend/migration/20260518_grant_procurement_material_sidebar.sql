-- Grant Material sidebar access to the user group used by user1 and user2.
-- Important:
-- - mst_page_access.page_id must use mst_page.menu_id, not mst_page.id.
-- - Sidebar renders only rows where fread = true.
-- - My Approval is a synthetic Materials child generated from Approval (menu_id 5).

UPDATE public.mst_page
SET url_link = '/dashboard/materials/request'
WHERE menu_id = 73
    AND page = 'Request Material'
    AND url_link IS DISTINCT FROM '/dashboard/materials/request';

INSERT INTO public.mst_page_access (
    fcreate,
    fread,
    fupdate,
    fdelete,
    user_group_name,
    page_id,
    created_at,
    created_by,
    user_group_id
)
SELECT
    false,
    true,
    false,
    false,
    'PROCUREMENT',
    5,
    CURRENT_DATE,
    'system',
    u.user_group
FROM public.mst_user u
WHERE lower(u.username) IN ('user1', 'user2')
    AND u.user_group IS NOT NULL
    AND NOT EXISTS (
        SELECT 1
        FROM public.mst_page_access existing
        WHERE existing.user_group_id = u.user_group
            AND existing.page_id = 5
    )
GROUP BY u.user_group;

INSERT INTO public.mst_page_access (
    fcreate,
    fread,
    fupdate,
    fdelete,
    user_group_name,
    page_id,
    created_at,
    created_by,
    user_group_id
)
SELECT
    false,
    true,
    false,
    false,
    'PROCUREMENT',
    7,
    CURRENT_DATE,
    'system',
    u.user_group
FROM public.mst_user u
WHERE lower(u.username) IN ('user1', 'user2')
    AND u.user_group IS NOT NULL
    AND NOT EXISTS (
        SELECT 1
        FROM public.mst_page_access existing
        WHERE existing.user_group_id = u.user_group
            AND existing.page_id = 7
    )
GROUP BY u.user_group;

INSERT INTO public.mst_page_access (
    fcreate,
    fread,
    fupdate,
    fdelete,
    user_group_name,
    page_id,
    created_at,
    created_by,
    user_group_id
)
SELECT
    false,
    true,
    false,
    false,
    'PROCUREMENT',
    71,
    CURRENT_DATE,
    'system',
    u.user_group
FROM public.mst_user u
WHERE lower(u.username) IN ('user1', 'user2')
    AND u.user_group IS NOT NULL
    AND NOT EXISTS (
        SELECT 1
        FROM public.mst_page_access existing
        WHERE existing.user_group_id = u.user_group
            AND existing.page_id = 71
    )
GROUP BY u.user_group;

INSERT INTO public.mst_page_access (
    fcreate,
    fread,
    fupdate,
    fdelete,
    user_group_name,
    page_id,
    created_at,
    created_by,
    user_group_id
)
SELECT
    false,
    true,
    false,
    false,
    'PROCUREMENT',
    72,
    CURRENT_DATE,
    'system',
    u.user_group
FROM public.mst_user u
WHERE lower(u.username) IN ('user1', 'user2')
    AND u.user_group IS NOT NULL
    AND NOT EXISTS (
        SELECT 1
        FROM public.mst_page_access existing
        WHERE existing.user_group_id = u.user_group
            AND existing.page_id = 72
    )
GROUP BY u.user_group;

INSERT INTO public.mst_page_access (
    fcreate,
    fread,
    fupdate,
    fdelete,
    user_group_name,
    page_id,
    created_at,
    created_by,
    user_group_id
)
SELECT
    true,
    true,
    false,
    false,
    'PROCUREMENT',
    73,
    CURRENT_DATE,
    'system',
    u.user_group
FROM public.mst_user u
WHERE lower(u.username) IN ('user1', 'user2')
    AND u.user_group IS NOT NULL
    AND NOT EXISTS (
        SELECT 1
        FROM public.mst_page_access existing
        WHERE existing.user_group_id = u.user_group
            AND existing.page_id = 73
    )
GROUP BY u.user_group;
