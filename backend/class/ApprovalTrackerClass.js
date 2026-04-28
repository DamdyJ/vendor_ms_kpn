const db = require("../config/connection");
const TRANS = require("../config/transaction");
const Crud = require("../helper/crudquery");
const moment = require("moment");

/**
 * @typedef {object} approval_step
 * @property {string} ticket_id
 * @property {string} index_approval
 * @property {string} emp_role_id
 * @property {string} bu_id
 * @property {string} dept_id
 * @property {string[]} disabled_input
 * @property {string[]} enabled_input
 * @property {Array<{condition : Array<
 * {field : string, condition : string, value : string|boolean|number}
 * >,
 * next_index : string,
 * on_submit_email : string,
 * on_submit_target : string
 * }>} on_submit_condition
 * @property {string} def_submit_email_target
 * @property {string} def_reject_email_target
 * @property {string} def_submit_email
 * @property {string} def_reject_email
 * @property {string} reject_action
 * @property {string} reject_next_index
 * @property {string} default_next_index
 * @property {string} email
 * @property {boolean} is_onetime_appr
 * @property {boolean} wo_auth
 * @property {string} cc_email
 */

/**
 * @typedef {Object} ticket
 * @property {string} ticket_id
 * @property {string} ticket_num
 * @property {string} ticket_type
 * @property {string} approval_pos
 * @property {string} name_1
 * @property {string} local_overseas
 * @property {string} title
 * @property {string} email
 */

class ApprovalTracker {
    ticket_id = "";
    /**
     * @type {ticket}
     */
    ticket;
    doctype = "";
    /**
     * @type {Map<string, approval_step>}
     */
    approval_step = new Map();
    /**
     * @type {approval_step}
     */
    current_step;
    psqlclient;

    constructor(client, id_ticket, doctype) {
        if (!client) throw new Error("Please set pg client");
        if (!doctype && !id_ticket) throw new Error("Please provide doctype");
        this.ticket_id = id_ticket || "";
        this.psqlclient = client;
        this.doctype = doctype || "";
    }

