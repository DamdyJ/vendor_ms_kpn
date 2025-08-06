const express = require("express");
const router = express.Router();
const MaterialController = require("../controllers/MaterialController");
const AuthToken = require("../middleware/tokenmanager");
// Get all material groups
router.get("/groups", MaterialController.getMaterialGroups);

// Get all material groups for dropdown (no pagination)
router.get("/groups/dropdown", MaterialController.getAllMaterialGroups);

// Material request endpoints
router.post(
    "/request",
    AuthToken.authSession,
    MaterialController.submitMaterialRequest
);

// Material approval workflow endpoints
router.get(
    "/pending",
    AuthToken.authSession,
    MaterialController.getPendingMaterials
);
router.get(
    "/pending/:materialId",
    AuthToken.authSession,
    MaterialController.getPendingMaterialById
);
router.post(
    "/approve/:materialId",
    AuthToken.authSession,
    MaterialController.approveMaterial
);
router.post(
    "/reject/:materialId",
    AuthToken.authSession,
    MaterialController.rejectMaterial
);
router.put(
    "/pending/:materialId",
    AuthToken.authSession,
    MaterialController.updatePendingMaterial
);

// Get attachments for materials by array of codes
router.post("/by-codes", MaterialController.getAttachmentsByCodes);

// Get all subgroups for a group for dropdown (no pagination)
router.get(
    "/subgroups/:groupId/dropdown",
    MaterialController.getAllSubgroupsByGroup
);

// CRUD operations for material groups
router.post(
    "/groups",
    AuthToken.authSession,
    MaterialController.createMaterialGroup
);
router.put(
    "/groups/:groupId",
    AuthToken.authSession,
    MaterialController.updateMaterialGroup
);
router.delete(
    "/groups/:groupId",
    AuthToken.authSession,
    MaterialController.deleteMaterialGroup
);

// Get subgroups by group ID
router.get(
    "/groups/:groupId/subgroups",
    MaterialController.getMaterialSubGroups
);

// CRUD operations for material subgroups
router.post(
    "/subgroups",
    AuthToken.authSession,
    MaterialController.createMaterialSubGroup
);
router.put(
    "/subgroups/:subGroupId",
    AuthToken.authSession,
    MaterialController.updateMaterialSubGroup
);
router.delete(
    "/subgroups/:subGroupId",
    AuthToken.authSession,
    MaterialController.deleteMaterialSubGroup
);

// Excel import/export routes for groups
router.post(
    "/groups/import",
    AuthToken.authSession,
    MaterialController.importOnlyGroupsFromExcel
);
router.get(
    "/groups/export/only",
    AuthToken.authSession,
    MaterialController.exportOnlyGroupsToExcel
);

// Excel import/export routes for subgroups
router.post(
    "/subgroups/import",
    AuthToken.authSession,
    MaterialController.importOnlySubgroupsFromExcel
);
router.get(
    "/subgroups/export/:groupId",
    AuthToken.authSession,
    MaterialController.exportOnlySubgroupsToExcel
);

// Get materials by group ID
router.get(
    "/groups/:groupId/materials",
    MaterialController.getMaterialsByGroup
);

// Get materials by subgroup ID
router.get(
    "/subgroups/:subGroupId/materials",
    MaterialController.getMaterialsBySubGroup
);

// Search materials (query parameter: ?q=searchTerm)
router.get("/search", MaterialController.searchMaterials);

// Search all materials (including deleted)
router.get("/search/all", MaterialController.searchAllMaterials);

// Get attachments by material ID
router.get(
    "/:materialId/attachments",
    MaterialController.getMaterialAttachments
);

// Upload attachment for a material
router.post(
    "/:materialId/attachments",
    AuthToken.authSession,
    MaterialController.uploadAttachment
);

// Delete attachment
router.delete(
    "/attachments/:attachmentId",
    AuthToken.authSession,
    MaterialController.deleteAttachment
);

// Update material aliases
router.put(
    "/:materialId/aliases",
    AuthToken.authSession,
    MaterialController.updateAliases
);

// Serve attachment file
router.get("/file/:filename", MaterialController.serveFile);

// SAP data synchronization endpoint
router.get("/sync-sap", AuthToken.authSession, MaterialController.syncSAPData);

// Export materials to Excel (filtered by group/subgroup)
router.get(
    "/export/materials",
    AuthToken.authSession,
    MaterialController.exportMaterialsToExcel
);

// Get material by ID with full details and attachments
router.get("/:materialId", MaterialController.getMaterialById);

// Soft delete a material
router.delete(
    "/:materialId",
    AuthToken.authSession,
    MaterialController.deleteMaterial
);

module.exports = router;
