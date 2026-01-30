const CoupaService = require("../class/CoupaService");

exports.getData = async (req, res) => {
    try {
        let date = req.body.date;
        if (!date) {
            const d = new Date();
            d.setDate(d.getDate() - 3);
            date = d.toISOString().slice(0, 10);
        }
        const rawData = await CoupaService.fetchData(date);

        const filteredData = rawData.map(item => ({
            id: item.id,
            coupa_id: item["supplier-id"],
            name: item.name,
            vendor_name: item["display-name"],
            vendor_code: item["supplier-number"],
            status: item.status,
            updated_at: item["updated-at"],
        }));

        res.json({
            success: true,
            data: filteredData,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

function splitData(data, maxLength = 40, title) {
    if (!data) return {};

    // pecah menjadi array tiap 40 karakter (rapi kata)
    const words = data.split(" ");
    const lines = [];
    let line = "";

    for (const word of words) {
        if ((line + " " + word).trim().length <= maxLength) {
            line = (line + " " + word).trim();
        } else {
            lines.push(line);
            line = word;
        }
    }

    if (line) lines.push(line);

    // mapping ke street1, street2, ...
    const result = {};
    lines.forEach((l, i) => {
        result[`${title}${i + 1}`] = l;
    });

    return result;
}

exports.getDetail = async (req, res) => {
    try {
        const id = req.body.id;
        if (!id) throw new Error("id is missing");
        const rawData = await CoupaService.getDetail(id);

        const filteredData = rawData.map(item => {
            const contact = item["supplier-information-contacts"]?.[0];
            const address = item["supplier-information-addresses"]?.[0];
            const insurance =
                item["supplier-information-insurance-detail"]?.[
                    "custom-fields"
                ];
            const purchOrg = item["custom-fields"]?.["purchasing-organization"];
            const enterprise =
                item["supplier-information-enterprise-detail"]?.[
                    "custom-fields"
                ];
            const company = item["custom-fields"]?.["company-code"];
            const bankData = item["custom-fields"]?.["nama-bank--bank-name"];
            const bankRegion =
                item["custom-fields"]?.["negara-bank--bank-region"];

            const fullAddress = [
                address["street-address"],
                address["street-address2"],
                address["street-address3"],
                address["street-address4"],
            ]
                .filter(Boolean)
                .join(" ");

            const npwpAddress =
                [
                    insurance?.["npwp-street-address-1"],
                    insurance?.["npwp-street-address-2"],
                    insurance?.["npwp-street-address-3"],
                    insurance?.["npwp-street-address-4"],
                ]
                    .filter(Boolean)
                    .join(" ") || null;

            const skkpAddress =
                [
                    enterprise?.["sppkp-street-address-1"],
                    enterprise?.["sppkp-street-address-2"],
                    enterprise?.["sppkp-street-address-3"],
                    enterprise?.["sppkp-street-address-4"],
                ]
                    .filter(Boolean)
                    .join(" ") || null;

            const streetLines = splitData(fullAddress, 40, "street");
            const npwpLines = splitData(npwpAddress, 40, "npwp_street");
            const skkpLines = splitData(skkpAddress, 40, "sppkp_street");

            return {
                company: {
                    title: item["title-perusahaan"],
                    local_ovs: item["local-foreign"],
                    country: address?.["country"].name,
                    name_1: item.name,
                    name_2: item["display-name"],
                    phone:
                        [
                            contact?.["phone-work"]?.extension,
                            contact?.["phone-work"]?.number,
                        ]
                            .filter(Boolean)
                            .join(" ") || null,

                    fax:
                        [
                            contact?.["phone-fax"]?.extension,
                            contact?.["phone-fax"]?.number,
                        ]
                            .filter(Boolean)
                            .join(" ") || null,
                    email: contact?.["email"],
                    kawasan_berikat: insurance?.["kawasan-berikat"],
                    coupa_id: item["supplier-id"],
                },
                social_media: {
                    website_url: item.website,
                },
                company_organization: {
                    nama_direktur: item["custom-fields"]?.["nama-direktur"],
                    nama_pic:
                        [contact?.["name-given"], contact?.["name-family"]]
                            .filter(Boolean)
                            .join(" ") || null,
                    no_telf_pic:
                        [
                            contact?.["phone-mobile"]?.extension,
                            contact?.["phone-mobile"]?.number,
                        ]
                            .filter(Boolean)
                            .join(" ") || null,
                    email_finance: item["custom-fields"]?.["email-finance"],
                },
                company_address: {
                    ...streetLines,
                    city: address?.city || null,
                    postal: address?.["postarl-code"] || null,
                },
                npwp_address: {
                    ...npwpLines,
                    city_npwp: insurance?.["npwp-city"]?.name,
                    postal_npwp: insurance?.["npwp-postal-code"],
                },
                sppkp_address: {
                    ...skkpLines,
                    city_sppkp: enterprise?.["sppkp-city"].name,
                    postal_sppkp: enterprise?.["sppkp-postal-code"],
                },
                tax_payment: {
                    is_pkp: insurance?.statuspkp,
                    is_new_npwp: true,
                    npwp: item["custom-fields"]?.["npwp-16digits"],
                    pay_mthd: item["bank-method-payment"],
                    pay_term: item["payment-term"]?.description || null,
                    ppn_type: item["ppn-type"]?.["external-ref-num"],
                    nitku: enterprise?.nitku,
                },
                vendor_detail: {
                    company: company?.name,
                    purch_org: purchOrg?.name,
                    ven_group: "3RD PARTY",
                    ven_acc: "Non-Trade",
                    ven_type: item["custom-fields"]?.["vendor-category"],
                    lim_curr: "-",
                    limit_vendor: "-",
                    is_tender: item["vendor-peserta-tender"],
                    is_priority: item["vendor-prioritas"],
                    is_interest: item["prioritas-pembayaran-interest"],
                    description: enterprise?.descriptive,
                },
                bank_information: {
                    bank_country: bankRegion?.["external-ref-num"],
                    bank_id: bankData?.id,
                    bank_curr: item["preferred-currency"]?.code,
                    bank_acc: item["custom-fields"]?.["bank-account-number"],
                    acc_hold: item["custom-fields"]?.["account-holder-name"],
                },
                vendor_code: item["supplier-number"],
            };
        });

        res.json({
            success: true,
            data: filteredData[0],
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

exports.updateVendor = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) throw new Error("id is missing");

        const status = await CoupaService.updateData(id);

        if (status !== 200) {
            throw new Error("Failed to update vendor");
        }

        res.json({
            success: true,
            message: "Success update data vendor",
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