    async init() {
        try {
            let client = this.psqlclient;
            try {
                let whereVal = [];
                let whereque = [];
                if (this.ticket_id) {
                    const { rows: ticket_data } = await client.query(
                        `select
                            v.*,
                            t.ticket_type,
                            t.approval_pos,
                            t.is_active
                        from
                            all_tickets t
                        left join vendor v on
                            t.ven_id = v.ven_id
                        where
                            t.ticket_id = $1`,
                        [this.ticket_id]
                    );
                    this.ticket = ticket_data[0];
                    whereVal.push(this.ticket.ticket_type);
                    whereVal.push(this.ticket_id);
                } else {
                    whereVal.push(this.doctype);
                }
                let que = "";
                if (this.ticket_id) {
                    que = `
                    select
                        as2.id_doctype,
                        as2.index_approval,
                        as2.emp_role_id ,
                        as2.bu_id ,
                        as2.dept_id ,
                        as2.disabled_input ,
                        as2.enabled_input ,
                        ao.on_submit_condition ,
                        as2.def_submit_email_target,
                        as2.def_reject_email_target,
                        as2.def_submit_email,
                        as2.def_reject_email, 
                        as2.reject_action,
                        as2.reject_next_index,
                        as2.default_next_index,
                         case
                            when as2.emp_role_id = 'STAFF' then mu.email
                            else au.email
                        end as email,
                        as2.is_onetime_appr,
                        as2.wo_auth,
                        cc_email.email as cc_email
                    from
                        approval_steps as2
                    left join (
                        select
                            on_submit_id,
                            array_agg(json_build_object('condition', condition, 'next_index', next_index, 'on_submit_email', on_submit_email, 'on_submit_target', on_submit_target)) as on_submit_condition
                        from
                            approval_onsubmit ao
                        group by
                            on_submit_id) ao on
                        ao.on_submit_id = as2.on_submit
                    left join (
                        select
                            emp_role_id,
                            bu_id,
                            bu_id_1,
                            bu_id_2,
                            dept_id,
                            string_agg(email,
                            ',') as email
                        from
                            all_users au
                        group by
                            emp_role_id,
                            bu_id,
                            bu_id_1,
                            bu_id_2,
                            dept_id) au on
                        au.emp_role_id = as2.emp_role_id
                        and (au.bu_id = as2.bu_id or au.bu_id_1 = as2.bu_id or au.bu_id_2 = as2.bu_id)
                        and au.dept_id = as2.dept_id
                    left join(
                        select ac.approval_doctype, ac.approval_pos, ac.bu_id, ac.dept_id, ac.emp_role_id, string_agg(email, ',') as email from mst_user mu
                        left join approval_cc ac on ac.bu_id = mu.bu_id and ac.dept_id = mu.dept_id and ac.emp_role_id = mu.emp_role_id
                        group by ac.approval_pos, ac.approval_doctype, ac.bu_id, ac.dept_id, ac.emp_role_id
                    ) cc_email on as2.id_doctype = cc_email.approval_doctype and as2.index_approval = cc_email.approval_pos 
                    left join ticket t on t.approval_type = as2.id_doctype 
                    left join mst_user mu on mu.user_id = t.proc_id
                    where
                        id_doctype = $1 and t.token = $2
                    order by
                        index_approval
                    `;
                } else {
                    que = `
                    select
                        as2.id_doctype,
                        as2.index_approval,
                        as2.emp_role_id ,
                        as2.bu_id ,
                        as2.dept_id ,
                        as2.disabled_input ,
                        as2.enabled_input ,
                        ao.on_submit_condition ,
                        as2.def_submit_email_target,
                        as2.def_reject_email_target,
                        as2.def_submit_email,
                        as2.def_reject_email, 
                        as2.reject_action,
                        as2.reject_next_index,
                        as2.default_next_index,
                        au.email,
                        as2.is_onetime_appr,
                        as2.wo_auth,
                        cc_email.email as cc_email
                    from
                        approval_steps as2
                    left join (
                        select
                            on_submit_id,
                            array_agg(json_build_object('condition', condition, 'next_index', next_index, 'on_submit_email', on_submit_email, 'on_submit_target', on_submit_target)) as on_submit_condition
                        from
                            approval_onsubmit ao
                        group by
                            on_submit_id) ao on
                        ao.on_submit_id = as2.on_submit
                    left join (
                        select
                            emp_role_id,
                            bu_id,
                            bu_id_1,
                            bu_id_2,
                            dept_id,
                            string_agg(email,
                            ',') as email
                        from
                            all_users au
                        group by
                            emp_role_id,
                            bu_id,
                            bu_id_1,
                            bu_id_2,
                            dept_id) au on
                        au.emp_role_id = as2.emp_role_id
                        and (au.bu_id = as2.bu_id)
                        and au.dept_id = as2.dept_id
                    left join(
                        select ac.approval_doctype, ac.approval_pos, ac.bu_id, ac.dept_id, ac.emp_role_id, string_agg(email, ',') as email from mst_user mu
                        left join approval_cc ac on ac.bu_id = mu.bu_id and ac.dept_id = mu.dept_id and ac.emp_role_id = mu.emp_role_id
                        group by ac.approval_pos, ac.approval_doctype, ac.bu_id, ac.dept_id, ac.emp_role_id
                    ) cc_email on as2.id_doctype = cc_email.approval_doctype and as2.index_approval = cc_email.approval_pos 
                    where
                        id_doctype = $1 
                    order by
                        index_approval
                    `;
                }
                console.log(que);
                const { rows: approval_step_dt } = await client.query(
                    que,
                    whereVal
                );
                approval_step_dt.map(value => {
                    this.approval_step.set(value.index_approval, value);
                });
                this.current_step = this.approval_step.get(0);
                if (this.ticket) {
                    let curr_step = this.approval_step.get(
                        this.ticket.approval_pos
                    );
                    if (!curr_step) {
                        curr_step = {
                            index_approval: "END",
                        };
                    }
                    this.current_step = {
                        ...curr_step,
                        ticket_id: this.ticket_id,
                    };
                }
                return;
            } catch (error) {
                throw error;
            }
        } catch (error) {
            throw error;
        }
    }

    checkIsInit() {
        if (!this.ticket) {
            throw new Error("Ticket not defined");
        }
        return;
    }

    getTicketFlow() {
        return {
            ticket: this.ticket,
            current_flow: this.current_step,
            flow: Object.fromEntries(this.approval_step),
        };
    }

    checkIsApproverAllowed(session) {
        this.checkIsInit();
        let emp_role_id = this.current_step.emp_role_id;
        let bu_id = this.current_step.bu_id;
        let dept_id = this.current_step.dept_id;
        let is_wo_auth = this.current_step.wo_auth;
        if (session.emp_role_id == "ADMIN") {
            return true;
        }
        if (is_wo_auth) {
            return true;
        }
        if (!session) {
            throw new Error("Please provide id user");
        }
        if (
            (session.emp_role_id == emp_role_id &&
                session.bu_id == bu_id &&
                session.dept_id == dept_id) ||
            emp_role_id == "VENDOR"
        ) {
            return true;
        }
        return false;
    }

    getCurrentStep() {
        return this.current_step;
    }

    getApprovalStep(index) {
        if (index == undefined) {
            return this.approval_step;
        } else {
            return this.approval_step.get(index);
        }
    }

    getEmailFromSteps(indexfrom, indexto) {
        const arr_steps = Object.fromEntries(this.approval_step);

        let emails = [];
        Object.values(arr_steps).map((value, index) => {
            let reach_index = true;
            if (indexto) {
                if (indexto >= index) {
                    reach_index = false;
                }
            }
            if (index >= indexfrom && reach_index) {
                emails.push(value.email);
            }
        });
        return emails;
    }

    getEmailLastSteps() {
        const arr_steps = Object.fromEntries(this.approval_step);
        let last_item = Object.values(arr_steps).slice(-1)[0];
        return [last_item];
    }
}

module.exports = ApprovalTracker;
