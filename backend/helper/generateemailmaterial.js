const MaterialEmail = {
    materialEditNotification: (materialEdits, timeWindow, hostname) => {
        // Build simple table rows for material edits
        const materialRows = materialEdits
            .map(edit => {
                // Determine edit type and content
                let editType, editContent;
                if (edit.attachment_path) {
                    editType = "Attachment";
                    editContent = `<a href="${hostname}/static/${edit.attachment_path}" target="_blank">View File</a>`;
                } else if (edit.edited_alias) {
                    editType = "Alias";
                    editContent = edit.edited_alias;
                } else {
                    editType = "Unknown";
                    editContent = "N/A";
                }

                return `
            <tr>
                <td style="padding: 8px; border: 1px solid #ccc;">${
                    edit.material_code
                }</td>
                <td style="padding: 8px; border: 1px solid #ccc;">${
                    edit.material_name || ""
                }</td>
                <td style="padding: 8px; border: 1px solid #ccc;">${editType}</td>
                <td style="padding: 8px; border: 1px solid #ccc;">${editContent}</td>
                <td style="padding: 8px; border: 1px solid #ccc;">${
                    edit.edited_by || "Unknown"
                }</td>
                <td style="padding: 8px; border: 1px solid #ccc;">${new Date(
                    edit.created_at
                ).toLocaleString("en-GB", { timeZone: "Asia/Jakarta" })}</td>
            </tr>`;
            })
            .join("");

        return `
        <html>
        <body style="font-family: Arial, sans-serif; margin: 20px;">
            <h3>Material Updates - ${timeWindow}</h3>
            <p>The following materials have been edited and need review:</p>

            <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
                <thead>
                    <tr style="background-color: #f0f0f0;">
                        <th style="padding: 10px; border: 1px solid #ccc;">Material Code</th>
                        <th style="padding: 10px; border: 1px solid #ccc;">Material Name</th>
                        <th style="padding: 10px; border: 1px solid #ccc;">Edit Type</th>
                        <th style="padding: 10px; border: 1px solid #ccc;">Content</th>
                        <th style="padding: 10px; border: 1px solid #ccc;">Edited By</th>
                        <th style="padding: 10px; border: 1px solid #ccc;">Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${materialRows}
                </tbody>
            </table>

            <p>Total materials: ${materialEdits.length}</p>
            <p><small>Generated: ${new Date().toLocaleString("en-GB", {
                timeZone: "Asia/Jakarta",
            })} (Asia/Jakarta)</small></p>
        </body>
        </html>`;
    },

    materialApprovalNotification: (material) => {
        return `
        <html>
        <body style="font-family: Arial, sans-serif; margin: 20px;">
            <h3 style="color: #4caf50;">Material Request Approved</h3>
            <p>Your material request has been approved by the system and is now available for use.</p>

            <table style="border-collapse: collapse; width: 100%; margin: 20px 0; border: 1px solid #ddd;">
                <tr>
                    <td style="padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9; font-weight: bold; width: 30%;">Material Code</td>
                    <td style="padding: 10px; border: 1px solid #ccc;">${material.code}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9; font-weight: bold;">Material Name</td>
                    <td style="padding: 10px; border: 1px solid #ccc;">${material.name || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9; font-weight: bold;">Description</td>
                    <td style="padding: 10px; border: 1px solid #ccc;">${material.description || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9; font-weight: bold;">Unit of Measurement</td>
                    <td style="padding: 10px; border: 1px solid #ccc;">${material.unit_of_measurement || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9; font-weight: bold;">Group</td>
                    <td style="padding: 10px; border: 1px solid #ccc;">${material.group_name || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9; font-weight: bold;">Sub Group</td>
                    <td style="padding: 10px; border: 1px solid #ccc;">${material.sub_group_name || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9; font-weight: bold;">Approved At</td>
                    <td style="padding: 10px; border: 1px solid #ccc;">${new Date().toLocaleString("en-GB", {
                        timeZone: "Asia/Jakarta",
                    })} (Asia/Jakarta)</td>
                </tr>
            </table>

            <p style="color: #4caf50; font-weight: bold;">✓ Your material is now available for use in the system.</p>
            
            <p><small>Generated: ${new Date().toLocaleString("en-GB", {
                timeZone: "Asia/Jakarta",
            })} (Asia/Jakarta)</small></p>
        </body>
        </html>`;
    },

    materialRejectionNotification: (material, rejectionReason) => {
        return `
        <html>
        <body style="font-family: Arial, sans-serif; margin: 20px;">
            <h3 style="color: #f44336;">Material Request Rejected</h3>
            <p>Your material request has been rejected by the system. Please see the details below.</p>

            <table style="border-collapse: collapse; width: 100%; margin: 20px 0; border: 1px solid #ddd;">
                <tr>
                    <td style="padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9; font-weight: bold; width: 30%;">Material Code</td>
                    <td style="padding: 10px; border: 1px solid #ccc;">${material.code}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9; font-weight: bold;">Material Name</td>
                    <td style="padding: 10px; border: 1px solid #ccc;">${material.name || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9; font-weight: bold;">Description</td>
                    <td style="padding: 10px; border: 1px solid #ccc;">${material.description || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9; font-weight: bold;">Unit of Measurement</td>
                    <td style="padding: 10px; border: 1px solid #ccc;">${material.unit_of_measurement || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9; font-weight: bold;">Group</td>
                    <td style="padding: 10px; border: 1px solid #ccc;">${material.group_name || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9; font-weight: bold;">Sub Group</td>
                    <td style="padding: 10px; border: 1px solid #ccc;">${material.sub_group_name || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9; font-weight: bold;">Rejected At</td>
                    <td style="padding: 10px; border: 1px solid #ccc;">${new Date().toLocaleString("en-GB", {
                        timeZone: "Asia/Jakarta",
                    })} (Asia/Jakarta)</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ccc; background-color: #ffebee; font-weight: bold;">Rejection Reason</td>
                    <td style="padding: 10px; border: 1px solid #ccc; background-color: #ffebee;">${rejectionReason}</td>
                </tr>
            </table>

            <p style="color: #f44336; font-weight: bold;">✗ Please review the rejection reason and submit a new request if needed.</p>
            
            <p><small>Generated: ${new Date().toLocaleString("en-GB", {
                timeZone: "Asia/Jakarta",
            })} (Asia/Jakarta)</small></p>
        </body>
        </html>`;
    },
};

module.exports = MaterialEmail;
