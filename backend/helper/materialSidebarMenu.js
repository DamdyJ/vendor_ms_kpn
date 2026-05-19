const APPROVAL_MENU_TEXT = "Approval";
const ADMIN_MENU_TEXT = "Administrator";
const MATERIALS_MENU_TEXT = "Materials";
const REQUEST_MATERIAL_TEXT = "Request Material";
const MY_APPROVAL_TEXT = "My Approval";
const MY_APPROVAL_ROUTE = "/dashboard/materials/approval";
const MATERIAL_ADMIN_ROUTE = "/dashboard/materials/administrator";

const MATERIAL_APPROVAL_CHILD = {
    key: "materials-approval-view",
    text: MY_APPROVAL_TEXT,
    url: MY_APPROVAL_ROUTE,
    access: [false, true, false, false],
};

const MATERIAL_ADMIN_CHILD = {
    key: "materials-administrator-view",
    text: ADMIN_MENU_TEXT,
    url: MATERIAL_ADMIN_ROUTE,
    access: [false, true, false, false],
};

const ADMIN_APPROVER_USERNAME = "admin";

const normalizeUsername = username =>
    String(username || "")
        .trim()
        .toLowerCase();

const createMaterialsMenu = () => ({
    key: "materials-sidebar",
    text: MATERIALS_MENU_TEXT,
    icon: "Inventory2",
    access: [false, true, false, false],
    children: [MATERIAL_APPROVAL_CHILD, MATERIAL_ADMIN_CHILD],
});

const insertMaterialApprovalChildren = item => {
    const nextChildren = Array.isArray(item?.children)
        ? item.children.filter(
              child =>
                  child?.text !== MY_APPROVAL_TEXT &&
                  child?.text !== ADMIN_MENU_TEXT
          )
        : [];
    const requestMaterialIndex = nextChildren.findIndex(
        child => child?.text === REQUEST_MATERIAL_TEXT
    );

    if (requestMaterialIndex >= 0) {
        nextChildren.splice(
            requestMaterialIndex + 1,
            0,
            MATERIAL_APPROVAL_CHILD,
            MATERIAL_ADMIN_CHILD
        );
    } else {
        nextChildren.push(MATERIAL_APPROVAL_CHILD, MATERIAL_ADMIN_CHILD);
    }

    return {
        ...item,
        children: nextChildren,
    };
};

const buildMaterialSidebarMenu = (menu = {}) => {
    const entries = Object.entries(menu);
    const nextEntries = [];
    let materialsFound = false;

    entries.forEach(([key, item]) => {
        if (
            item?.text === APPROVAL_MENU_TEXT ||
            item?.text === ADMIN_MENU_TEXT
        ) {
            return;
        }

        if (item?.text === MATERIALS_MENU_TEXT) {
            nextEntries.push([key, insertMaterialApprovalChildren(item)]);
            materialsFound = true;
            return;
        }

        nextEntries.push([key, item]);
    });

    if (!materialsFound) {
        nextEntries.push(["materials-sidebar", createMaterialsMenu()]);
    }

    return Object.fromEntries(nextEntries);
};

const buildMaterialSidebarPermission = (permission = {}, username) => {
    const approvalPermission = permission?.[APPROVAL_MENU_TEXT];

    if (!approvalPermission?.read) {
        return permission;
    }

    return {
        ...permission,
        [MATERIALS_MENU_TEXT]: {
            ...permission?.[MATERIALS_MENU_TEXT],
            read: true,
            create:
                permission?.[MATERIALS_MENU_TEXT]?.create ??
                approvalPermission.create ??
                false,
            update:
                permission?.[MATERIALS_MENU_TEXT]?.update ??
                approvalPermission.update ??
                false,
            delete:
                permission?.[MATERIALS_MENU_TEXT]?.delete ??
                approvalPermission.delete ??
                false,
        },
        [MY_APPROVAL_TEXT]: { ...approvalPermission },
        ...(normalizeUsername(username) === ADMIN_APPROVER_USERNAME
            ? { [ADMIN_MENU_TEXT]: { ...approvalPermission } }
            : {}),
    };
};

module.exports = {
    buildMaterialSidebarMenu,
    buildMaterialSidebarPermission,
};
