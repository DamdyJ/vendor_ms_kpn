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
                <td style="padding: 8px; border: 1px solid #ccc;">${edit.material_code}</td>
                <td style="padding: 8px; border: 1px solid #ccc;">${edit.material_name || ""}</td>
                <td style="padding: 8px; border: 1px solid #ccc;">${editType}</td>
                <td style="padding: 8px; border: 1px solid #ccc;">${editContent}</td>
                <td style="padding: 8px; border: 1px solid #ccc;">${edit.edited_by || "Unknown"}</td>
                <td style="padding: 8px; border: 1px solid #ccc;">${new Date(edit.created_at).toLocaleString("en-GB", { timeZone: "Asia/Jakarta" })}</td>
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
            <p><small>Generated: ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Jakarta" })} (Asia/Jakarta)</small></p>
        </body>
        </html>`;
    },
};

module.exports = MaterialEmail;
