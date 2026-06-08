const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildMaterialSidebarMenu,
  buildMaterialSidebarPermission,
} = require("../helper/materialSidebarMenu");

test("buildMaterialSidebarMenu moves My Approval and Administrator under Materials", () => {
  const menu = {
    ticket: { key: "1", text: "Ticket", children: [] },
    approval: {
      key: "2",
      text: "My Approval",
      icon: "Approval",
      children: [{ key: "21", text: "Approval Inbox", url: "/dashboard/approval" }],
    },
    materials: {
      key: "3",
      text: "Materials",
      icon: "Inventory2",
      children: [
        { key: "31", text: "Material Search", url: "/dashboard/materials/search" },
        { key: "32", text: "Request Material", url: "/dashboard/materials/request" },
      ],
    },
  };

  const nextMenu = buildMaterialSidebarMenu(menu);

  assert.deepEqual(Object.values(nextMenu).map(item => item.text), ["Ticket", "Materials"]);
  assert.deepEqual(
    nextMenu.materials.children.map(item => item.text),
    ["Material Search", "Request Material", "My Approval", "Administrator"]
  );
  assert.equal(nextMenu.materials.children[2].url, "/dashboard/materials/approval");
  assert.equal(nextMenu.materials.children[3].url, "/dashboard/materials/administrator");
});

test("buildMaterialSidebarPermission exposes My Approval from Approval access", () => {
  const permission = {
    "My Approval": { create: false, read: true, update: true, delete: false },
    Materials: { create: false, read: true, update: false, delete: false },
  };

  const nextPermission = buildMaterialSidebarPermission(permission, "user1");

  assert.deepEqual(nextPermission["My Approval"], permission["My Approval"]);
  assert.equal(nextPermission.Administrator, undefined);
  assert.deepEqual(nextPermission.Materials, {
    create: false,
    read: true,
    update: false,
    delete: false,
  });
});

test("buildMaterialSidebarPermission exposes Administrator only for admin username", () => {
  const permission = {
    "My Approval": { create: false, read: true, update: true, delete: false },
    Materials: { create: false, read: true, update: false, delete: false },
  };

  const nextPermission = buildMaterialSidebarPermission(permission, "ADMIN");

  assert.deepEqual(nextPermission["My Approval"], permission["My Approval"]);
  assert.deepEqual(nextPermission.Administrator, permission["My Approval"]);
});
