const DBClientWrapper = require("../helper/DBClientWrapper");
const Exceljs = require("exceljs");

const ReportModel = {
    GenerateSummaryTicketPosition: async (bu_id, dept_id, from, to) => {
        return await DBClientWrapper(async client => {
            try {
                let where = "";
                let whereval = [];
                let whereque = [];
                let index = 1;
                if (bu_id) {
                    whereval.push(bu_id);
                    whereque.push(`bu_id = $${index}`);
                    index++;
                }
                if (dept_id) {
                    whereval.push(dept_id);
                    whereque.push(`dept_id = $${index}`);
                    index++;
                }
                if (from) {
                    whereval.push(from);
                    whereque.push(
                        `last_updated >= to_date($${index}, 'yyyy-mm-dd')`
                    );
                    index++;
                }
                if (to) {
                    whereval.push(to);
                    whereque.push(
                        `last_updated <= to_date($${index}, 'yyyy-mm-dd')`
                    );
                    index++;
                }

                if (whereval.length > 0) {
                    where = `where ${whereque.join(" and ")}`;
                }

                let query = `
                        select
                            count(current_position) as count_item,
                            fullname,
                            current_position,
                            bu_id,
                            dept_id,
                            min(last_updated) as from_date,
                            max(last_updated) as to_date
                        from
                            (
                            select
                                t.ticket_id,
                                t.approval_type,
                                t.approval_pos,
                                t.is_close,
                                case
                                    when t.approval_pos = 'END' then 'Confirmed by MDM'
                                    when t.is_close = true then 'Closed'
                                    when as2.emp_role_id = 'STAFF'
                                    or as2.emp_role_id = 'VENDOR' then 'Create'
                                    when as2.emp_role_id = 'DIV_HEAD'
                                    or as2.emp_role_id = 'DEPT_HEAD'
                                    or as2.emp_role_id = 'C_LEVEL' then 'Approving'
                                    when as2.emp_role_id = 'MDM' then 'Approved by Manager'
                                    when t.reject_by = 'MDM' then 'Reject by MDM'
                                    else as2.emp_role_id
                                end as current_position,
                                as2.emp_role_id,
                                coalesce(t.updated_at,
                                t.created_at) as last_updated,
                                mu.bu_id,
                                mu.dept_id,
                                mu.fullname
                            from
                                ticket t
                            left join approval_steps as2 on
                                t.approval_type = as2.id_doctype
                                and t.approval_pos = as2.index_approval
                            inner join vendor v on v.ven_id = t.ven_id
                            left join mst_user mu on
                                mu.user_id = t.proc_id
                            where
                                t.approval_type is not null 
                                    ) a ${where}
                        group by
                            fullname,
                            current_position,
                            bu_id,
                            dept_id
                `;
                const { rows } = await client.query(query, whereval);
                const { rows: date_range } = await client.query(
                    `select min(from_date) as from_date, max(to_date) as to_date from (${query}) a`,
                    whereval
                );
                const dt_rng = date_range[0];

                //normalize table
                const result = new Map();
                for (const row of rows) {
                    if (!result.has(row.fullname)) {
                        result.set(row.fullname, {
                            fullname: row.fullname,
                            Approving: 0,
                            Create: 0,
                            "Approved by Manager": 0,
                            "Confirmed by MDM": 0,
                            Closed: 0,
                            "Rejected by MDM": 0,
                            Approving: 0,
                            [row.current_position]: parseInt(row.count_item),
                        });
                    } else {
                        result.get(row.fullname)[row.current_position] =
                            parseInt(row.count_item);
                    }
                }
                return {
                    bu_id: bu_id ?? "",
                    dept_id: dept_id ?? "",
                    from: from ?? dt_rng.from_date,
                    to: to ?? dt_rng.to_date,
                    result: Array.from(result).map(item => item[1]),
                };
            } catch (error) {
                throw error;
            }
        });
    },
    ExportExcelSummaryTicketPosition: async (bu_id, dept_id, from, to) => {
        try {
            const result = await ReportModel.GenerateSummaryTicketPosition(
                bu_id,
                dept_id,
                from,
                to
            );
            //generate export workbook
            const workbook = new Exceljs.Workbook();
            const summarysheet = workbook.addWorksheet("Summary");
            const tableHeader = new Map([
                [
                    "A",
                    {
                        value: "fullname",
                        label: "Requestor",
                        width: 40,
                    },
                ],
                [
                    "B",
                    {
                        value: row => {
                            return (
                                row.Approving +
                                row.Create +
                                row["Approved by Manager"] +
                                row["Confirmed by MDM"] +
                                row["Closed"] +
                                row["Rejected by MDM"]
                            );
                        },
                        label: "Count of Request",
                        width: 30,
                    },
                ],
                [
                    "C",
                    {
                        value: "Create",
                        label: "Create",
                        width: 20,
                    },
                ],
                [
                    "D",
                    {
                        value: "Approving",
                        label: "Approving",
                        width: 20,
                    },
                ],
                [
                    "E",
                    {
                        value: "Approved by Manager",
                        label: "Approved by Manager",
                        width: 20,
                    },
                ],
                [
                    "F",
                    {
                        value: "Confirmed by MDM",
                        label: "Confirmed by MDM",
                        width: 20,
                    },
                ],
                [
                    "G",
                    {
                        value: "Closed",
                        label: "Closed",
                        width: 20,
                    },
                ],
                [
                    "H",
                    {
                        value: "Rejected by MDM",
                        label: "Rejected by MDM",
                        width: 20,
                    },
                ],
            ]);
            //set period from to
            summarysheet.getCell("A1").value = "Period : ";
            summarysheet.getCell("B1").value = from
                ? new Date(from)
                : new Date(result.from);
            summarysheet.getCell("C1").value = to
                ? new Date(to)
                : new Date(result.to);
            let tableStart = 4;

            //status merge
            summarysheet.getCell("C3").value = "Status";
            summarysheet.mergeCells("C3:H3");
            summarysheet.getCell("C3:H3").fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "ffffcc00" },
            };
            summarysheet.getCell("C3:H3").border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };

            //set header
            for (const [cell, item] of tableHeader) {
                summarysheet.getCell(cell + tableStart).value = item.label;
                summarysheet.getColumn(cell).width = item.width;
                summarysheet.getCell(cell + tableStart).fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "ffffcc00" },
                };
                summarysheet.getCell(cell + tableStart).border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                };
            }
            tableStart += 1;
            for (let i = 0; i < result.result.length; i++) {
                let rownum = i + tableStart;
                for (const [cell, header] of tableHeader) {
                    let value;
                    if (typeof header.value == "string") {
                        value = result.result[i][header.value];
                    } else {
                        value = header.value(result.result[i]);
                    }
                    summarysheet.getCell(cell + rownum).value = {
                        richText: [
                            {
                                text:
                                    typeof value !== "string"
                                        ? value.toString()
                                        : value,
                            },
                        ],
                    };
                    summarysheet.getCell(cell + rownum).border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    };
                }
            }

            //generate detail
            const result_detail =
                await ReportModel.GenerateDetailReportTicketPosition(
                    bu_id,
                    dept_id,
                    from,
                    to
                );
            const detailsheet = workbook.addWorksheet("Details");
            const headerDetail = new Map([
                [
                    "A",
                    {
                        value: "fullname",
                        label: "Requestor",
                        width: 20,
                    },
                ],
                [
                    "B",
                    {
                        value: "ticket_id",
                        label: "Ticket ID",
                        width: 20,
                    },
                ],
                [
                    "C",
                    {
                        value: "ven_code",
                        label: "Vendor Code",
                        width: 20,
                    },
                ],
                [
                    "D",
                    {
                        value: "name_1",
                        label: "Vendor Name",
                        width: 20,
                    },
                ],
                [
                    "E",
                    {
                        value: "created_at",
                        label: "Created At",
                        width: 20,
                    },
                ],
                [
                    "F",
                    {
                        value: "updated_at",
                        label: "Last Updated At",
                        width: 20,
                    },
                ],
                [
                    "G",
                    {
                        value: "rejected_by_mdm",
                        label: "X Times Rejected by MDM",
                        width: 20,
                    },
                ],
                [
                    "H",
                    {
                        value: "current_position",
                        label: "Status",
                        width: 20,
                    },
                ],
                [
                    "I",
                    {
                        value: "name_1",
                        label: "Vendor Name",
                        width: 20,
                    },
                ],
                [
                    "J",
                    {
                        value: "badan_usaha",
                        label: "Business Entity",
                        width: 20,
                    },
                ],
                [
                    "K",
                    {
                        value: "ven_type",
                        label: "Vendor Type",
                        width: 20,
                    },
                ],
                [
                    "L",
                    {
                        value: "badan_usaha",
                        label: "Business Entity",
                        width: 20,
                    },
                ],
                [
                    "M",
                    {
                        value: row => {
                            return `${row.prefix}-${row.hp_num}`;
                        },
                        label: "Office Handphone Number",
                        width: 20,
                    },
                ],
                [
                    "N",
                    {
                        value: row => {
                            return `${row.prefix}-${row.telf_num}`;
                        },
                        label: "Office Telephone Number",
                        width: 20,
                    },
                ],
                [
                    "O",
                    {
                        value: "nama_pic",
                        label: "PIC Name",
                        width: 20,
                    },
                ],
                [
                    "P",
                    {
                        value: "pic_jabatan",
                        label: "PIC Role",
                        width: 20,
                    },
                ],
                [
                    "Q",
                    {
                        value: "pic_jabatan",
                        label: "PIC Role",
                        width: 20,
                    },
                ],
                [
                    "R",
                    {
                        value: "no_telf_pic",
                        label: "PIC Phone Num",
                        width: 20,
                    },
                ],
                [
                    "S",
                    {
                        value: "email_pic",
                        label: "PIC Email",
                        width: 20,
                    },
                ],
                [
                    "T",
                    {
                        value: row => {
                            return [
                                row.street,
                                row.street2,
                                row.street3,
                                row.street4,
                            ].join(" ");
                        },
                        label: "Address",
                        width: 20,
                    },
                ],
                [
                    "U",
                    {
                        value: "city",
                        label: "City",
                        width: 20,
                    },
                ],
                [
                    "V",
                    {
                        value: "postal",
                        label: "Postal",
                        width: 20,
                    },
                ],
                [
                    "W",
                    {
                        value: "ven_class",
                        label: "Vendor Class",
                        width: 20,
                    },
                ],
                [
                    "W",
                    {
                        value: "ven_class",
                        label: "Vendor Class",
                        width: 20,
                    },
                ],
                [
                    "X",
                    {
                        value: "bank_name",
                        label: "Bank Name",
                        width: 20,
                    },
                ],
                [
                    "Y",
                    {
                        value: "ven_class",
                        label: "Vendor Class",
                        width: 20,
                    },
                ],
                [
                    "X",
                    {
                        value: "bank_curr",
                        label: "Bank Currency",
                        width: 20,
                    },
                ],
                [
                    "W",
                    {
                        value: "bank_acc",
                        label: "Bank Account",
                        width: 20,
                    },
                ],
                [
                    "Z",
                    {
                        value: "acc_hold",
                        label: "Account Holder",
                        width: 20,
                    },
                ],
                [
                    "AA",
                    {
                        value: "npwp",
                        label: "Tax Number",
                        width: 20,
                    },
                ],
                [
                    "AB",
                    {
                        value: "is_pkp",
                        label: "Status PKP",
                        width: 20,
                    },
                ],
            ]);
            let detailStart = 1;
            for (const [cell, item] of headerDetail) {
                detailsheet.getCell(cell + detailStart).value = item.label;
                detailsheet.getColumn(cell).width = item.width;
                detailsheet.getCell(cell + detailStart).fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "ffffcc00" },
                };
                detailsheet.getCell(cell + detailStart).border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                };
            }
            detailStart++;
            for (let i = 0; i < result_detail.length; i++) {
                let rownum = i + detailStart;
                for (const [cell, header] of headerDetail) {
                    let value;
                    if (typeof header.value == "string") {
                        value = result_detail[i][header.value];
                    } else {
                        value = header.value(result_detail[i]);
                    }
                    console.log(value);
                    detailsheet.getCell(cell + rownum).value = value;
                    detailsheet.getCell(cell + rownum).border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    };
                }
            }
            return workbook;
        } catch (error) {
            throw error;
        }
    },

    GenerateDetailReportTicketPosition: async (bu_id, dept_id, from, to) => {
        return DBClientWrapper(async client => {
            try {
                let where = "";
                let whereval = [];
                let whereque = [];
                let index = 1;

                if (bu_id) {
                    whereval.push(bu_id);
                    whereque.push(`mu.bu_id = $${index}`);
                    index++;
                }
                if (dept_id) {
                    whereval.push(dept_id);
                    whereque.push(`mu.dept_id = $${index}`);
                    index++;
                }
                if (from) {
                    whereval.push(from);
                    whereque.push(
                        `coalesce(t.updated_at, t.created_at) >= to_date($${index}, 'yyyy-mm-dd')`
                    );
                    index++;
                }
                if (to) {
                    whereval.push(to);
                    whereque.push(
                        `coalesce(t.updated_at, t.created_at) <= to_date($${index}, 'yyyy-mm-dd')`
                    );
                    index++;
                }
                if (whereval.length > 0) {
                    where = "and " + whereque.join(" and ");
                }
                let query = `
                select
                    t.ticket_id,
                    t.proc_id,
                    t.approval_type,
                    t.approval_pos,
                    t.is_close,
                    case
                        when t.approval_pos = 'END' then 'Confirmed By MDM'
                    when t.is_close = true then 'Closed'
                    when as2.emp_role_id = 'STAFF'
                    or as2.emp_role_id = 'VENDOR' then 'Create'
                    when as2.emp_role_id = 'DIV_HEAD'
                    or as2.emp_role_id = 'DEPT_HEAD'
                    or as2.emp_role_id = 'C_LEVEL' then 'Approving'
                    when as2.emp_role_id = 'MDM' then 'Approved by Manager'
                    when t.reject_by = 'MDM' then 'Reject by MDM'
                    else as2.emp_role_id
                end as current_position,
                    as2.emp_role_id,
                    mu.bu_id,
                    mu.dept_id,
                    mu.fullname,
                    t.created_at,
                    t.updated_at,
                    coalesce(rej_mdm.rejected_by_mdm,
                0) as rejected_by_mdm,
                    v.name_1,
                    v.badan_usaha, 
                    v.ven_type,
                    v.telf1 as telf_num,
                    v.fax as hp_num,
                    v.email as email_office,
                    v.email_pic,
                    v.nama_pic,
                    v.pic_jabatan,
                    v.no_telf_pic,
                    v.street,
                    v.street2,
                    v.street3,
                    v.street4,
                    v.city,
                    v.postal,
                    v.ven_class,
                    v.ven_code,
                    v.npwp,
                    v.is_pkp,
                    mpc.prefix,
                    v.country,
                    vb.bank_id,
                    vb.acc_hold,
                    vb.bank_acc,
                    vb.id,
                    vb.bank_curr,
                    mcv.country_name as country_vendor,
                    mc.country_name,
                    coalesce(mbs.bank_name,
                cmb.bank_name) as bank_name,
                tr.bu_id
                from
                        ticket t
                left join approval_steps as2 on
                        t.approval_type = as2.id_doctype
                    and t.approval_pos = as2.index_approval
                left join ticket_rule tr on
                    tr.doctype = t.approval_type
                left join mst_user mu on
                        mu.user_id = t.proc_id
                inner join vendor v on
                    v.ven_id = t.ven_id
                left join (
                    select
                        ticket_id,
                        count(ticket_id) as rejected_by_mdm
                    from
                        log_rejection lr
                    left join mst_user mu on
                        lr.create_by = mu.user_id
                    where
                        mu.emp_role_id = 'MDM'
                    group by
                        ticket_id) rej_mdm on
                    rej_mdm.ticket_id = t.token
                left join (
                    select
                        min(vb.id) as id,
                        vb.ven_id
                    from
                        ven_bank vb
                    group by
                        vb.ven_id
                ) minvb on
                    minvb.ven_id = v.ven_id
                left join ven_bank vb on
                    vb.id = minvb.id
                    and minvb.ven_id = vb.ven_id
                left join mst_bank_sap mbs on
                    mbs.id::varchar = vb.bank_id::varchar
                    and tr.bu_id <> 'CG'
                left join cg_mst_bank cmb on
                    cmb.bank_code = vb.bank_id::varchar
                    and tr.bu_id = 'CG'
                left join mst_phone_code mpc on 
                    mpc.territory = v.country
                left join mst_country mc on
                    mc.country_code = vb.country
                left join mst_country mcv on mcv.country_code = v.country
                where t.approval_type is not null ${where}
                order by mu.fullname asc
                `;
                console.log(query);
                const { rows } = await client.query(query, whereval);
                return rows;
            } catch (error) {
                throw error;
            }
        });
    },
};

module.exports = ReportModel;
