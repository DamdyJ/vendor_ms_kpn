const { emailTemplate } = require("./helper");

const Email = {
    manager: (target, ven_name, ven_type, comp, ticket_id, description) => {
        return `
        <!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width" />
        <title>Email Notification</title>
        <link
            href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap"
            rel="stylesheet"
        />
        <style>
            html,
            body {
                margin: 0 auto !important;
                padding: 0 !important;
                height: 100% !important;
                width: 100% !important;
                background: #f1f1f1;
            }

            /* What it does: Stops email clients resizing small text. */
            * {
                -ms-text-size-adjust: 100%;
                -webkit-text-size-adjust: 100%;
            }

            /* What it does: Centers email on Android 4.4 */
            div[style*="margin: 16px 0"] {
                margin: 0 !important;
            }

            /* What it does: Stops Outlook from adding extra spacing to tables. */
            table,
            td {
                mso-table-lspace: 0pt !important;
                mso-table-rspace: 0pt !important;
            }

            /* What it does: Fixes webkit padding issue. */
            table {
                border-spacing: 0 !important;
                border-collapse: collapse !important;
                table-layout: fixed !important;
                margin: 0 auto !important;
            }

            /* What it does: Uses a better rendering method when resizing images in IE. */
            img {
                -ms-interpolation-mode: bicubic;
            }

            /* What it does: Prevents Windows 10 Mail from underlining links despite inline CSS. Styles for underlined links should be inline. */
            a {
                text-decoration: none;
            }

            /* What it does: A work-around for email clients meddling in triggered links. */
            *[x-apple-data-detectors],  /* iOS */
        .unstyle-auto-detected-links *,
        .aBn {
                border-bottom: 0 !important;
                cursor: default !important;
                color: inherit !important;
                text-decoration: none !important;
                font-size: inherit !important;
                font-family: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
            }

            /* What it does: Prevents Gmail from displaying a download button on large, non-linked images. */
            .a6S {
                display: none !important;
                opacity: 0.01 !important;
            }

            /* What it does: Prevents Gmail from changing the text color in conversation threads. */
            .im {
                color: inherit !important;
            }

            /* If the above doesn't work, add a .g-img class to any image in question. */
            img.g-img + div {
                display: none !important;
            }

            /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */
            /* Create one of these media queries for each additional viewport size you'd like to fix */

            /* iPhone 4, 4S, 5, 5S, 5C, and 5SE */
            @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
                u ~ div .email-container {
                    min-width: 320px !important;
                }
            }
            /* iPhone 6, 6S, 7, 8, and X */
            @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
                u ~ div .email-container {
                    min-width: 375px !important;
                }
            }
            /* iPhone 6+, 7+, and 8+ */
            @media only screen and (min-device-width: 414px) {
                u ~ div .email-container {
                    min-width: 414px !important;
                }
            }
        </style>

        <!-- CSS Reset : END -->

        <!-- Progressive Enhancements : BEGIN -->
        <style>
            .primary {
                background: #2f89fc;
            }
            .bg_white {
                background: #ffffff;
            }
            .bg_light {
                background: #fafafa;
            }
            .bg_black {
                background: #000000;
            }
            .bg_dark {
                background: rgba(0, 0, 0, 0.8);
            }
            .email-section {
                padding: 2.5em;
            }

            /*BUTTON*/
            .btn {
                padding: 5px 15px;
                display: inline-block;
            }
            .btn.btn-primary {
                border-radius: 5px;
                background: #2f89fc;
                color: #ffffff;
            }
            .btn.btn-primary:hover {
                border-radius: 5px;
                background: #509cff;
                color: #ffffff;
            }
            .btn.btn-white {
                border-radius: 5px;
                background: #ffffff;
                color: #000000;
            }
            .btn.btn-white-outline {
                border-radius: 5px;
                background: transparent;
                border: 1px solid #fff;
                color: #fff;
            }

            h1,
            h2,
            h3,
            h4,
            h5,
            h6 {
                font-family: "Montserrat", sans-serif;
                color: #000000;
                margin-top: 0;
                font-weight: 400;
            }

            h4 span.approved {
                color: green;
                font-weight: 700;
            }

            body {
                font-family: "Montserrat", sans-serif;
                font-weight: 400;
                font-size: 15px;
                line-height: 1.8;
                color: #000000;
            }

            a {
                color: #2f89fc;
            }

            table {
            }
            /*LOGO*/

            .logo h1 {
                margin: 0;
            }
            .logo h1 a {
                color: #000000;
                font-size: 20px;
                font-weight: 700;
                text-transform: uppercase;
                font-family: "Montserrat", sans-serif;
            }

            .navigation {
                padding: 0;
            }
            .navigation li {
                list-style: none;
                display: inline-block;
                margin-left: 5px;
                font-size: 13px;
                font-weight: 500;
            }
            .navigation li a {
                color: rgba(0, 0, 0, 0.4);
            }

            /*HERO*/
            .hero {
                position: relative;
                z-index: 0;
            }

            .hero .text {
                color: rgba(0, 0, 0, 0.3);
            }
            .hero .text h2 {
                color: #000;
                font-size: 30px;
                margin-bottom: 0;
                font-weight: 300;
            }
            .hero .text h2 span {
                font-weight: 600;
                color: #2f89fc;
            }

            /*HEADING SECTION*/
            .heading-section {
            }
            .heading-section h2 {
                color: #000000;
                font-size: 28px;
                margin-top: 0;
                line-height: 1.4;
                font-weight: 400;
            }
            .heading-section .subheading {
                margin-bottom: 20px !important;
                display: inline-block;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: rgba(0, 0, 0, 0.4);
                position: relative;
            }
            .heading-section .subheading::after {
                position: absolute;
                left: 0;
                right: 0;
                bottom: -10px;
                content: "";
                width: 100%;
                height: 2px;
                background: #2f89fc;
                margin: 0 auto;
            }

            .heading-section-white {
                color: rgba(255, 255, 255, 0.8);
            }
            .heading-section-white h2 {
                line-height: 1;
                padding-bottom: 0;
            }
            .heading-section-white h2 {
                color: #ffffff;
            }
            .heading-section-white .subheading {
                margin-bottom: 0;
                display: inline-block;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: rgba(255, 255, 255, 0.4);
            }

            /*PROJECT*/
            .text-project {
                padding-top: 10px;
            }
            .text-project h3 {
                margin-bottom: 0;
            }
            .text-project h3 a {
                color: #000;
            }

            /*FOOTER*/

            .footer {
                color: rgba(255, 255, 255, 0.5);
            }
            .footer .heading {
                color: #ffffff;
                font-size: 20px;
            }
            .footer ul {
                margin: 0;
                padding: 0;
            }
            .footer ul li {
                list-style: none;
                margin-bottom: 10px;
            }
            .footer ul li a {
                color: rgba(255, 255, 255, 1);
            }

            @media screen and (max-width: 500px) {
            }
        </style>
    </head>
    <body
        width="100%"
        style="
            margin: 0;
            padding: 0 !important;
            mso-line-height-rule: exactly;
            background-color: #222222;
        "
    >
        <center style="width: 100%; background-color: #f1f1f1">
            <div
                style="max-width: 600px; margin: 0 auto"
                class="email-container"
            >
                <table
                    align="center"
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    width="100%"
                    style="margin: auto"
                    class="bg_white"
                >
                    <tr>
                        <td
                            valign="top"
                            class="bg_white"
                            style="padding: 1em 2.5em"
                        >
                            <table
                                role="presentation"
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                            >
                                <tr>
                                    <td class="logo" style="text-align: left">
                                        <img
                                            width="40%"
                                            src="https://safetyfirstindonesia.co.id/assets/uploads/images/9f09b-kpn-corp.png"
                                        />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <table>
                            <tr>
                                <td
                                    valign="top"
                                    class="bg_white"
                                    style="padding: 1em 2.5em"
                                >
                                    <h4>
                                        Dear ${target}, <br />
                                        Please approve for vendor who
                                        <span class="approved">have</span>
                                        participated in the tender at KPN Corp :
                                    </h4>
                                </td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr>
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Vendor Name
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${ven_name}
                                </td>
                            </tr>
                            <tr>
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Vendor Type
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${ven_type}
                                </td>
                            </tr>
                            <tr>
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Company
                                </td>
                                <td style="padding: 0.1em 2.5em">: ${comp}</td>
                            </tr>
                            <tr>
                                <td width="20%" style="padding: 2em 2.5em">
                                    Action
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    <a
                                        href="${process.env.APP_URL}/api/ticket/mgrappr?ticket_id=${ticket_id}&action=accept"
                                    >
                                        <button
                                            class="btn btn-primary"
                                            style="
                                                padding-left: 2em;
                                                padding-right: 2em;
                                                padding-top: 1em;
                                                padding-bottom: 1em;
                                            "
                                        >
                                            Yes
                                        </button>
                                    </a>
                                    <a
                                        href="${process.env.APP_URL}/api/ticket/mgrappr?ticket_id=${ticket_id}&action=reject"
                                    >
                                        <button
                                            class="btn btn-primary"
                                            style="
                                                padding-left: 2em;
                                                padding-right: 2em;
                                                padding-top: 1em;
                                                padding-bottom: 1em;
                                            "
                                        >
                                            No
                                        </button>
                                    </a>
                                </td>
                            </tr>
                            <tr>
                                <td width="50%" style="padding: 1em 2.5em">
                                    Reason
                                </td>
                                <td style="padding: 0.1em 2.5em 2em">
                                    <div
                                        style="
                                            padding: 1em;
                                            border: 1px solid black;
                                        "
                                    >
                                        ${description}
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </tr>
                </table>
                <table
                    align="center"
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    width="100%"
                    style="margin: auto"
                >
                    <tr>
                        <td
                            valign="middle"
                            class="bg_black footer email-section"
                        >
                            <table>
                                <tr>
                                    <td>KPN Corp Copyright 2023</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>
        </center>
    </body>
</html>

        `;
    },

    vendorreq: (title, local_ovs, ven_name, ticket_num) => {
        return `
        <!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width" />
        <title>Email Notification</title>
        <link
            href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap"
            rel="stylesheet"
        />
        <style>
            html,
            body {
                margin: 0 auto !important;
                padding: 0 !important;
                height: 100% !important;
                width: 100% !important;
                background: #f1f1f1;
            }

            /* What it does: Stops email clients resizing small text. */
            * {
                -ms-text-size-adjust: 100%;
                -webkit-text-size-adjust: 100%;
            }

            /* What it does: Centers email on Android 4.4 */
            div[style*="margin: 16px 0"] {
                margin: 0 !important;
            }

            /* What it does: Stops Outlook from adding extra spacing to tables. */
            table,
            td {
                mso-table-lspace: 0pt !important;
                mso-table-rspace: 0pt !important;
            }

            /* What it does: Fixes webkit padding issue. */
            table {
                border-spacing: 0 !important;
                border-collapse: collapse !important;
                table-layout: fixed !important;
                margin: 0 auto !important;
            }

            /* What it does: Uses a better rendering method when resizing images in IE. */
            img {
                -ms-interpolation-mode: bicubic;
            }

            /* What it does: Prevents Windows 10 Mail from underlining links despite inline CSS. Styles for underlined links should be inline. */
            a {
                text-decoration: none;
            }

            /* What it does: A work-around for email clients meddling in triggered links. */
            *[x-apple-data-detectors],  /* iOS */
        .unstyle-auto-detected-links *,
        .aBn {
                border-bottom: 0 !important;
                cursor: default !important;
                color: inherit !important;
                text-decoration: none !important;
                font-size: inherit !important;
                font-family: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
            }

            /* What it does: Prevents Gmail from displaying a download button on large, non-linked images. */
            .a6S {
                display: none !important;
                opacity: 0.01 !important;
            }

            /* What it does: Prevents Gmail from changing the text color in conversation threads. */
            .im {
                color: inherit !important;
            }

            /* If the above doesn't work, add a .g-img class to any image in question. */
            img.g-img + div {
                display: none !important;
            }

            /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */
            /* Create one of these media queries for each additional viewport size you'd like to fix */

            /* iPhone 4, 4S, 5, 5S, 5C, and 5SE */
            @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
                u ~ div .email-container {
                    min-width: 320px !important;
                }
            }
            /* iPhone 6, 6S, 7, 8, and X */
            @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
                u ~ div .email-container {
                    min-width: 375px !important;
                }
            }
            /* iPhone 6+, 7+, and 8+ */
            @media only screen and (min-device-width: 414px) {
                u ~ div .email-container {
                    min-width: 414px !important;
                }
            }
        </style>

        <!-- CSS Reset : END -->

        <!-- Progressive Enhancements : BEGIN -->
        <style>
            .primary {
                background: #2f89fc;
            }
            .bg_white {
                background: #ffffff;
            }
            .bg_light {
                background: #fafafa;
            }
            .bg_black {
                background: #000000;
            }
            .bg_dark {
                background: rgba(0, 0, 0, 0.8);
            }
            .email-section {
                padding: 2.5em;
            }

            /*BUTTON*/
            .btn {
                padding: 5px 15px;
                display: inline-block;
            }
            .btn.btn-primary {
                border-radius: 5px;
                background: #2f89fc;
                color: #ffffff;
            }
            .btn.btn-primary:hover {
                border-radius: 5px;
                background: #509cff;
                color: #ffffff;
            }
            .btn.btn-white {
                border-radius: 5px;
                background: #ffffff;
                color: #000000;
            }
            .btn.btn-white-outline {
                border-radius: 5px;
                background: transparent;
                border: 1px solid #fff;
                color: #fff;
            }

            h1,
            h2,
            h3,
            h4,
            h5,
            h6 {
                font-family: "Montserrat", sans-serif;
                color: #000000;
                margin-top: 0;
                font-weight: 400;
            }

            body {
                font-family: "Montserrat", sans-serif;
                font-weight: 400;
                font-size: 15px;
                line-height: 1.8;
                color: #000000;
            }

            a {
                color: #2f89fc;
            }

            table {
            }
            /*LOGO*/

            .logo h1 {
                margin: 0;
            }
            .logo h1 a {
                color: #000000;
                font-size: 20px;
                font-weight: 700;
                text-transform: uppercase;
                font-family: "Montserrat", sans-serif;
            }

            .navigation {
                padding: 0;
            }
            .navigation li {
                list-style: none;
                display: inline-block;
                margin-left: 5px;
                font-size: 13px;
                font-weight: 500;
            }
            .navigation li a {
                color: rgba(0, 0, 0, 0.4);
            }

            /*HERO*/
            .hero {
                position: relative;
                z-index: 0;
            }

            .hero .text {
                color: rgba(0, 0, 0, 0.3);
            }
            .hero .text h2 {
                color: #000;
                font-size: 30px;
                margin-bottom: 0;
                font-weight: 300;
            }
            .hero .text h2 span {
                font-weight: 600;
                color: #2f89fc;
            }

            /*HEADING SECTION*/
            .heading-section {
            }
            .heading-section h2 {
                color: #000000;
                font-size: 28px;
                margin-top: 0;
                line-height: 1.4;
                font-weight: 400;
            }
            .heading-section .subheading {
                margin-bottom: 20px !important;
                display: inline-block;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: rgba(0, 0, 0, 0.4);
                position: relative;
            }
            .heading-section .subheading::after {
                position: absolute;
                left: 0;
                right: 0;
                bottom: -10px;
                content: "";
                width: 100%;
                height: 2px;
                background: #2f89fc;
                margin: 0 auto;
            }

            .heading-section-white {
                color: rgba(255, 255, 255, 0.8);
            }
            .heading-section-white h2 {
                line-height: 1;
                padding-bottom: 0;
            }
            .heading-section-white h2 {
                color: #ffffff;
            }
            .heading-section-white .subheading {
                margin-bottom: 0;
                display: inline-block;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: rgba(255, 255, 255, 0.4);
            }

            /*FOOTER*/

            .footer {
                color: rgba(255, 255, 255, 0.5);
            }
            .footer .heading {
                color: #ffffff;
                font-size: 20px;
            }
            .footer ul {
                margin: 0;
                padding: 0;
            }
            .footer ul li {
                list-style: none;
                margin-bottom: 10px;
            }
            .footer ul li a {
                color: rgba(255, 255, 255, 1);
            }

            @media screen and (max-width: 500px) {
            }
        </style>
    </head>
    <body
        width="100%"
        style="
            margin: 0;
            padding: 0 !important;
            mso-line-height-rule: exactly;
            background-color: #222222;
        "
    >
        <center style="width: 100%; background-color: #f1f1f1">
            <div
                style="max-width: 600px; margin: 0 auto"
                class="email-container"
            >
                <table
                    align="center"
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    width="100%"
                    style="margin: auto"
                    class="bg_white"
                >
                    <tr>
                        <td
                            valign="top"
                            class="bg_white"
                            style="padding: 1em 2.5em"
                        >
                            <table
                                role="presentation"
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                            >
                                <tr>
                                    <td class="logo" style="text-align: left">
                                        <img
                                            width="40%"
                                            src="https://safetyfirstindonesia.co.id/assets/uploads/images/9f09b-kpn-corp.png"
                                        />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <table width="100%">
                            <tr>
                                <td
                                    valign="top"
                                    class="bg_white"
                                    style="padding: 1em 2.5em"
                                    width="100%"
                                >
                                    <h4>
                                        Kepada Yth. Bapak/Ibu <br />
                                        Form registrasi vendor dengan nomor
                                        ticket ${ticket_num} sudah terisi.
                                        <br />
                                        Detail :
                                    </h4>
                                </td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr>
                                <td width="30%" style="padding: 0.1em 2.5em">
                                    Title
                                </td>
                                <td style="padding: 0.1em 2.5em">: ${title}</td>
                            </tr>
                            <tr>
                                <td width="30%" style="padding: 0.1em 2.5em">
                                    Local / Overseas
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${local_ovs}
                                </td>
                            </tr>
                            <tr>
                                <td width="30%" style="padding: 0.1em 2.5em">
                                    Vendor Name
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${ven_name}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 1rem"></td>
                            </tr>
                        </table>
                    </tr>
                </table>
                <table
                    align="center"
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    width="100%"
                    style="margin: auto"
                >
                    <tr>
                        <td
                            valign="middle"
                            class="bg_black footer email-section"
                        >
                            <table>
                                <tr>
                                    <td>KPN Corp Copyright 2023</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>
        </center>
    </body>
</html>

        `;
    },

    request: (
        ticket_num,
        requestor,
        ven_name,
        ven_group,
        ven_account,
        comp
    ) => {
        return `<!doctype html>
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width" />
                <title>Email Notification</title>
                <link
                    href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap"
                    rel="stylesheet"
                />
                <style>
                    html,
                    body {
                        margin: 0 auto !important;
                        padding: 0 !important;
                        height: 100% !important;
                        width: 100% !important;
                        background: #f1f1f1;
                    }
        
                    /* What it does: Stops email clients resizing small text. */
                    * {
                        -ms-text-size-adjust: 100%;
                        -webkit-text-size-adjust: 100%;
                    }
        
                    /* What it does: Centers email on Android 4.4 */
                    div[style*="margin: 16px 0"] {
                        margin: 0 !important;
                    }
        
                    /* What it does: Stops Outlook from adding extra spacing to tables. */
                    table,
                    td {
                        mso-table-lspace: 0pt !important;
                        mso-table-rspace: 0pt !important;
                    }
        
                    /* What it does: Fixes webkit padding issue. */
                    table {
                        border-spacing: 0 !important;
                        border-collapse: collapse !important;
                        table-layout: fixed !important;
                        margin: 0 auto !important;
                    }
        
                    /* What it does: Uses a better rendering method when resizing images in IE. */
                    img {
                        -ms-interpolation-mode: bicubic;
                    }
        
                    /* What it does: Prevents Windows 10 Mail from underlining links despite inline CSS. Styles for underlined links should be inline. */
                    a {
                        text-decoration: none;
                    }
        
                    /* What it does: A work-around for email clients meddling in triggered links. */
                    *[x-apple-data-detectors],  /* iOS */
                .unstyle-auto-detected-links *,
                .aBn {
                        border-bottom: 0 !important;
                        cursor: default !important;
                        color: inherit !important;
                        text-decoration: none !important;
                        font-size: inherit !important;
                        font-family: inherit !important;
                        font-weight: inherit !important;
                        line-height: inherit !important;
                    }
        
                    /* What it does: Prevents Gmail from displaying a download button on large, non-linked images. */
                    .a6S {
                        display: none !important;
                        opacity: 0.01 !important;
                    }
        
                    /* What it does: Prevents Gmail from changing the text color in conversation threads. */
                    .im {
                        color: inherit !important;
                    }
        
                    /* If the above doesn't work, add a .g-img class to any image in question. */
                    img.g-img + div {
                        display: none !important;
                    }
        
                    /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */
                    /* Create one of these media queries for each additional viewport size you'd like to fix */
        
                    /* iPhone 4, 4S, 5, 5S, 5C, and 5SE */
                    @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
                        u ~ div .email-container {
                            min-width: 320px !important;
                        }
                    }
                    /* iPhone 6, 6S, 7, 8, and X */
                    @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
                        u ~ div .email-container {
                            min-width: 375px !important;
                        }
                    }
                    /* iPhone 6+, 7+, and 8+ */
                    @media only screen and (min-device-width: 414px) {
                        u ~ div .email-container {
                            min-width: 414px !important;
                        }
                    }
                </style>
        
                <!-- CSS Reset : END -->
        
                <!-- Progressive Enhancements : BEGIN -->
                <style>
                    .primary {
                        background: #2f89fc;
                    }
                    .bg_white {
                        background: #ffffff;
                    }
                    .bg_light {
                        background: #fafafa;
                    }
                    .bg_black {
                        background: #000000;
                    }
                    .bg_dark {
                        background: rgba(0, 0, 0, 0.8);
                    }
                    .email-section {
                        padding: 2.5em;
                    }
        
                    /*BUTTON*/
                    .btn {
                        padding: 5px 15px;
                        display: inline-block;
                    }
                    .btn.btn-primary {
                        border-radius: 5px;
                        background: #2f89fc;
                        color: #ffffff;
                    }
                    .btn.btn-primary:hover {
                        border-radius: 5px;
                        background: #509cff;
                        color: #ffffff;
                    }
                    .btn.btn-white {
                        border-radius: 5px;
                        background: #ffffff;
                        color: #000000;
                    }
                    .btn.btn-white-outline {
                        border-radius: 5px;
                        background: transparent;
                        border: 1px solid #fff;
                        color: #fff;
                    }
        
                    h1,
                    h2,
                    h3,
                    h4,
                    h5,
                    h6 {
                        font-family: "Montserrat", sans-serif;
                        color: #000000;
                        margin-top: 0;
                        font-weight: 400;
                    }
        
                    body {
                        font-family: "Montserrat", sans-serif;
                        font-weight: 400;
                        font-size: 15px;
                        line-height: 1.8;
                        color: #000000;
                    }
        
                    a {
                        color: #2f89fc;
                    }
        
                    table {
                    }
                    /*LOGO*/
        
                    .logo h1 {
                        margin: 0;
                    }
                    .logo h1 a {
                        color: #000000;
                        font-size: 20px;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-family: "Montserrat", sans-serif;
                    }
        
                    .navigation {
                        padding: 0;
                    }
                    .navigation li {
                        list-style: none;
                        display: inline-block;
                        margin-left: 5px;
                        font-size: 13px;
                        font-weight: 500;
                    }
                    .navigation li a {
                        color: rgba(0, 0, 0, 0.4);
                    }
        
                    /*HERO*/
                    .hero {
                        position: relative;
                        z-index: 0;
                    }
        
                    .hero .text {
                        color: rgba(0, 0, 0, 0.3);
                    }
                    .hero .text h2 {
                        color: #000;
                        font-size: 30px;
                        margin-bottom: 0;
                        font-weight: 300;
                    }
                    .hero .text h2 span {
                        font-weight: 600;
                        color: #2f89fc;
                    }
        
                    /*HEADING SECTION*/
                    .heading-section {
                    }
                    .heading-section h2 {
                        color: #000000;
                        font-size: 28px;
                        margin-top: 0;
                        line-height: 1.4;
                        font-weight: 400;
                    }
                    .heading-section .subheading {
                        margin-bottom: 20px !important;
                        display: inline-block;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: rgba(0, 0, 0, 0.4);
                        position: relative;
                    }
                    .heading-section .subheading::after {
                        position: absolute;
                        left: 0;
                        right: 0;
                        bottom: -10px;
                        content: "";
                        width: 100%;
                        height: 2px;
                        background: #2f89fc;
                        margin: 0 auto;
                    }
        
                    .heading-section-white {
                        color: rgba(255, 255, 255, 0.8);
                    }
                    .heading-section-white h2 {
                        line-height: 1;
                        padding-bottom: 0;
                    }
                    .heading-section-white h2 {
                        color: #ffffff;
                    }
                    .heading-section-white .subheading {
                        margin-bottom: 0;
                        display: inline-block;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: rgba(255, 255, 255, 0.4);
                    }
        
                    /*FOOTER*/
        
                    .footer {
                        color: rgba(255, 255, 255, 0.5);
                    }
                    .footer .heading {
                        color: #ffffff;
                        font-size: 20px;
                    }
                    .footer ul {
                        margin: 0;
                        padding: 0;
                    }
                    .footer ul li {
                        list-style: none;
                        margin-bottom: 10px;
                    }
                    .footer ul li a {
                        color: rgba(255, 255, 255, 1);
                    }
        
                    @media screen and (max-width: 500px) {
                    }
                </style>
            </head>
            <body
                width="100%"
                style="
                    margin: 0;
                    padding: 0 !important;
                    mso-line-height-rule: exactly;
                    background-color: #222222;
                "
            >
                <center style="width: 100%; background-color: #f1f1f1">
                    <div
                        style="max-width: 600px; margin: 0 auto"
                        class="email-container"
                    >
                        <table
                            align="center"
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            width="100%"
                            style="margin: auto"
                            class="bg_white"
                        >
                            <tr>
                                <td
                                    valign="top"
                                    class="bg_white"
                                    style="padding: 1em 2.5em"
                                >
                                    <table
                                        role="presentation"
                                        border="0"
                                        cellpadding="0"
                                        cellspacing="0"
                                        width="100%"
                                    >
                                        <tr>
                                            <td class="logo" style="text-align: left">
                                                <img
                                                    width="40%"
                                                    src="https://safetyfirstindonesia.co.id/assets/uploads/images/9f09b-kpn-corp.png"
                                                />
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <table>
                                    <tr>
                                        <td
                                            valign="top"
                                            class="bg_white"
                                            style="padding: 1em 2.5em"
                                        >
                                            <h4>
                                                Kepada Yth. Bapak/Ibu ${requestor}
                                                <br />
                                                Permintaan registrasi vendor anda telah
                                                dibuat dengan nomor ticket
                                                ${ticket_num}. Berikut detail
                                                permintaaan registrasi :
                                            </h4>
                                        </td>
                                    </tr>
                                </table>
                            </tr>
                            <tr>
                                <table class="bg_white" width="100%">
                                    <tr>
                                        <td width="25%" style="padding: 0.1em 2.5em">
                                            Vendor Name
                                        </td>
                                        <td style="padding: 0.1em 2.5em">
                                            : ${ven_name}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td width="25%" style="padding: 0.1em 2.5em">
                                            Vendor Group
                                        </td>
                                        <td style="padding: 0.1em 2.5em">
                                            : ${ven_group}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td width="25%" style="padding: 0.1em 2.5em">
                                            Vendor Account
                                        </td>
                                        <td style="padding: 0.1em 2.5em">
                                            : ${ven_account}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td width="25%" style="padding: 0.1em 2.5em">
                                            Company
                                        </td>
                                        <td style="padding: 0.1em 2.5em">: ${comp}</td>
                                    </tr>
                                    <tr>
                                        <td
                                            width="25%"
                                            style="padding: 0.5em 2.5em"
                                        ></td>
                                        <td style="padding: 0.5em 2.5em"></td>
                                    </tr>
                                </table>
                            </tr>
                        </table>
                        <table
                            align="center"
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            width="100%"
                            style="margin: auto"
                        >
                            <tr>
                                <td
                                    valign="middle"
                                    class="bg_black footer email-section"
                                >
                                    <table>
                                        <tr>
                                            <td>KPN Corp Copyright 2023</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </div>
                </center>
            </body>
        </html>
        
        `;
    },

    approve: (ven_code, ven_name) => {
        return `<!doctype html>
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width" />
                <title>Email Notification</title>
                <link
                    href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap"
                    rel="stylesheet"
                />
                <style>
                    html,
                    body {
                        margin: 0 auto !important;
                        padding: 0 !important;
                        height: 100% !important;
                        width: 100% !important;
                        background: #f1f1f1;
                    }
        
                    /* What it does: Stops email clients resizing small text. */
                    * {
                        -ms-text-size-adjust: 100%;
                        -webkit-text-size-adjust: 100%;
                    }
        
                    /* What it does: Centers email on Android 4.4 */
                    div[style*="margin: 16px 0"] {
                        margin: 0 !important;
                    }
        
                    /* What it does: Stops Outlook from adding extra spacing to tables. */
                    table,
                    td {
                        mso-table-lspace: 0pt !important;
                        mso-table-rspace: 0pt !important;
                    }
        
                    /* What it does: Fixes webkit padding issue. */
                    table {
                        border-spacing: 0 !important;
                        border-collapse: collapse !important;
                        table-layout: fixed !important;
                        margin: 0 auto !important;
                    }
        
                    /* What it does: Uses a better rendering method when resizing images in IE. */
                    img {
                        -ms-interpolation-mode: bicubic;
                    }
        
                    /* What it does: Prevents Windows 10 Mail from underlining links despite inline CSS. Styles for underlined links should be inline. */
                    a {
                        text-decoration: none;
                    }
        
                    /* What it does: A work-around for email clients meddling in triggered links. */
                    *[x-apple-data-detectors],  /* iOS */
                .unstyle-auto-detected-links *,
                .aBn {
                        border-bottom: 0 !important;
                        cursor: default !important;
                        color: inherit !important;
                        text-decoration: none !important;
                        font-size: inherit !important;
                        font-family: inherit !important;
                        font-weight: inherit !important;
                        line-height: inherit !important;
                    }
        
                    /* What it does: Prevents Gmail from displaying a download button on large, non-linked images. */
                    .a6S {
                        display: none !important;
                        opacity: 0.01 !important;
                    }
        
                    /* What it does: Prevents Gmail from changing the text color in conversation threads. */
                    .im {
                        color: inherit !important;
                    }
        
                    /* If the above doesn't work, add a .g-img class to any image in question. */
                    img.g-img + div {
                        display: none !important;
                    }
        
                    /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */
                    /* Create one of these media queries for each additional viewport size you'd like to fix */
        
                    /* iPhone 4, 4S, 5, 5S, 5C, and 5SE */
                    @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
                        u ~ div .email-container {
                            min-width: 320px !important;
                        }
                    }
                    /* iPhone 6, 6S, 7, 8, and X */
                    @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
                        u ~ div .email-container {
                            min-width: 375px !important;
                        }
                    }
                    /* iPhone 6+, 7+, and 8+ */
                    @media only screen and (min-device-width: 414px) {
                        u ~ div .email-container {
                            min-width: 414px !important;
                        }
                    }
                </style>
        
                <!-- CSS Reset : END -->
        
                <!-- Progressive Enhancements : BEGIN -->
                <style>
                    .primary {
                        background: #2f89fc;
                    }
                    .bg_white {
                        background: #ffffff;
                    }
                    .bg_light {
                        background: #fafafa;
                    }
                    .bg_black {
                        background: #000000;
                    }
                    .bg_dark {
                        background: rgba(0, 0, 0, 0.8);
                    }
                    .email-section {
                        padding: 2.5em;
                    }
        
                    /*BUTTON*/
                    .btn {
                        padding: 5px 15px;
                        display: inline-block;
                    }
                    .btn.btn-primary {
                        border-radius: 5px;
                        background: #2f89fc;
                        color: #ffffff;
                    }
                    .btn.btn-primary:hover {
                        border-radius: 5px;
                        background: #509cff;
                        color: #ffffff;
                    }
                    .btn.btn-white {
                        border-radius: 5px;
                        background: #ffffff;
                        color: #000000;
                    }
                    .btn.btn-white-outline {
                        border-radius: 5px;
                        background: transparent;
                        border: 1px solid #fff;
                        color: #fff;
                    }
        
                    h1,
                    h2,
                    h3,
                    h4,
                    h5,
                    h6 {
                        font-family: "Montserrat", sans-serif;
                        color: #000000;
                        margin-top: 0;
                        font-weight: 400;
                    }

                    h4 span.approved {
                        color: green;
                        font-weight: 700;
                    }
        
                    body {
                        font-family: "Montserrat", sans-serif;
                        font-weight: 400;
                        font-size: 15px;
                        line-height: 1.8;
                        color: #000000;
                    }
        
                    a {
                        color: #2f89fc;
                    }
        
                    table {
                    }
                    /*LOGO*/
        
                    .logo h1 {
                        margin: 0;
                    }
                    .logo h1 a {
                        color: #000000;
                        font-size: 20px;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-family: "Montserrat", sans-serif;
                    }
        
                    .navigation {
                        padding: 0;
                    }
                    .navigation li {
                        list-style: none;
                        display: inline-block;
                        margin-left: 5px;
                        font-size: 13px;
                        font-weight: 500;
                    }
                    .navigation li a {
                        color: rgba(0, 0, 0, 0.4);
                    }
        
                    /*HEADING SECTION*/
                    .heading-section {
                    }
                    .heading-section h2 {
                        color: #000000;
                        font-size: 28px;
                        margin-top: 0;
                        line-height: 1.4;
                        font-weight: 400;
                    }
                    .heading-section .subheading {
                        margin-bottom: 20px !important;
                        display: inline-block;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: rgba(0, 0, 0, 0.4);
                        position: relative;
                    }
                    .heading-section .subheading::after {
                        position: absolute;
                        left: 0;
                        right: 0;
                        bottom: -10px;
                        content: "";
                        width: 100%;
                        height: 2px;
                        background: #2f89fc;
                        margin: 0 auto;
                    }
        
                    .heading-section-white {
                        color: rgba(255, 255, 255, 0.8);
                    }
                    .heading-section-white h2 {
                        line-height: 1;
                        padding-bottom: 0;
                    }
                    .heading-section-white h2 {
                        color: #ffffff;
                    }
                    .heading-section-white .subheading {
                        margin-bottom: 0;
                        display: inline-block;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: rgba(255, 255, 255, 0.4);
                    }
        
                    /*FOOTER*/
        
                    .footer {
                        color: rgba(255, 255, 255, 0.5);
                    }
                    .footer .heading {
                        color: #ffffff;
                        font-size: 20px;
                    }
                    .footer ul {
                        margin: 0;
                        padding: 0;
                    }
                    .footer ul li {
                        list-style: none;
                        margin-bottom: 10px;
                    }
                    .footer ul li a {
                        color: rgba(255, 255, 255, 1);
                    }
        
                    @media screen and (max-width: 500px) {
                    }
                </style>
            </head>
            <body
                width="100%"
                style="
                    margin: 0;
                    padding: 0 !important;
                    mso-line-height-rule: exactly;
                    background-color: #222222;
                "
            >
                <center style="width: 100%; background-color: #f1f1f1">
                    <div
                        style="max-width: 600px; margin: 0 auto"
                        class="email-container"
                    >
                        <table
                            align="center"
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            width="100%"
                            style="margin: auto"
                            class="bg_white"
                        >
                            <tr>
                                <td
                                    valign="top"
                                    class="bg_white"
                                    style="padding: 1em 2.5em"
                                >
                                    <table
                                        role="presentation"
                                        border="0"
                                        cellpadding="0"
                                        cellspacing="0"
                                        width="100%"
                                    >
                                        <tr>
                                            <td class="logo" style="text-align: left">
                                                <img
                                                    width="40%"
                                                    src="https://safetyfirstindonesia.co.id/assets/uploads/images/9f09b-kpn-corp.png"
                                                />
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <table>
                                    <tr>
                                        <td
                                            valign="top"
                                            class="bg_white"
                                            style="padding: 1em 2.5em"
                                        >
                                            <h4>
                                                Kepada Yth. Bapak/Ibu <br />
                                                Permintaan registrasi vendor anda adalah <span class="approved">Approved</span> dengan detail
                                                sebagai berikut :
                                                <br />
                                                <br />
                                                ${ven_code} - ${ven_name}
                                            </h4>
                                        </td>
                                    </tr>
                                </table>
                            </tr>
                        </table>
                        <table
                            align="center"
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            width="100%"
                            style="margin: auto"
                        >
                            <tr>
                                <td
                                    valign="middle"
                                    class="bg_black footer email-section"
                                >
                                    <table>
                                        <tr>
                                            <td>KPN Corp Copyright 2023</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </div>
                </center>
            </body>
        </html>`;
    },

    reject: remarks => {
        return `<!doctype html>
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width" />
                <title>Email Notification</title>
                <link
                    href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap"
                    rel="stylesheet"
                />
                <style>
                    html,
                    body {
                        margin: 0 auto !important;
                        padding: 0 !important;
                        height: 100% !important;
                        width: 100% !important;
                        background: #f1f1f1;
                    }
        
                    /* What it does: Stops email clients resizing small text. */
                    * {
                        -ms-text-size-adjust: 100%;
                        -webkit-text-size-adjust: 100%;
                    }
        
                    /* What it does: Centers email on Android 4.4 */
                    div[style*="margin: 16px 0"] {
                        margin: 0 !important;
                    }
        
                    /* What it does: Stops Outlook from adding extra spacing to tables. */
                    table,
                    td {
                        mso-table-lspace: 0pt !important;
                        mso-table-rspace: 0pt !important;
                    }
        
                    /* What it does: Fixes webkit padding issue. */
                    table {
                        border-spacing: 0 !important;
                        border-collapse: collapse !important;
                        table-layout: fixed !important;
                        margin: 0 auto !important;
                    }
        
                    /* What it does: Uses a better rendering method when resizing images in IE. */
                    img {
                        -ms-interpolation-mode: bicubic;
                    }
        
                    /* What it does: Prevents Windows 10 Mail from underlining links despite inline CSS. Styles for underlined links should be inline. */
                    a {
                        text-decoration: none;
                    }
        
                    /* What it does: A work-around for email clients meddling in triggered links. */
                    *[x-apple-data-detectors],  /* iOS */
                .unstyle-auto-detected-links *,
                .aBn {
                        border-bottom: 0 !important;
                        cursor: default !important;
                        color: inherit !important;
                        text-decoration: none !important;
                        font-size: inherit !important;
                        font-family: inherit !important;
                        font-weight: inherit !important;
                        line-height: inherit !important;
                    }
        
                    /* What it does: Prevents Gmail from displaying a download button on large, non-linked images. */
                    .a6S {
                        display: none !important;
                        opacity: 0.01 !important;
                    }
        
                    /* What it does: Prevents Gmail from changing the text color in conversation threads. */
                    .im {
                        color: inherit !important;
                    }
        
                    /* If the above doesn't work, add a .g-img class to any image in question. */
                    img.g-img + div {
                        display: none !important;
                    }
        
                    /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */
                    /* Create one of these media queries for each additional viewport size you'd like to fix */
        
                    /* iPhone 4, 4S, 5, 5S, 5C, and 5SE */
                    @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
                        u ~ div .email-container {
                            min-width: 320px !important;
                        }
                    }
                    /* iPhone 6, 6S, 7, 8, and X */
                    @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
                        u ~ div .email-container {
                            min-width: 375px !important;
                        }
                    }
                    /* iPhone 6+, 7+, and 8+ */
                    @media only screen and (min-device-width: 414px) {
                        u ~ div .email-container {
                            min-width: 414px !important;
                        }
                    }
                </style>
        
                <!-- CSS Reset : END -->
        
                <!-- Progressive Enhancements : BEGIN -->
                <style>
                    .primary {
                        background: #2f89fc;
                    }
                    .bg_white {
                        background: #ffffff;
                    }
                    .bg_light {
                        background: #fafafa;
                    }
                    .bg_black {
                        background: #000000;
                    }
                    .bg_dark {
                        background: rgba(0, 0, 0, 0.8);
                    }
                    .email-section {
                        padding: 2.5em;
                    }
        
                    /*BUTTON*/
                    .btn {
                        padding: 5px 15px;
                        display: inline-block;
                    }
                    .btn.btn-primary {
                        border-radius: 5px;
                        background: #2f89fc;
                        color: #ffffff;
                    }
                    .btn.btn-primary:hover {
                        border-radius: 5px;
                        background: #509cff;
                        color: #ffffff;
                    }
                    .btn.btn-white {
                        border-radius: 5px;
                        background: #ffffff;
                        color: #000000;
                    }
                    .btn.btn-white-outline {
                        border-radius: 5px;
                        background: transparent;
                        border: 1px solid #fff;
                        color: #fff;
                    }
        
                    h1,
                    h2,
                    h3,
                    h4,
                    h5,
                    h6 {
                        font-family: "Montserrat", sans-serif;
                        color: #000000;
                        margin-top: 0;
                        font-weight: 400;
                    }

                    h4 span.rejected {
                        color: red;
                        font-weight: 700;
                    }
        
                    body {
                        font-family: "Montserrat", sans-serif;
                        font-weight: 400;
                        font-size: 15px;
                        line-height: 1.8;
                        color: #000000;
                    }
        
                    a {
                        color: #2f89fc;
                    }
        
                    table {
                    }
                    /*LOGO*/
        
                    .logo h1 {
                        margin: 0;
                    }
                    .logo h1 a {
                        color: #000000;
                        font-size: 20px;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-family: "Montserrat", sans-serif;
                    }
        
                    .navigation {
                        padding: 0;
                    }
                    .navigation li {
                        list-style: none;
                        display: inline-block;
                        margin-left: 5px;
                        font-size: 13px;
                        font-weight: 500;
                    }
                    .navigation li a {
                        color: rgba(0, 0, 0, 0.4);
                    }
        
                    /*HEADING SECTION*/
                    .heading-section {
                    }
                    .heading-section h2 {
                        color: #000000;
                        font-size: 28px;
                        margin-top: 0;
                        line-height: 1.4;
                        font-weight: 400;
                    }
                    .heading-section .subheading {
                        margin-bottom: 20px !important;
                        display: inline-block;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: rgba(0, 0, 0, 0.4);
                        position: relative;
                    }
                    .heading-section .subheading::after {
                        position: absolute;
                        left: 0;
                        right: 0;
                        bottom: -10px;
                        content: "";
                        width: 100%;
                        height: 2px;
                        background: #2f89fc;
                        margin: 0 auto;
                    }
        
                    .heading-section-white {
                        color: rgba(255, 255, 255, 0.8);
                    }
                    .heading-section-white h2 {
                        line-height: 1;
                        padding-bottom: 0;
                    }
                    .heading-section-white h2 {
                        color: #ffffff;
                    }
                    .heading-section-white .subheading {
                        margin-bottom: 0;
                        display: inline-block;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: rgba(255, 255, 255, 0.4);
                    }
        
                    /*FOOTER*/
        
                    .footer {
                        color: rgba(255, 255, 255, 0.5);
                    }
                    .footer .heading {
                        color: #ffffff;
                        font-size: 20px;
                    }
                    .footer ul {
                        margin: 0;
                        padding: 0;
                    }
                    .footer ul li {
                        list-style: none;
                        margin-bottom: 10px;
                    }
                    .footer ul li a {
                        color: rgba(255, 255, 255, 1);
                    }
        
                    @media screen and (max-width: 500px) {
                    }
                </style>
            </head>
            <body
                width="100%"
                style="
                    margin: 0;
                    padding: 0 !important;
                    mso-line-height-rule: exactly;
                    background-color: #222222;
                "
            >
                <center style="width: 100%; background-color: #f1f1f1">
                    <div
                        style="max-width: 600px; margin: 0 auto"
                        class="email-container"
                    >
                        <table
                            align="center"
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            width="100%"
                            style="margin: auto"
                            class="bg_white"
                        >
                            <tr>
                                <td
                                    valign="top"
                                    class="bg_white"
                                    style="padding: 1em 2.5em"
                                >
                                    <table
                                        role="presentation"
                                        border="0"
                                        cellpadding="0"
                                        cellspacing="0"
                                        width="100%"
                                    >
                                        <tr>
                                            <td class="logo" style="text-align: left">
                                                <img
                                                    width="40%"
                                                    src="https://safetyfirstindonesia.co.id/assets/uploads/images/9f09b-kpn-corp.png"
                                                />
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <table>
                                    <tr>
                                        <td
                                            valign="top"
                                            class="bg_white"
                                            style="padding: 1em 2.5em"
                                        >
                                            <h4>
                                                Kepada Yth. Bapak/Ibu <br />
                                                Permintaan registrasi vendor anda adalah <span class="rejected">Rejected</span> dengan detail
                                                sebagai berikut :
                                                <br />
                                                <br />
                                                ${remarks} 
                                            </h4>
                                        </td>
                                    </tr>
                                </table>
                            </tr>
                        </table>
                        <table
                            align="center"
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            width="100%"
                            style="margin: auto"
                        >
                            <tr>
                                <td
                                    valign="middle"
                                    class="bg_black footer email-section"
                                >
                                    <table>
                                        <tr>
                                            <td>KPN Corp Copyright 2023</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </div>
                </center>
            </body>
        </html>`;
    },
    notifRejectMgrToProc: (ven_name, ven_type, company, reason) => {
        return `<!doctype html>
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width" />
                <title>Email Notification</title>
                <link
                    href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap"
                    rel="stylesheet"
                />
                <style>
                    html,
                    body {
                        margin: 0 auto !important;
                        padding: 0 !important;
                        height: 100% !important;
                        width: 100% !important;
                        background: #f1f1f1;
                    }
        
                    /* What it does: Stops email clients resizing small text. */
                    * {
                        -ms-text-size-adjust: 100%;
                        -webkit-text-size-adjust: 100%;
                    }
        
                    /* What it does: Centers email on Android 4.4 */
                    div[style*="margin: 16px 0"] {
                        margin: 0 !important;
                    }
        
                    /* What it does: Stops Outlook from adding extra spacing to tables. */
                    table,
                    td {
                        mso-table-lspace: 0pt !important;
                        mso-table-rspace: 0pt !important;
                    }
        
                    /* What it does: Fixes webkit padding issue. */
                    table {
                        border-spacing: 0 !important;
                        border-collapse: collapse !important;
                        table-layout: fixed !important;
                        margin: 0 auto !important;
                    }
        
                    /* What it does: Uses a better rendering method when resizing images in IE. */
                    img {
                        -ms-interpolation-mode: bicubic;
                    }
        
                    /* What it does: Prevents Windows 10 Mail from underlining links despite inline CSS. Styles for underlined links should be inline. */
                    a {
                        text-decoration: none;
                    }
        
                    /* What it does: A work-around for email clients meddling in triggered links. */
                    *[x-apple-data-detectors],  /* iOS */
                .unstyle-auto-detected-links *,
                .aBn {
                        border-bottom: 0 !important;
                        cursor: default !important;
                        color: inherit !important;
                        text-decoration: none !important;
                        font-size: inherit !important;
                        font-family: inherit !important;
                        font-weight: inherit !important;
                        line-height: inherit !important;
                    }
        
                    /* What it does: Prevents Gmail from displaying a download button on large, non-linked images. */
                    .a6S {
                        display: none !important;
                        opacity: 0.01 !important;
                    }
        
                    /* What it does: Prevents Gmail from changing the text color in conversation threads. */
                    .im {
                        color: inherit !important;
                    }
        
                    /* If the above doesn't work, add a .g-img class to any image in question. */
                    img.g-img + div {
                        display: none !important;
                    }
        
                    /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */
                    /* Create one of these media queries for each additional viewport size you'd like to fix */
        
                    /* iPhone 4, 4S, 5, 5S, 5C, and 5SE */
                    @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
                        u ~ div .email-container {
                            min-width: 320px !important;
                        }
                    }
                    /* iPhone 6, 6S, 7, 8, and X */
                    @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
                        u ~ div .email-container {
                            min-width: 375px !important;
                        }
                    }
                    /* iPhone 6+, 7+, and 8+ */
                    @media only screen and (min-device-width: 414px) {
                        u ~ div .email-container {
                            min-width: 414px !important;
                        }
                    }
                </style>
        
                <!-- CSS Reset : END -->
        
                <!-- Progressive Enhancements : BEGIN -->
                <style>
                    .primary {
                        background: #2f89fc;
                    }
                    .bg_white {
                        background: #ffffff;
                    }
                    .bg_light {
                        background: #fafafa;
                    }
                    .bg_black {
                        background: #000000;
                    }
                    .bg_dark {
                        background: rgba(0, 0, 0, 0.8);
                    }
                    .email-section {
                        padding: 2.5em;
                    }
        
                    /*BUTTON*/
                    .btn {
                        padding: 5px 15px;
                        display: inline-block;
                    }
                    .btn.btn-primary {
                        border-radius: 5px;
                        background: #2f89fc;
                        color: #ffffff;
                    }
                    .btn.btn-primary:hover {
                        border-radius: 5px;
                        background: #509cff;
                        color: #ffffff;
                    }
                    .btn.btn-white {
                        border-radius: 5px;
                        background: #ffffff;
                        color: #000000;
                    }
                    .btn.btn-white-outline {
                        border-radius: 5px;
                        background: transparent;
                        border: 1px solid #fff;
                        color: #fff;
                    }
        
                    h1,
                    h2,
                    h3,
                    h4,
                    h5,
                    h6 {
                        font-family: "Montserrat", sans-serif;
                        color: #000000;
                        margin-top: 0;
                        font-weight: 400;
                    }
        
                    h4 span.approved {
                        color: red;
                        font-weight: 700;
                    }
        
                    body {
                        font-family: "Montserrat", sans-serif;
                        font-weight: 400;
                        font-size: 15px;
                        line-height: 1.8;
                        color: #000000;
                    }
        
                    a {
                        color: #2f89fc;
                    }
        
                    table {
                    }
                    /*LOGO*/
        
                    .logo h1 {
                        margin: 0;
                    }
                    .logo h1 a {
                        color: #000000;
                        font-size: 20px;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-family: "Montserrat", sans-serif;
                    }
        
                    .navigation {
                        padding: 0;
                    }
                    .navigation li {
                        list-style: none;
                        display: inline-block;
                        margin-left: 5px;
                        font-size: 13px;
                        font-weight: 500;
                    }
                    .navigation li a {
                        color: rgba(0, 0, 0, 0.4);
                    }
        
                    /*HERO*/
                    .hero {
                        position: relative;
                        z-index: 0;
                    }
        
                    .hero .text {
                        color: rgba(0, 0, 0, 0.3);
                    }
                    .hero .text h2 {
                        color: #000;
                        font-size: 30px;
                        margin-bottom: 0;
                        font-weight: 300;
                    }
                    .hero .text h2 span {
                        font-weight: 600;
                        color: #2f89fc;
                    }
        
                    /*HEADING SECTION*/
                    .heading-section {
                    }
                    .heading-section h2 {
                        color: #000000;
                        font-size: 28px;
                        margin-top: 0;
                        line-height: 1.4;
                        font-weight: 400;
                    }
                    .heading-section .subheading {
                        margin-bottom: 20px !important;
                        display: inline-block;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: rgba(0, 0, 0, 0.4);
                        position: relative;
                    }
                    .heading-section .subheading::after {
                        position: absolute;
                        left: 0;
                        right: 0;
                        bottom: -10px;
                        content: "";
                        width: 100%;
                        height: 2px;
                        background: #2f89fc;
                        margin: 0 auto;
                    }
        
                    .heading-section-white {
                        color: rgba(255, 255, 255, 0.8);
                    }
                    .heading-section-white h2 {
                        line-height: 1;
                        padding-bottom: 0;
                    }
                    .heading-section-white h2 {
                        color: #ffffff;
                    }
                    .heading-section-white .subheading {
                        margin-bottom: 0;
                        display: inline-block;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: rgba(255, 255, 255, 0.4);
                    }
        
                    /*PROJECT*/
                    .text-project {
                        padding-top: 10px;
                    }
                    .text-project h3 {
                        margin-bottom: 0;
                    }
                    .text-project h3 a {
                        color: #000;
                    }
        
                    /*FOOTER*/
        
                    .footer {
                        color: rgba(255, 255, 255, 0.5);
                    }
                    .footer .heading {
                        color: #ffffff;
                        font-size: 20px;
                    }
                    .footer ul {
                        margin: 0;
                        padding: 0;
                    }
                    .footer ul li {
                        list-style: none;
                        margin-bottom: 10px;
                    }
                    .footer ul li a {
                        color: rgba(255, 255, 255, 1);
                    }
        
                    @media screen and (max-width: 500px) {
                    }
                </style>
            </head>
            <body
                width="100%"
                style="
                    margin: 0;
                    padding: 0 !important;
                    mso-line-height-rule: exactly;
                    background-color: #222222;
                "
            >
                <center style="width: 100%; background-color: #f1f1f1">
                    <div
                        style="max-width: 600px; margin: 0 auto"
                        class="email-container"
                    >
                        <table
                            align="center"
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            width="100%"
                            style="margin: auto"
                            class="bg_white"
                        >
                            <tr>
                                <td
                                    valign="top"
                                    class="bg_white"
                                    style="padding: 1em 2.5em"
                                >
                                    <table
                                        role="presentation"
                                        border="0"
                                        cellpadding="0"
                                        cellspacing="0"
                                        width="100%"
                                    >
                                        <tr>
                                            <td class="logo" style="text-align: left">
                                                <img
                                                    width="40%"
                                                    src="https://safetyfirstindonesia.co.id/assets/uploads/images/9f09b-kpn-corp.png"
                                                />
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <table>
                                    <tr>
                                        <td
                                            valign="top"
                                            class="bg_white"
                                            style="padding: 1em 2.5em"
                                        >
                                            <h4>
                                                Dear Procurement, <br />
                                                Vendor mentioned below
                                                <span class="approved"
                                                    >have rejected by CEO</span
                                                >
                                                as tender at KPN Corp :
                                            </h4>
                                        </td>
                                    </tr>
                                </table>
                            </tr>
                            <tr>
                                <table class="bg_white" width="100%">
                                    <tr>
                                        <td width="20%" style="padding: 0.1em 2.5em">
                                            Vendor Name
                                        </td>
                                        <td style="padding: 0.1em 2.5em">
                                            : ${ven_name}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td width="20%" style="padding: 0.1em 2.5em">
                                            Vendor Type
                                        </td>
                                        <td style="padding: 0.1em 2.5em">
                                            : ${ven_type}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td width="20%" style="padding: 0.1em 2.5em">
                                            Company
                                        </td>
                                        <td style="padding: 0.1em 2.5em">
                                            : ${company}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td width="50%" style="padding: 1em 2.5em">
                                            Reason
                                        </td>
                                        <td style="padding: 0.1em 2.5em 2em">
                                            <div
                                                style="
                                                    padding: 1em;
                                                    border: 1px solid black;
                                                "
                                            >
                                                ${reason}
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td syle="padding-bottom: 5em">
                                            <div style="height: 14em"></div>
                                        </td>
                                    </tr>
                                </table>
                            </tr>
                        </table>
                        <table
                            align="center"
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            width="100%"
                            style="margin: auto"
                        >
                            <tr>
                                <td
                                    valign="middle"
                                    class="bg_black footer email-section"
                                >
                                    <table>
                                        <tr>
                                            <td>KPN Corp Copyright 2023</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </div>
                </center>
            </body>
        </html>
        `;
    },
    notifRejectMgrPrc: (ven_name, ven_type, company, reason) => {
        return `
        <!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width" />
        <title>Email Notification</title>
        <link
            href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap"
            rel="stylesheet"
        />
        <style>
            html,
            body {
                margin: 0 auto !important;
                padding: 0 !important;
                height: 100% !important;
                width: 100% !important;
                background: #f1f1f1;
            }

            /* What it does: Stops email clients resizing small text. */
            * {
                -ms-text-size-adjust: 100%;
                -webkit-text-size-adjust: 100%;
            }

            /* What it does: Centers email on Android 4.4 */
            div[style*="margin: 16px 0"] {
                margin: 0 !important;
            }

            /* What it does: Stops Outlook from adding extra spacing to tables. */
            table,
            td {
                mso-table-lspace: 0pt !important;
                mso-table-rspace: 0pt !important;
            }

            /* What it does: Fixes webkit padding issue. */
            table {
                border-spacing: 0 !important;
                border-collapse: collapse !important;
                table-layout: fixed !important;
                margin: 0 auto !important;
            }

            /* What it does: Uses a better rendering method when resizing images in IE. */
            img {
                -ms-interpolation-mode: bicubic;
            }

            /* What it does: Prevents Windows 10 Mail from underlining links despite inline CSS. Styles for underlined links should be inline. */
            a {
                text-decoration: none;
            }

            /* What it does: A work-around for email clients meddling in triggered links. */
            *[x-apple-data-detectors],  /* iOS */
        .unstyle-auto-detected-links *,
        .aBn {
                border-bottom: 0 !important;
                cursor: default !important;
                color: inherit !important;
                text-decoration: none !important;
                font-size: inherit !important;
                font-family: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
            }

            /* What it does: Prevents Gmail from displaying a download button on large, non-linked images. */
            .a6S {
                display: none !important;
                opacity: 0.01 !important;
            }

            /* What it does: Prevents Gmail from changing the text color in conversation threads. */
            .im {
                color: inherit !important;
            }

            /* If the above doesn't work, add a .g-img class to any image in question. */
            img.g-img + div {
                display: none !important;
            }

            /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */
            /* Create one of these media queries for each additional viewport size you'd like to fix */

            /* iPhone 4, 4S, 5, 5S, 5C, and 5SE */
            @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
                u ~ div .email-container {
                    min-width: 320px !important;
                }
            }
            /* iPhone 6, 6S, 7, 8, and X */
            @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
                u ~ div .email-container {
                    min-width: 375px !important;
                }
            }
            /* iPhone 6+, 7+, and 8+ */
            @media only screen and (min-device-width: 414px) {
                u ~ div .email-container {
                    min-width: 414px !important;
                }
            }
        </style>

        <!-- CSS Reset : END -->

        <!-- Progressive Enhancements : BEGIN -->
        <style>
            .primary {
                background: #2f89fc;
            }
            .bg_white {
                background: #ffffff;
            }
            .bg_light {
                background: #fafafa;
            }
            .bg_black {
                background: #000000;
            }
            .bg_dark {
                background: rgba(0, 0, 0, 0.8);
            }
            .email-section {
                padding: 2.5em;
            }

            /*BUTTON*/
            .btn {
                padding: 5px 15px;
                display: inline-block;
            }
            .btn.btn-primary {
                border-radius: 5px;
                background: #2f89fc;
                color: #ffffff;
            }
            .btn.btn-white {
                border-radius: 5px;
                background: #ffffff;
                color: #000000;
            }
            .btn.btn-white-outline {
                border-radius: 5px;
                background: transparent;
                border: 1px solid #fff;
                color: #fff;
            }

            h1,
            h2,
            h3,
            h4,
            h5,
            h6 {
                font-family: "Montserrat", sans-serif;
                color: #000000;
                margin-top: 0;
                font-weight: 400;
            }

            h4 span.approved {
                color: red;
                font-weight: 700;
            }

            body {
                font-family: "Montserrat", sans-serif;
                font-weight: 400;
                font-size: 15px;
                line-height: 1.8;
                color: #000000;
            }

            a {
                color: #2f89fc;
            }

            table {
            }
            /*LOGO*/

            .logo h1 {
                margin: 0;
            }
            .logo h1 a {
                color: #000000;
                font-size: 20px;
                font-weight: 700;
                text-transform: uppercase;
                font-family: "Montserrat", sans-serif;
            }

            .navigation {
                padding: 0;
            }
            .navigation li {
                list-style: none;
                display: inline-block;
                margin-left: 5px;
                font-size: 13px;
                font-weight: 500;
            }
            .navigation li a {
                color: rgba(0, 0, 0, 0.4);
            }

            /*HERO*/
            .hero {
                position: relative;
                z-index: 0;
            }

            .hero .text {
                color: rgba(0, 0, 0, 0.3);
            }
            .hero .text h2 {
                color: #000;
                font-size: 30px;
                margin-bottom: 0;
                font-weight: 300;
            }
            .hero .text h2 span {
                font-weight: 600;
                color: #2f89fc;
            }

            /*HEADING SECTION*/
            .heading-section {
            }
            .heading-section h2 {
                color: #000000;
                font-size: 28px;
                margin-top: 0;
                line-height: 1.4;
                font-weight: 400;
            }
            .heading-section .subheading {
                margin-bottom: 20px !important;
                display: inline-block;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: rgba(0, 0, 0, 0.4);
                position: relative;
            }
            .heading-section .subheading::after {
                position: absolute;
                left: 0;
                right: 0;
                bottom: -10px;
                content: "";
                width: 100%;
                height: 2px;
                background: #2f89fc;
                margin: 0 auto;
            }

            .heading-section-white {
                color: rgba(255, 255, 255, 0.8);
            }
            .heading-section-white h2 {
                line-height: 1;
                padding-bottom: 0;
            }
            .heading-section-white h2 {
                color: #ffffff;
            }
            .heading-section-white .subheading {
                margin-bottom: 0;
                display: inline-block;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: rgba(255, 255, 255, 0.4);
            }

            /*PROJECT*/
            .text-project {
                padding-top: 10px;
            }
            .text-project h3 {
                margin-bottom: 0;
            }
            .text-project h3 a {
                color: #000;
            }

            /*FOOTER*/

            .footer {
                color: rgba(255, 255, 255, 0.5);
            }
            .footer .heading {
                color: #ffffff;
                font-size: 20px;
            }
            .footer ul {
                margin: 0;
                padding: 0;
            }
            .footer ul li {
                list-style: none;
                margin-bottom: 10px;
            }
            .footer ul li a {
                color: rgba(255, 255, 255, 1);
            }

            @media screen and (max-width: 500px) {
            }
        </style>
    </head>
    <body
        width="100%"
        style="
            margin: 0;
            padding: 0 !important;
            mso-line-height-rule: exactly;
            background-color: #222222;
        "
    >
        <center style="width: 100%; background-color: #f1f1f1">
            <div
                style="max-width: 600px; margin: 0 auto"
                class="email-container"
            >
                <table
                    align="center"
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    width="100%"
                    style="margin: auto"
                    class="bg_white"
                >
                    <tr>
                        <td
                            valign="top"
                            class="bg_white"
                            style="padding: 1em 2.5em"
                        >
                            <table
                                role="presentation"
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                            >
                                <tr>
                                    <td class="logo" style="text-align: left">
                                        <img
                                            width="40%"
                                            src="https://safetyfirstindonesia.co.id/assets/uploads/images/9f09b-kpn-corp.png"
                                        />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <table>
                            <tr>
                                <td
                                    valign="top"
                                    class="bg_white"
                                    style="padding: 1em 2.5em"
                                >
                                    <h4>
                                        Dear Procurement, <br />
                                        Vendor mentioned below
                                        <span class="approved"
                                            >have rejected by Manager</span
                                        >
                                    </h4>
                                </td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr>
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Vendor Name
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${ven_name}
                                </td>
                            </tr>
                            <tr>
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Vendor Type
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${ven_type}
                                </td>
                            </tr>
                            <tr>
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Company
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${company}
                                </td>
                            </tr>
                            <tr>
                                <td width="50%" style="padding: 1em 2.5em">
                                    Reason
                                </td>
                                <td style="padding: 0.1em 2.5em 2em">
                                    <div
                                        style="
                                            padding: 1em;
                                            border: 1px solid black;
                                        "
                                    >
                                        ${reason}
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td syle="padding-bottom: 5em">
                                    <div style="height: 14em"></div>
                                </td>
                            </tr>
                        </table>
                    </tr>
                </table>
                <table
                    align="center"
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    width="100%"
                    style="margin: auto"
                >
                    <tr>
                        <td
                            valign="middle"
                            class="bg_black footer email-section"
                        >
                            <table>
                                <tr>
                                    <td>KPN Corp Copyright 2023</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>
        </center>
    </body>
</html>
`;
    },
    toMdm: (ticket_num, title, local_ovs, ven_name, link) => {
        return `<!doctype html>
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width" />
                <title>Email Notification</title>
                <link
                    href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap"
                    rel="stylesheet"
                />
                <style>
                    html,
                    body {
                        margin: 0 auto !important;
                        padding: 0 !important;
                        height: 100% !important;
                        width: 100% !important;
                        background: #f1f1f1;
                    }
        
                    /* What it does: Stops email clients resizing small text. */
                    * {
                        -ms-text-size-adjust: 100%;
                        -webkit-text-size-adjust: 100%;
                    }
        
                    /* What it does: Centers email on Android 4.4 */
                    div[style*="margin: 16px 0"] {
                        margin: 0 !important;
                    }
        
                    /* What it does: Stops Outlook from adding extra spacing to tables. */
                    table,
                    td {
                        mso-table-lspace: 0pt !important;
                        mso-table-rspace: 0pt !important;
                    }
        
                    /* What it does: Fixes webkit padding issue. */
                    table {
                        border-spacing: 0 !important;
                        border-collapse: collapse !important;
                        table-layout: fixed !important;
                        margin: 0 auto !important;
                    }
        
                    /* What it does: Uses a better rendering method when resizing images in IE. */
                    img {
                        -ms-interpolation-mode: bicubic;
                    }
        
                    /* What it does: Prevents Windows 10 Mail from underlining links despite inline CSS. Styles for underlined links should be inline. */
                    a {
                        text-decoration: none;
                    }
        
                    /* What it does: A work-around for email clients meddling in triggered links. */
                    *[x-apple-data-detectors],  /* iOS */
                .unstyle-auto-detected-links *,
                .aBn {
                        border-bottom: 0 !important;
                        cursor: default !important;
                        color: inherit !important;
                        text-decoration: none !important;
                        font-size: inherit !important;
                        font-family: inherit !important;
                        font-weight: inherit !important;
                        line-height: inherit !important;
                    }
        
                    /* What it does: Prevents Gmail from displaying a download button on large, non-linked images. */
                    .a6S {
                        display: none !important;
                        opacity: 0.01 !important;
                    }
        
                    /* What it does: Prevents Gmail from changing the text color in conversation threads. */
                    .im {
                        color: inherit !important;
                    }
        
                    /* If the above doesn't work, add a .g-img class to any image in question. */
                    img.g-img + div {
                        display: none !important;
                    }
        
                    /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */
                    /* Create one of these media queries for each additional viewport size you'd like to fix */
        
                    /* iPhone 4, 4S, 5, 5S, 5C, and 5SE */
                    @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
                        u ~ div .email-container {
                            min-width: 320px !important;
                        }
                    }
                    /* iPhone 6, 6S, 7, 8, and X */
                    @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
                        u ~ div .email-container {
                            min-width: 375px !important;
                        }
                    }
                    /* iPhone 6+, 7+, and 8+ */
                    @media only screen and (min-device-width: 414px) {
                        u ~ div .email-container {
                            min-width: 414px !important;
                        }
                    }
                </style>
        
                <!-- CSS Reset : END -->
        
                <!-- Progressive Enhancements : BEGIN -->
                <style>
                    .primary {
                        background: #2f89fc;
                    }
                    .bg_white {
                        background: #ffffff;
                    }
                    .bg_light {
                        background: #fafafa;
                    }
                    .bg_black {
                        background: #000000;
                    }
                    .bg_dark {
                        background: rgba(0, 0, 0, 0.8);
                    }
                    .email-section {
                        padding: 2.5em;
                    }
        
                    /*BUTTON*/
                    .btn {
                        padding: 5px 15px;
                        display: inline-block;
                    }
                    .btn.btn-primary {
                        border-radius: 5px;
                        background: #2f89fc;
                        color: #ffffff;
                    }
                    .btn.btn-primary:hover {
                        border-radius: 5px;
                        background: #509cff;
                        color: #ffffff;
                    }
                    .btn.btn-white {
                        border-radius: 5px;
                        background: #ffffff;
                        color: #000000;
                    }
                    .btn.btn-white-outline {
                        border-radius: 5px;
                        background: transparent;
                        border: 1px solid #fff;
                        color: #fff;
                    }
        
                    h1,
                    h2,
                    h3,
                    h4,
                    h5,
                    h6 {
                        font-family: "Montserrat", sans-serif;
                        color: #000000;
                        margin-top: 0;
                        font-weight: 400;
                    }
        
                    body {
                        font-family: "Montserrat", sans-serif;
                        font-weight: 400;
                        font-size: 15px;
                        line-height: 1.8;
                        color: #000000;
                    }
        
                    a {
                        color: #2f89fc;
                    }
        
                    table {
                    }
                    /*LOGO*/
        
                    .logo h1 {
                        margin: 0;
                    }
                    .logo h1 a {
                        color: #000000;
                        font-size: 20px;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-family: "Montserrat", sans-serif;
                    }
        
                    .navigation {
                        padding: 0;
                    }
                    .navigation li {
                        list-style: none;
                        display: inline-block;
                        margin-left: 5px;
                        font-size: 13px;
                        font-weight: 500;
                    }
                    .navigation li a {
                        color: rgba(0, 0, 0, 0.4);
                    }
        
                    /*HERO*/
                    .hero {
                        position: relative;
                        z-index: 0;
                    }
        
                    .hero .text {
                        color: rgba(0, 0, 0, 0.3);
                    }
                    .hero .text h2 {
                        color: #000;
                        font-size: 30px;
                        margin-bottom: 0;
                        font-weight: 300;
                    }
                    .hero .text h2 span {
                        font-weight: 600;
                        color: #2f89fc;
                    }
        
                    /*HEADING SECTION*/
                    .heading-section {
                    }
                    .heading-section h2 {
                        color: #000000;
                        font-size: 28px;
                        margin-top: 0;
                        line-height: 1.4;
                        font-weight: 400;
                    }
                    .heading-section .subheading {
                        margin-bottom: 20px !important;
                        display: inline-block;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: rgba(0, 0, 0, 0.4);
                        position: relative;
                    }
                    .heading-section .subheading::after {
                        position: absolute;
                        left: 0;
                        right: 0;
                        bottom: -10px;
                        content: "";
                        width: 100%;
                        height: 2px;
                        background: #2f89fc;
                        margin: 0 auto;
                    }
        
                    .heading-section-white {
                        color: rgba(255, 255, 255, 0.8);
                    }
                    .heading-section-white h2 {
                        line-height: 1;
                        padding-bottom: 0;
                    }
                    .heading-section-white h2 {
                        color: #ffffff;
                    }
                    .heading-section-white .subheading {
                        margin-bottom: 0;
                        display: inline-block;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: rgba(255, 255, 255, 0.4);
                    }
        
                    /*FOOTER*/
        
                    .footer {
                        color: rgba(255, 255, 255, 0.5);
                    }
                    .footer .heading {
                        color: #ffffff;
                        font-size: 20px;
                    }
                    .footer ul {
                        margin: 0;
                        padding: 0;
                    }
                    .footer ul li {
                        list-style: none;
                        margin-bottom: 10px;
                    }
                    .footer ul li a {
                        color: rgba(255, 255, 255, 1);
                    }
        
                    @media screen and (max-width: 500px) {
                    }
                </style>
            </head>
            <body
                width="100%"
                style="
                    margin: 0;
                    padding: 0 !important;
                    mso-line-height-rule: exactly;
                    background-color: #222222;
                "
            >
                <center style="width: 100%; background-color: #f1f1f1">
                    <div
                        style="max-width: 600px; margin: 0 auto"
                        class="email-container"
                    >
                        <table
                            align="center"
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            width="100%"
                            style="margin: auto"
                            class="bg_white"
                        >
                            <tr>
                                <td
                                    valign="top"
                                    class="bg_white"
                                    style="padding: 1em 2.5em"
                                >
                                    <table
                                        role="presentation"
                                        border="0"
                                        cellpadding="0"
                                        cellspacing="0"
                                        width="100%"
                                    >
                                        <tr>
                                            <td class="logo" style="text-align: left">
                                                <img
                                                    width="40%"
                                                    src="https://safetyfirstindonesia.co.id/assets/uploads/images/9f09b-kpn-corp.png"
                                                />
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <table style="width: 100%">
                                    <tr>
                                        <td
                                            valign="top"
                                            class="bg_white"
                                            style="padding: 1em 2.5em"
                                        >
                                            <h4>
                                                Kepada Yth. Bapak/Ibu <br />
                                                Mohon proses Request Registrasi Vendor
                                                dengan detail berikut :
                                            </h4>
                                        </td>
                                    </tr>
                                </table>
                            </tr>
                            <tr>
                                <table class="bg_white" width="100%">
                                    <tr>
                                        <td width="30%" style="padding: 0.1em 2.5em">
                                            Ticket Number
                                        </td>
                                        <td style="padding: 0.1em 2.5em">
                                            : ${ticket_num}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td width="30%" style="padding: 0.1em 2.5em">
                                            Title
                                        </td>
                                        <td style="padding: 0.1em 2.5em">: ${title}</td>
                                    </tr>
                                    <tr>
                                        <td width="30%" style="padding: 0.1em 2.5em">
                                            Local / Overseas
                                        </td>
                                        <td style="padding: 0.1em 2.5em">
                                            : ${local_ovs}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td width="30%" style="padding: 0.1em 2.5em">
                                            Vendor Name
                                        </td>
                                        <td style="padding: 0.1em 2.5em">
                                            : ${ven_name}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-top: 1rem"></td>
                                    </tr>
                                </table>
                            </tr>
                            <tr>
                                <table style="width: 100%">
                                    <tr>
                                        <td
                                            valign="top"
                                            class="bg_white"
                                            style="padding: 1em 2.5em"
                                        >
                                            <h4>
                                                Dapat diakses dilink berikut :
                                                <a href="${link}">${link}</a>
                                            </h4>
                                        </td>
                                    </tr>
                                </table>
                            </tr>
                        </table>
                        <table
                            align="center"
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            width="100%"
                            style="margin: auto"
                        >
                            <tr>
                                <td
                                    valign="middle"
                                    class="bg_black footer email-section"
                                >
                                    <table>
                                        <tr>
                                            <td>KPN Corp Copyright 2023</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </div>
                </center>
            </body>
        </html>
        `;
    },
    toMGRPRC: (detail, rowbank, approve, reject, opening) => {
        return `
        <!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width" />
        <title>Email Notification</title>
        <link
            href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap"
            rel="stylesheet"
        />
        <style>
            html,
            body {
                margin: 0 auto !important;
                padding: 0 !important;
                height: 100% !important;
                width: 100% !important;
                background: #f1f1f1;
            }

            /* What it does: Stops email clients resizing small text. */
            * {
                -ms-text-size-adjust: 100%;
                -webkit-text-size-adjust: 100%;
            }

            /* What it does: Centers email on Android 4.4 */
            div[style*="margin: 16px 0"] {
                margin: 0 !important;
            }

            /* What it does: Stops Outlook from adding extra spacing to tables. */
            table,
            td {
                mso-table-lspace: 0pt !important;
                mso-table-rspace: 0pt !important;
            }

            .detail {
                font-size: 10pt;
            }

            .section-detail {
                font-size: 12pt;
                font-weight: bold;
            }

            .section-detail > td {
                padding: 0.1em 2.5em;
            }

            /* What it does: Fixes webkit padding issue. */
            table {
                border-spacing: 0 !important;
                border-collapse: collapse !important;
                table-layout: fixed !important;
                margin: 0 auto !important;
            }

            /* What it does: Uses a better rendering method when resizing images in IE. */
            img {
                -ms-interpolation-mode: bicubic;
            }

            /* What it does: Prevents Windows 10 Mail from underlining links despite inline CSS. Styles for underlined links should be inline. */
            a {
                text-decoration: none;
            }

            /* What it does: A work-around for email clients meddling in triggered links. */
            *[x-apple-data-detectors],  /* iOS */
        .unstyle-auto-detected-links *,
        .aBn {
                border-bottom: 0 !important;
                cursor: default !important;
                color: inherit !important;
                text-decoration: none !important;
                font-size: inherit !important;
                font-family: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
            }

            /* What it does: Prevents Gmail from displaying a download button on large, non-linked images. */
            .a6S {
                display: none !important;
                opacity: 0.01 !important;
            }

            /* What it does: Prevents Gmail from changing the text color in conversation threads. */
            .im {
                color: inherit !important;
            }

            /* If the above doesn't work, add a .g-img class to any image in question. */
            img.g-img + div {
                display: none !important;
            }

            #tabledet {
                width: 100%;
                overflow: scroll;
                background-color: #f2f2f2;
            }

            #tabledet th {
                padding-top: 12px;
                padding-bottom: 12px;
                padding-left: 10px;
                padding-right: 10px;
                text-align: left;
                font-size: 8pt;
                background-color: #800000;
                color: white;
            }

            #tabledet td {
                font-size: 8pt;
                padding: 1rem;
                font-weight: 800;
                color: rgb(0, 0, 0);
                width: 100px;
                border: 1px solid white;
                background-color: #ffd1d1;
                border-collapse: collapse;
            }

            #tabledet tr {
                background-color: #f2f2f2;
            }

            /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */
            /* Create one of these media queries for each additional viewport size you'd like to fix */

            /* iPhone 4, 4S, 5, 5S, 5C, and 5SE */
            @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
                u ~ div .email-container {
                    min-width: 320px !important;
                }
            }
            /* iPhone 6, 6S, 7, 8, and X */
            @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
                u ~ div .email-container {
                    min-width: 375px !important;
                }
            }
            /* iPhone 6+, 7+, and 8+ */
            @media only screen and (min-device-width: 414px) {
                u ~ div .email-container {
                    min-width: 414px !important;
                }
            }
        </style>

        <!-- CSS Reset : END -->

        <!-- Progressive Enhancements : BEGIN -->
        <style>
            .primary {
                background: #2f89fc;
            }
            .bg_white {
                background: #ffffff;
            }
            .bg_light {
                background: #fafafa;
            }
            .bg_black {
                background: #000000;
            }
            .bg_dark {
                background: rgba(0, 0, 0, 0.8);
            }
            .email-section {
                padding: 2.5em;
            }

            /*BUTTON*/
            .btn {
                padding: 5px 15px;
                display: inline-block;
            }
            .btn.btn-primary {
                border-radius: 5px;
                background: #2f89fc;
                color: #ffffff;
            }
            .btn.btn-primary:hover {
                border-radius: 5px;
                background: #509cff;
                color: #ffffff;
            }
            .btn.btn-white {
                border-radius: 5px;
                background: #ffffff;
                color: #000000;
            }
            .btn.btn-white-outline {
                border-radius: 5px;
                background: transparent;
                border: 1px solid #fff;
                color: #fff;
            }

            h1,
            h2,
            h3,
            h4,
            h5,
            h6 {
                font-family: "Montserrat", sans-serif;
                color: #000000;
                margin-top: 0;
                font-weight: 400;
            }

            body {
                font-family: "Montserrat", sans-serif;
                font-weight: 400;
                font-size: 15px;
                line-height: 1.8;
                color: #000000;
            }

            a {
                color: #2f89fc;
            }

            table {
            }
            /*LOGO*/

            .logo h1 {
                margin: 0;
            }
            .logo h1 a {
                color: #000000;
                font-size: 20px;
                font-weight: 700;
                text-transform: uppercase;
                font-family: "Montserrat", sans-serif;
            }

            .navigation {
                padding: 0;
            }
            .navigation li {
                list-style: none;
                display: inline-block;
                margin-left: 5px;
                font-size: 13px;
                font-weight: 500;
            }
            .navigation li a {
                color: rgba(0, 0, 0, 0.4);
            }

            /*HERO*/
            .hero {
                position: relative;
                z-index: 0;
            }

            .hero .text {
                color: rgba(0, 0, 0, 0.3);
            }
            .hero .text h2 {
                color: #000;
                font-size: 30px;
                margin-bottom: 0;
                font-weight: 300;
            }
            .hero .text h2 span {
                font-weight: 600;
                color: #2f89fc;
            }

            /*HEADING SECTION*/
            .heading-section {
            }
            .heading-section h2 {
                color: #000000;
                font-size: 28px;
                margin-top: 0;
                line-height: 1.4;
                font-weight: 400;
            }
            .heading-section .subheading {
                margin-bottom: 20px !important;
                display: inline-block;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: rgba(0, 0, 0, 0.4);
                position: relative;
            }
            .heading-section .subheading::after {
                position: absolute;
                left: 0;
                right: 0;
                bottom: -10px;
                content: "";
                width: 100%;
                height: 2px;
                background: #2f89fc;
                margin: 0 auto;
            }

            .heading-section-white {
                color: rgba(255, 255, 255, 0.8);
            }
            .heading-section-white h2 {
                line-height: 1;
                padding-bottom: 0;
            }
            .heading-section-white h2 {
                color: #ffffff;
            }
            .heading-section-white .subheading {
                margin-bottom: 0;
                display: inline-block;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: rgba(255, 255, 255, 0.4);
            }

            /*FOOTER*/

            .footer {
                color: rgba(255, 255, 255, 0.5);
            }
            .footer .heading {
                color: #ffffff;
                font-size: 20px;
            }
            .footer ul {
                margin: 0;
                padding: 0;
            }
            .footer ul li {
                list-style: none;
                margin-bottom: 10px;
            }
            .footer ul li a {
                color: rgba(255, 255, 255, 1);
            }

            @media screen and (max-width: 500px) {
            }
        </style>
    </head>
    <body
        width="100%"
        style="
            margin: 0;
            padding: 0 !important;
            mso-line-height-rule: exactly;
            background-color: #222222;
        "
    >
        <center style="width: 100%; background-color: #f1f1f1">
            <div
                style="max-width: 1000px; margin: 0 auto"
                class="email-container"
            >
                <table
                    align="center"
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    width="100%"
                    style="margin: auto"
                    class="bg_white"
                >
                    <tr>
                        <td
                            valign="top"
                            class="bg_white"
                            style="padding: 1em 2.5em"
                        >
                            <table
                                role="presentation"
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                            >
                                <tr>
                                    <td class="logo" style="text-align: left">
                                        <img
                                            width="40%"
                                            src="https://safetyfirstindonesia.co.id/assets/uploads/images/9f09b-kpn-corp.png"
                                        />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <table style="width: 100%">
                            <tr>
                                <td
                                    valign="top"
                                    class="bg_white"
                                    style="padding: 1em 2.5em"
                                >
                                    <h4>${opening}</h4>
                                </td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr class="section-detail">
                                <td>Vendor Details</td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Requestor
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.fullname} (${detail.email})
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Title
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.title}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Local / Overseas
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.local_ovs}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Vendor Name
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.name_1}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 1rem"></td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr class="section-detail">
                                <td>Address</td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Street
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${[
                                        detail.street,
                                        detail.street2,
                                        detail.street3,
                                        detail.street4,
                                    ].join(" ")}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Country
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.country}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Postal Code
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.postal}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    City
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.city}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 1rem"></td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr class="section-detail">
                                <td>Tax and Payment</td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Tax Number
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.npwp}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Payment Method
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.pay_mthd}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Payment Term
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.pay_term}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    PPN
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.ppn}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 1rem"></td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr class="section-detail">
                                <td>Company Details</td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Company
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.company}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Purchasing Organization
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.purch_org}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Vendor Group
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.ven_group.replace("_", " ")}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Vendor Account
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.ven_acc.replace("_", " ")}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Vendor Type
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.ven_type}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Limit
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.lim_curr ?? ""} ${
                                        detail.limit_vendor
                                            ? parseInt(detail.limit_vendor)
                                                  .toFixed(2)
                                                  .replace(
                                                      /\d(?=(\d{3})+\.)/g,
                                                      "$&,"
                                                  )
                                            : ""
                                    }
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Description
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.description}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 1rem"></td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table id="tabledet">
                            <tr>
                                <th>Country</th>
                                <th>Bank Name</th>
                                <th>Currency</th>
                                <th>Bank Account</th>
                                <th>Account Holder</th>
                            </tr>
                            ${rowbank}
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr>
                                <td width="20%" style="padding: 2em 2.5em">
                                    Action
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    <a href="${approve}">
                                        <button
                                            class="btn btn-primary"
                                            style="
                                                padding-left: 2em;
                                                padding-right: 2em;
                                                padding-top: 1em;
                                                padding-bottom: 1em;
                                            "
                                        >
                                            Yes
                                        </button>
                                    </a>
                                    <a href="${reject}">
                                        <button
                                            class="btn btn-primary"
                                            style="
                                                padding-left: 2em;
                                                padding-right: 2em;
                                                padding-top: 1em;
                                                padding-bottom: 1em;
                                            "
                                        >
                                            No
                                        </button>
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </tr>
                </table>
                <table
                    align="center"
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    width="100%"
                    style="margin: auto"
                >
                    <tr>
                        <td
                            valign="middle"
                            class="bg_black footer email-section"
                        >
                            <table>
                                <tr>
                                    <td>KPN Corp Copyright 2023</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>
        </center>
    </body>
</html>

`;
    },
    toNotifPajak: (detail, ven_code) => {
        return `
        <!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width" />
        <title>Email Notification</title>
        <link
            href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap"
            rel="stylesheet"
        />
        <style>
            html,
            body {
                margin: 0 auto !important;
                padding: 0 !important;
                height: 100% !important;
                width: 100% !important;
                background: #f1f1f1;
            }

            /* What it does: Stops email clients resizing small text. */
            * {
                -ms-text-size-adjust: 100%;
                -webkit-text-size-adjust: 100%;
            }

            /* What it does: Centers email on Android 4.4 */
            div[style*="margin: 16px 0"] {
                margin: 0 !important;
            }

            /* What it does: Stops Outlook from adding extra spacing to tables. */
            table,
            td {
                mso-table-lspace: 0pt !important;
                mso-table-rspace: 0pt !important;
            }

            .detail {
                font-size: 10pt;
            }

            .section-detail {
                font-size: 12pt;
                font-weight: bold;
            }

            .section-detail > td {
                padding: 0.1em 2.5em;
            }

            /* What it does: Fixes webkit padding issue. */
            table {
                border-spacing: 0 !important;
                border-collapse: collapse !important;
                table-layout: fixed !important;
                margin: 0 auto !important;
            }

            /* What it does: Uses a better rendering method when resizing images in IE. */
            img {
                -ms-interpolation-mode: bicubic;
            }

            /* What it does: Prevents Windows 10 Mail from underlining links despite inline CSS. Styles for underlined links should be inline. */
            a {
                text-decoration: none;
            }

            /* What it does: A work-around for email clients meddling in triggered links. */
            *[x-apple-data-detectors],  /* iOS */
        .unstyle-auto-detected-links *,
        .aBn {
                border-bottom: 0 !important;
                cursor: default !important;
                color: inherit !important;
                text-decoration: none !important;
                font-size: inherit !important;
                font-family: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
            }

            /* What it does: Prevents Gmail from displaying a download button on large, non-linked images. */
            .a6S {
                display: none !important;
                opacity: 0.01 !important;
            }

            /* What it does: Prevents Gmail from changing the text color in conversation threads. */
            .im {
                color: inherit !important;
            }

            /* If the above doesn't work, add a .g-img class to any image in question. */
            img.g-img + div {
                display: none !important;
            }

            #tabledet {
                width: 100%;
                overflow: scroll;
                background-color: #f2f2f2;
            }

            #tabledet th {
                padding-top: 12px;
                padding-bottom: 12px;
                padding-left: 10px;
                padding-right: 10px;
                text-align: left;
                font-size: 8pt;
                background-color: #800000;
                color: white;
            }

            #tabledet td {
                font-size: 8pt;
                padding: 1rem;
                font-weight: 800;
                color: rgb(0, 0, 0);
                width: 100px;
                border: 1px solid white;
                background-color: #ffd1d1;
                border-collapse: collapse;
            }

            #tabledet tr {
                background-color: #f2f2f2;
            }

            /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */
            /* Create one of these media queries for each additional viewport size you'd like to fix */

            /* iPhone 4, 4S, 5, 5S, 5C, and 5SE */
            @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
                u ~ div .email-container {
                    min-width: 320px !important;
                }
            }
            /* iPhone 6, 6S, 7, 8, and X */
            @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
                u ~ div .email-container {
                    min-width: 375px !important;
                }
            }
            /* iPhone 6+, 7+, and 8+ */
            @media only screen and (min-device-width: 414px) {
                u ~ div .email-container {
                    min-width: 414px !important;
                }
            }
        </style>

        <!-- CSS Reset : END -->

        <!-- Progressive Enhancements : BEGIN -->
        <style>
            .primary {
                background: #2f89fc;
            }
            .bg_white {
                background: #ffffff;
            }
            .bg_light {
                background: #fafafa;
            }
            .bg_black {
                background: #000000;
            }
            .bg_dark {
                background: rgba(0, 0, 0, 0.8);
            }
            .email-section {
                padding: 2.5em;
            }

            /*BUTTON*/
            .btn {
                padding: 5px 15px;
                display: inline-block;
            }
            .btn.btn-primary {
                border-radius: 5px;
                background: #2f89fc;
                color: #ffffff;
            }
            .btn.btn-primary:hover {
                border-radius: 5px;
                background: #509cff;
                color: #ffffff;
            }
            .btn.btn-white {
                border-radius: 5px;
                background: #ffffff;
                color: #000000;
            }
            .btn.btn-white-outline {
                border-radius: 5px;
                background: transparent;
                border: 1px solid #fff;
                color: #fff;
            }

            h1,
            h2,
            h3,
            h4,
            h5,
            h6 {
                font-family: "Montserrat", sans-serif;
                color: #000000;
                margin-top: 0;
                font-weight: 400;
            }

            body {
                font-family: "Montserrat", sans-serif;
                font-weight: 400;
                font-size: 15px;
                line-height: 1.8;
                color: #000000;
            }

            a {
                color: #2f89fc;
            }

            table {
            }
            /*LOGO*/

            .logo h1 {
                margin: 0;
            }
            .logo h1 a {
                color: #000000;
                font-size: 20px;
                font-weight: 700;
                text-transform: uppercase;
                font-family: "Montserrat", sans-serif;
            }

            .navigation {
                padding: 0;
            }
            .navigation li {
                list-style: none;
                display: inline-block;
                margin-left: 5px;
                font-size: 13px;
                font-weight: 500;
            }
            .navigation li a {
                color: rgba(0, 0, 0, 0.4);
            }

            /*HERO*/
            .hero {
                position: relative;
                z-index: 0;
            }

            .hero .text {
                color: rgba(0, 0, 0, 0.3);
            }
            .hero .text h2 {
                color: #000;
                font-size: 30px;
                margin-bottom: 0;
                font-weight: 300;
            }
            .hero .text h2 span {
                font-weight: 600;
                color: #2f89fc;
            }

            /*HEADING SECTION*/
            .heading-section {
            }
            .heading-section h2 {
                color: #000000;
                font-size: 28px;
                margin-top: 0;
                line-height: 1.4;
                font-weight: 400;
            }
            .heading-section .subheading {
                margin-bottom: 20px !important;
                display: inline-block;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: rgba(0, 0, 0, 0.4);
                position: relative;
            }
            .heading-section .subheading::after {
                position: absolute;
                left: 0;
                right: 0;
                bottom: -10px;
                content: "";
                width: 100%;
                height: 2px;
                background: #2f89fc;
                margin: 0 auto;
            }

            .heading-section-white {
                color: rgba(255, 255, 255, 0.8);
            }
            .heading-section-white h2 {
                line-height: 1;
                padding-bottom: 0;
            }
            .heading-section-white h2 {
                color: #ffffff;
            }
            .heading-section-white .subheading {
                margin-bottom: 0;
                display: inline-block;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: rgba(255, 255, 255, 0.4);
            }

            /*FOOTER*/

            .footer {
                color: rgba(255, 255, 255, 0.5);
            }
            .footer .heading {
                color: #ffffff;
                font-size: 20px;
            }
            .footer ul {
                margin: 0;
                padding: 0;
            }
            .footer ul li {
                list-style: none;
                margin-bottom: 10px;
            }
            .footer ul li a {
                color: rgba(255, 255, 255, 1);
            }

            @media screen and (max-width: 500px) {
            }
        </style>
    </head>
    <body
        width="100%"
        style="
            margin: 0;
            padding: 0 !important;
            mso-line-height-rule: exactly;
            background-color: #222222;
        "
    >
        <center style="width: 100%; background-color: #f1f1f1">
            <div
                style="max-width: 1000px; margin: 0 auto"
                class="email-container"
            >
                <table
                    align="center"
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    width="100%"
                    style="margin: auto"
                    class="bg_white"
                >
                    <tr>
                        <td
                            valign="top"
                            class="bg_white"
                            style="padding: 1em 2.5em"
                        >
                            <table
                                role="presentation"
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                            >
                                <tr>
                                    <td class="logo" style="text-align: left">
                                        <img
                                            width="40%"
                                            src="https://safetyfirstindonesia.co.id/assets/uploads/images/9f09b-kpn-corp.png"
                                        />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <table style="width: 100%">
                            <tr>
                                <td
                                    valign="top"
                                    class="bg_white"
                                    style="padding: 1em 2.5em"
                                >
                                    <h4>
                                        Kepada Yth. Bapak/Ibu <br />
                                        Berikut informasi pendaftaran vendor
                                        baru :
                                    </h4>
                                </td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr class="section-detail">
                                <td>Company Details</td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Title
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${detail.title}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Local / Overseas
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${detail.local_ovs}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Vendor Name
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${detail.name_1}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Status Kawasan Berikat
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${
                                        detail?.kawasan_berikat
                                            ? "Kawasan Berikat"
                                            : "Kawasan Bebas Berikat"
                                    }
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Vendor Code
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${ven_code}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 1rem"></td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr class="section-detail">
                                <td>Tax and Payment</td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Tax Number
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${detail.npwp}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Payment Method
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${detail.pay_mthd}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Payment Term
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${detail.pay_term}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 1rem"></td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr class="section-detail">
                                <td>Vendor Details</td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Company
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${detail.company}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Purchasing Organization
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${detail.purch_org}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Vendor Group
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${detail.ven_group}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Vendor Account
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${detail.ven_acc}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Vendor Type
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${detail.ven_type}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Limit
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${detail.lim_curr ?? ""} ${
                                        detail.limit_vendor
                                            ? parseInt(detail.limit_vendor)
                                                  .toFixed(2)
                                                  .replace(
                                                      /\d(?=(\d{3})+\.)/g,
                                                      "$&,"
                                                  )
                                            : ""
                                    }
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Description
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${detail.description}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 1rem"></td>
                            </tr>
                        </table>
                    </tr>
                </table>
                <table
                    align="center"
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    width="100%"
                    style="margin: auto"
                >
                    <tr>
                        <td
                            valign="middle"
                            class="bg_black footer email-section"
                        >
                            <table>
                                <tr>
                                    <td>KPN Corp Copyright 2023</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>
        </center>
    </body>
</html>

        `;
    },

    ApprovalDeact: (action, detail, rowbank, reason, approve, reject) => {
        return `
        <!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width" />
        <title>Email Notification</title>
        <link
            href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap"
            rel="stylesheet"
        />
        <style>
            html,
            body {
                margin: 0 auto !important;
                padding: 0 !important;
                height: 100% !important;
                width: 100% !important;
                background: #f1f1f1;
            }

            /* What it does: Stops email clients resizing small text. */
            * {
                -ms-text-size-adjust: 100%;
                -webkit-text-size-adjust: 100%;
            }

            /* What it does: Centers email on Android 4.4 */
            div[style*="margin: 16px 0"] {
                margin: 0 !important;
            }

            /* What it does: Stops Outlook from adding extra spacing to tables. */
            table,
            td {
                mso-table-lspace: 0pt !important;
                mso-table-rspace: 0pt !important;
            }

            .detail {
                font-size: 10pt;
            }

            .section-detail {
                font-size: 12pt;
                font-weight: bold;
            }

            .section-detail > td {
                padding: 0.1em 2.5em;
            }

            /* What it does: Fixes webkit padding issue. */
            table {
                border-spacing: 0 !important;
                border-collapse: collapse !important;
                table-layout: fixed !important;
                margin: 0 auto !important;
            }

            /* What it does: Uses a better rendering method when resizing images in IE. */
            img {
                -ms-interpolation-mode: bicubic;
            }

            /* What it does: Prevents Windows 10 Mail from underlining links despite inline CSS. Styles for underlined links should be inline. */
            a {
                text-decoration: none;
            }

            /* What it does: A work-around for email clients meddling in triggered links. */
            *[x-apple-data-detectors],  /* iOS */
        .unstyle-auto-detected-links *,
        .aBn {
                border-bottom: 0 !important;
                cursor: default !important;
                color: inherit !important;
                text-decoration: none !important;
                font-size: inherit !important;
                font-family: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
            }

            /* What it does: Prevents Gmail from displaying a download button on large, non-linked images. */
            .a6S {
                display: none !important;
                opacity: 0.01 !important;
            }

            /* What it does: Prevents Gmail from changing the text color in conversation threads. */
            .im {
                color: inherit !important;
            }

            /* If the above doesn't work, add a .g-img class to any image in question. */
            img.g-img + div {
                display: none !important;
            }

            #tabledet {
                width: 100%;
                overflow: scroll;
                background-color: #f2f2f2;
            }

            #tabledet th {
                padding-top: 12px;
                padding-bottom: 12px;
                padding-left: 10px;
                padding-right: 10px;
                text-align: left;
                font-size: 8pt;
                background-color: #800000;
                color: white;
            }

            #tabledet td {
                font-size: 8pt;
                padding: 1rem;
                font-weight: 800;
                color: rgb(0, 0, 0);
                width: 100px;
                border: 1px solid white;
                background-color: #ffd1d1;
                border-collapse: collapse;
            }

            #tabledet tr {
                background-color: #f2f2f2;
            }

            /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */
            /* Create one of these media queries for each additional viewport size you'd like to fix */

            /* iPhone 4, 4S, 5, 5S, 5C, and 5SE */
            @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
                u ~ div .email-container {
                    min-width: 320px !important;
                }
            }
            /* iPhone 6, 6S, 7, 8, and X */
            @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
                u ~ div .email-container {
                    min-width: 375px !important;
                }
            }
            /* iPhone 6+, 7+, and 8+ */
            @media only screen and (min-device-width: 414px) {
                u ~ div .email-container {
                    min-width: 414px !important;
                }
            }
        </style>

        <!-- CSS Reset : END -->

        <!-- Progressive Enhancements : BEGIN -->
        <style>
            .primary {
                background: #2f89fc;
            }
            .bg_white {
                background: #ffffff;
            }
            .bg_light {
                background: #fafafa;
            }
            .bg_black {
                background: #000000;
            }
            .bg_dark {
                background: rgba(0, 0, 0, 0.8);
            }
            .email-section {
                padding: 2.5em;
            }

            /*BUTTON*/
            .btn {
                padding: 5px 15px;
                display: inline-block;
            }
            .btn.btn-primary {
                border-radius: 5px;
                background: #2f89fc;
                color: #ffffff;
            }
            .btn.btn-primary:hover {
                border-radius: 5px;
                background: #509cff;
                color: #ffffff;
            }
            .btn.btn-white {
                border-radius: 5px;
                background: #ffffff;
                color: #000000;
            }
            .btn.btn-white-outline {
                border-radius: 5px;
                background: transparent;
                border: 1px solid #fff;
                color: #fff;
            }

            h1,
            h2,
            h3,
            h4,
            h5,
            h6 {
                font-family: "Montserrat", sans-serif;
                color: #000000;
                margin-top: 0;
                font-weight: 400;
            }

            body {
                font-family: "Montserrat", sans-serif;
                font-weight: 400;
                font-size: 15px;
                line-height: 1.8;
                color: #000000;
            }

            a {
                color: #2f89fc;
            }

            table {
            }
            /*LOGO*/

            .logo h1 {
                margin: 0;
            }
            .logo h1 a {
                color: #000000;
                font-size: 20px;
                font-weight: 700;
                text-transform: uppercase;
                font-family: "Montserrat", sans-serif;
            }

            .navigation {
                padding: 0;
            }
            .navigation li {
                list-style: none;
                display: inline-block;
                margin-left: 5px;
                font-size: 13px;
                font-weight: 500;
            }
            .navigation li a {
                color: rgba(0, 0, 0, 0.4);
            }

            /*HERO*/
            .hero {
                position: relative;
                z-index: 0;
            }

            .hero .text {
                color: rgba(0, 0, 0, 0.3);
            }
            .hero .text h2 {
                color: #000;
                font-size: 30px;
                margin-bottom: 0;
                font-weight: 300;
            }
            .hero .text h2 span {
                font-weight: 600;
                color: #2f89fc;
            }

            /*HEADING SECTION*/
            .heading-section {
            }
            .heading-section h2 {
                color: #000000;
                font-size: 28px;
                margin-top: 0;
                line-height: 1.4;
                font-weight: 400;
            }
            .heading-section .subheading {
                margin-bottom: 20px !important;
                display: inline-block;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: rgba(0, 0, 0, 0.4);
                position: relative;
            }
            .heading-section .subheading::after {
                position: absolute;
                left: 0;
                right: 0;
                bottom: -10px;
                content: "";
                width: 100%;
                height: 2px;
                background: #2f89fc;
                margin: 0 auto;
            }

            .heading-section-white {
                color: rgba(255, 255, 255, 0.8);
            }
            .heading-section-white h2 {
                line-height: 1;
                padding-bottom: 0;
            }
            .heading-section-white h2 {
                color: #ffffff;
            }
            .heading-section-white .subheading {
                margin-bottom: 0;
                display: inline-block;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: rgba(255, 255, 255, 0.4);
            }

            /*FOOTER*/

            .footer {
                color: rgba(255, 255, 255, 0.5);
            }
            .footer .heading {
                color: #ffffff;
                font-size: 20px;
            }
            .footer ul {
                margin: 0;
                padding: 0;
            }
            .footer ul li {
                list-style: none;
                margin-bottom: 10px;
            }
            .footer ul li a {
                color: rgba(255, 255, 255, 1);
            }

            @media screen and (max-width: 500px) {
            }
        </style>
    </head>
    <body
        width="100%"
        style="
            margin: 0;
            padding: 0 !important;
            mso-line-height-rule: exactly;
            background-color: #222222;
        "
    >
        <center style="width: 100%; background-color: #f1f1f1">
            <div
                style="max-width: 1000px; margin: 0 auto"
                class="email-container"
            >
                <table
                    align="center"
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    width="100%"
                    style="margin: auto"
                    class="bg_white"
                >
                    <tr>
                        <td
                            valign="top"
                            class="bg_white"
                            style="padding: 1em 2.5em"
                        >
                            <table
                                role="presentation"
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                            >
                                <tr>
                                    <td class="logo" style="text-align: left">
                                        <img
                                            width="40%"
                                            src="https://safetyfirstindonesia.co.id/assets/uploads/images/9f09b-kpn-corp.png"
                                        />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <table style="width: 100%">
                            <tr>
                                <td
                                    valign="top"
                                    class="bg_white"
                                    style="padding: 1em 2.5em"
                                >
                                    <h4>
                                        Untuk vendor berikut, mohon approval
                                        ${action} dengan detail :
                                    </h4>
                                </td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr class="section-detail">
                                <td>Vendor Details</td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Title
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.title}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Local / Overseas
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.local_ovs}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Vendor Name
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.name_1}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Vendor Code
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.ven_code}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 1rem"></td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr class="section-detail">
                                <td>Company Details</td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Company
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.company}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Purchasing Organization
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.purch_org}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Vendor Group
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.ven_group.replace("_", " ")}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Vendor Account
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.ven_acc.replace("_", " ")}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Vendor Type
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.ven_type}
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Limit
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.lim_curr ?? ""} ${
                                        detail.limit_vendor
                                            ? parseInt(detail.limit_vendor)
                                                  .toFixed(2)
                                                  .replace(
                                                      /\d(?=(\d{3})+\.)/g,
                                                      "$&,"
                                                  )
                                            : ""
                                    }
                                </td>
                            </tr>
                            <tr class="detail">
                                <td width="20%" style="padding: 0.1em 2.5em">
                                    Description
                                </td>
                                <td style="padding: 0.1em 2.5em" width="1%">
                                    :
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    ${detail.description}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 1rem"></td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr class="section-detail">
                                <td>Bank Account</td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table id="tabledet">
                            <tr>
                                <th>Country</th>
                                <th>Bank Name</th>
                                <th>Currency</th>
                                <th>Bank Account</th>
                                <th>Account Holder</th>
                            </tr>
                            ${rowbank}
                        </table>
                    </tr>
                    <table class="bg_white" width="100%">
                        <tr>
                            <td style="padding-top: 1rem"></td>
                        </tr>
                        <tr class="section-detail" style="margin: 4rem 0 0 0">
                            <td>Reason</td>
                        </tr>
                    </table>

                    <table class="bg_white" width="100%">
                        <tr class="detail">
                            <td style="padding: 0.1em 2.5em">
                                <!-- Lorem Ipsum is simply dummy text of the printing
                                and typesetting industry. Lorem Ipsum has been
                                the industry's standard dummy text ever since
                                the 1500s, when an unknown printer took a galley
                                of type and scrambled it to make a type specimen
                                book. It has survived not only five centuries,
                                but also the leap into electronic typesetting,
                                remaining essentially unchanged. It was
                                popularised in the 1960s with the release of
                                Letraset sheets containing Lorem Ipsum passages,
                                and more recently with desktop publishing
                                software like Aldus PageMaker including versions
                                of Lorem Ipsum. -->
                                ${reason}
                            </td>
                        </tr>
                    </table>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr>
                                <td width="20%" style="padding: 2em 2.5em">
                                    Action
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    <a href="${approve}">
                                        <button
                                            class="btn btn-primary"
                                            style="
                                                padding-left: 2em;
                                                padding-right: 2em;
                                                padding-top: 1em;
                                                padding-bottom: 1em;
                                            "
                                        >
                                            Yes
                                        </button>
                                    </a>
                                    <a href="${reject}">
                                        <button
                                            class="btn btn-primary"
                                            style="
                                                padding-left: 2em;
                                                padding-right: 2em;
                                                padding-top: 1em;
                                                padding-bottom: 1em;
                                            "
                                        >
                                            No
                                        </button>
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </tr>
                </table>
                <table
                    align="center"
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    width="100%"
                    style="margin: auto"
                >
                    <tr>
                        <td
                            valign="middle"
                            class="bg_black footer email-section"
                        >
                            <table>
                                <tr>
                                    <td>KPN Corp Copyright 2023</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>
        </center>
    </body>
</html>

        `;
    },

    ActVenMDM: (action, ticket_num, ven_name, link, reason) => {
        return `
        <!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width" />
        <title>Email Notification</title>
        <link
            href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap"
            rel="stylesheet"
        />
        <style>
            html,
            body {
                margin: 0 auto !important;
                padding: 0 !important;
                height: 100% !important;
                width: 100% !important;
                background: #f1f1f1;
            }

            /* What it does: Stops email clients resizing small text. */
            * {
                -ms-text-size-adjust: 100%;
                -webkit-text-size-adjust: 100%;
            }

            /* What it does: Centers email on Android 4.4 */
            div[style*="margin: 16px 0"] {
                margin: 0 !important;
            }

            /* What it does: Stops Outlook from adding extra spacing to tables. */
            table,
            td {
                mso-table-lspace: 0pt !important;
                mso-table-rspace: 0pt !important;
            }

            /* What it does: Fixes webkit padding issue. */
            table {
                border-spacing: 0 !important;
                border-collapse: collapse !important;
                table-layout: fixed !important;
                margin: 0 auto !important;
            }

            /* What it does: Uses a better rendering method when resizing images in IE. */
            img {
                -ms-interpolation-mode: bicubic;
            }

            /* What it does: Prevents Windows 10 Mail from underlining links despite inline CSS. Styles for underlined links should be inline. */
            a {
                text-decoration: none;
            }

            /* What it does: A work-around for email clients meddling in triggered links. */
            *[x-apple-data-detectors],  /* iOS */
        .unstyle-auto-detected-links *,
        .aBn {
                border-bottom: 0 !important;
                cursor: default !important;
                color: inherit !important;
                text-decoration: none !important;
                font-size: inherit !important;
                font-family: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
            }

            /* What it does: Prevents Gmail from displaying a download button on large, non-linked images. */
            .a6S {
                display: none !important;
                opacity: 0.01 !important;
            }

            /* What it does: Prevents Gmail from changing the text color in conversation threads. */
            .im {
                color: inherit !important;
            }

            /* If the above doesn't work, add a .g-img class to any image in question. */
            img.g-img + div {
                display: none !important;
            }

            /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */
            /* Create one of these media queries for each additional viewport size you'd like to fix */

            /* iPhone 4, 4S, 5, 5S, 5C, and 5SE */
            @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
                u ~ div .email-container {
                    min-width: 320px !important;
                }
            }
            /* iPhone 6, 6S, 7, 8, and X */
            @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
                u ~ div .email-container {
                    min-width: 375px !important;
                }
            }
            /* iPhone 6+, 7+, and 8+ */
            @media only screen and (min-device-width: 414px) {
                u ~ div .email-container {
                    min-width: 414px !important;
                }
            }
        </style>

        <!-- CSS Reset : END -->

        <!-- Progressive Enhancements : BEGIN -->
        <style>
            .primary {
                background: #2f89fc;
            }
            .bg_white {
                background: #ffffff;
            }
            .bg_light {
                background: #fafafa;
            }
            .bg_black {
                background: #000000;
            }
            .bg_dark {
                background: rgba(0, 0, 0, 0.8);
            }
            .email-section {
                padding: 2.5em;
            }

            /*BUTTON*/
            .btn {
                padding: 5px 15px;
                display: inline-block;
            }
            .btn.btn-primary {
                border-radius: 5px;
                background: #2f89fc;
                color: #ffffff;
            }
            .btn.btn-white {
                border-radius: 5px;
                background: #ffffff;
                color: #000000;
            }
            .btn.btn-white-outline {
                border-radius: 5px;
                background: transparent;
                border: 1px solid #fff;
                color: #fff;
            }

            h1,
            h2,
            h3,
            h4,
            h5,
            h6 {
                font-family: "Montserrat", sans-serif;
                color: #000000;
                margin-top: 0;
                font-weight: 400;
            }

            body {
                font-family: "Montserrat", sans-serif;
                font-weight: 400;
                font-size: 15px;
                line-height: 1.8;
                color: #000000;
            }

            a {
                color: #2f89fc;
            }

            table {
            }
            /*LOGO*/

            .logo h1 {
                margin: 0;
            }
            .logo h1 a {
                color: #000000;
                font-size: 20px;
                font-weight: 700;
                text-transform: uppercase;
                font-family: "Montserrat", sans-serif;
            }

            .navigation {
                padding: 0;
            }
            .navigation li {
                list-style: none;
                display: inline-block;
                margin-left: 5px;
                font-size: 13px;
                font-weight: 500;
            }
            .navigation li a {
                color: rgba(0, 0, 0, 0.4);
            }

            /*HERO*/
            .hero {
                position: relative;
                z-index: 0;
            }

            .hero .text {
                color: rgba(0, 0, 0, 0.3);
            }
            .hero .text h2 {
                color: #000;
                font-size: 30px;
                margin-bottom: 0;
                font-weight: 300;
            }
            .hero .text h2 span {
                font-weight: 600;
                color: #2f89fc;
            }

            /*HEADING SECTION*/
            .heading-section {
            }
            .heading-section h2 {
                color: #000000;
                font-size: 28px;
                margin-top: 0;
                line-height: 1.4;
                font-weight: 400;
            }
            .heading-section .subheading {
                margin-bottom: 20px !important;
                display: inline-block;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: rgba(0, 0, 0, 0.4);
                position: relative;
            }
            .heading-section .subheading::after {
                position: absolute;
                left: 0;
                right: 0;
                bottom: -10px;
                content: "";
                width: 100%;
                height: 2px;
                background: #2f89fc;
                margin: 0 auto;
            }

            .heading-section-white {
                color: rgba(255, 255, 255, 0.8);
            }
            .heading-section-white h2 {
                line-height: 1;
                padding-bottom: 0;
            }
            .heading-section-white h2 {
                color: #ffffff;
            }
            .heading-section-white .subheading {
                margin-bottom: 0;
                display: inline-block;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: rgba(255, 255, 255, 0.4);
            }

            /*FOOTER*/

            .footer {
                color: rgba(255, 255, 255, 0.5);
            }
            .footer .heading {
                color: #ffffff;
                font-size: 20px;
            }
            .footer ul {
                margin: 0;
                padding: 0;
            }
            .footer ul li {
                list-style: none;
                margin-bottom: 10px;
            }
            .footer ul li a {
                color: rgba(255, 255, 255, 1);
            }

            @media screen and (max-width: 500px) {
            }
        </style>
    </head>
    <body
        width="100%"
        style="
            margin: 0;
            padding: 0 !important;
            mso-line-height-rule: exactly;
            background-color: #222222;
        "
    >
        <center style="width: 100%; background-color: #f1f1f1">
            <div
                style="max-width: 600px; margin: 0 auto"
                class="email-container"
            >
                <table
                    align="center"
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    width="100%"
                    style="margin: auto"
                    class="bg_white"
                >
                    <tr>
                        <td
                            valign="top"
                            class="bg_white"
                            style="padding: 1em 2.5em"
                        >
                            <table
                                role="presentation"
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                            >
                                <tr>
                                    <td class="logo" style="text-align: left">
                                        <img
                                            width="40%"
                                            src="https://safetyfirstindonesia.co.id/assets/uploads/images/9f09b-kpn-corp.png"
                                        />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <table style="width: 100%">
                            <tr>
                                <td
                                    valign="top"
                                    class="bg_white"
                                    style="padding: 1em 2.5em"
                                >
                                    <h4>
                                        Kepada Yth. Bapak/Ibu <br />
                                        Mohon proses ${action} vendor dengan
                                        detail berikut :
                                    </h4>
                                </td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr>
                                <td width="30%" style="padding: 0.1em 2.5em">
                                    Ticket Number
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${ticket_num}
                                </td>
                            </tr>
                            <tr>
                                <td width="30%" style="padding: 0.1em 2.5em">
                                    Vendor Name
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${ven_name}
                                </td>
                            </tr>
                            <tr>
                                <td width="30%" style="padding: 0.1em 2.5em">
                                    Reason
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${reason}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 1rem"></td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table style="width: 100%">
                            <tr>
                                <td
                                    valign="top"
                                    class="bg_white"
                                    style="padding: 1em 2.5em"
                                >
                                    <h4>
                                        Dapat diakses dilink berikut :
                                        <a href="${link}">${link}</a>
                                    </h4>
                                </td>
                            </tr>
                        </table>
                    </tr>
                </table>
                <table
                    align="center"
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    width="100%"
                    style="margin: auto"
                >
                    <tr>
                        <td
                            valign="middle"
                            class="bg_black footer email-section"
                        >
                            <table>
                                <tr>
                                    <td>KPN Corp Copyright 2023</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>
        </center>
    </body>
</html>

        `;
    },

    RejVenReq: (action, ticket_num, ven_name, reason) => {
        return `
        <!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width" />
        <title>Email Notification</title>
        <link
            href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap"
            rel="stylesheet"
        />
        <style>
            html,
            body {
                margin: 0 auto !important;
                padding: 0 !important;
                height: 100% !important;
                width: 100% !important;
                background: #f1f1f1;
            }

            /* What it does: Stops email clients resizing small text. */
            * {
                -ms-text-size-adjust: 100%;
                -webkit-text-size-adjust: 100%;
            }

            /* What it does: Centers email on Android 4.4 */
            div[style*="margin: 16px 0"] {
                margin: 0 !important;
            }

            /* What it does: Stops Outlook from adding extra spacing to tables. */
            table,
            td {
                mso-table-lspace: 0pt !important;
                mso-table-rspace: 0pt !important;
            }

            /* What it does: Fixes webkit padding issue. */
            table {
                border-spacing: 0 !important;
                border-collapse: collapse !important;
                table-layout: fixed !important;
                margin: 0 auto !important;
            }

            /* What it does: Uses a better rendering method when resizing images in IE. */
            img {
                -ms-interpolation-mode: bicubic;
            }

            /* What it does: Prevents Windows 10 Mail from underlining links despite inline CSS. Styles for underlined links should be inline. */
            a {
                text-decoration: none;
            }

            /* What it does: A work-around for email clients meddling in triggered links. */
            *[x-apple-data-detectors],  /* iOS */
        .unstyle-auto-detected-links *,
        .aBn {
                border-bottom: 0 !important;
                cursor: default !important;
                color: inherit !important;
                text-decoration: none !important;
                font-size: inherit !important;
                font-family: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
            }

            /* What it does: Prevents Gmail from displaying a download button on large, non-linked images. */
            .a6S {
                display: none !important;
                opacity: 0.01 !important;
            }

            /* What it does: Prevents Gmail from changing the text color in conversation threads. */
            .im {
                color: inherit !important;
            }

            /* If the above doesn't work, add a .g-img class to any image in question. */
            img.g-img + div {
                display: none !important;
            }

            /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */
            /* Create one of these media queries for each additional viewport size you'd like to fix */

            /* iPhone 4, 4S, 5, 5S, 5C, and 5SE */
            @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
                u ~ div .email-container {
                    min-width: 320px !important;
                }
            }
            /* iPhone 6, 6S, 7, 8, and X */
            @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
                u ~ div .email-container {
                    min-width: 375px !important;
                }
            }
            /* iPhone 6+, 7+, and 8+ */
            @media only screen and (min-device-width: 414px) {
                u ~ div .email-container {
                    min-width: 414px !important;
                }
            }
        </style>

        <!-- CSS Reset : END -->

        <!-- Progressive Enhancements : BEGIN -->
        <style>
            .primary {
                background: #2f89fc;
            }
            .bg_white {
                background: #ffffff;
            }
            .bg_light {
                background: #fafafa;
            }
            .bg_black {
                background: #000000;
            }
            .bg_dark {
                background: rgba(0, 0, 0, 0.8);
            }
            .email-section {
                padding: 2.5em;
            }

            /*BUTTON*/
            .btn {
                padding: 5px 15px;
                display: inline-block;
            }
            .btn.btn-primary {
                border-radius: 5px;
                background: #2f89fc;
                color: #ffffff;
            }
            .btn.btn-white {
                border-radius: 5px;
                background: #ffffff;
                color: #000000;
            }
            .btn.btn-white-outline {
                border-radius: 5px;
                background: transparent;
                border: 1px solid #fff;
                color: #fff;
            }

            h1,
            h2,
            h3,
            h4,
            h5,
            h6 {
                font-family: "Montserrat", sans-serif;
                color: #000000;
                margin-top: 0;
                font-weight: 400;
            }

            body {
                font-family: "Montserrat", sans-serif;
                font-weight: 400;
                font-size: 15px;
                line-height: 1.8;
                color: #000000;
            }

            a {
                color: #2f89fc;
            }

            table {
            }
            /*LOGO*/

            .logo h1 {
                margin: 0;
            }
            .logo h1 a {
                color: #000000;
                font-size: 20px;
                font-weight: 700;
                text-transform: uppercase;
                font-family: "Montserrat", sans-serif;
            }

            .navigation {
                padding: 0;
            }
            .navigation li {
                list-style: none;
                display: inline-block;
                margin-left: 5px;
                font-size: 13px;
                font-weight: 500;
            }
            .navigation li a {
                color: rgba(0, 0, 0, 0.4);
            }

            /*HERO*/
            .hero {
                position: relative;
                z-index: 0;
            }

            .hero .text {
                color: rgba(0, 0, 0, 0.3);
            }
            .hero .text h2 {
                color: #000;
                font-size: 30px;
                margin-bottom: 0;
                font-weight: 300;
            }
            .hero .text h2 span {
                font-weight: 600;
                color: #2f89fc;
            }

            /*HEADING SECTION*/
            .heading-section {
            }
            .heading-section h2 {
                color: #000000;
                font-size: 28px;
                margin-top: 0;
                line-height: 1.4;
                font-weight: 400;
            }
            .heading-section .subheading {
                margin-bottom: 20px !important;
                display: inline-block;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: rgba(0, 0, 0, 0.4);
                position: relative;
            }
            .heading-section .subheading::after {
                position: absolute;
                left: 0;
                right: 0;
                bottom: -10px;
                content: "";
                width: 100%;
                height: 2px;
                background: #2f89fc;
                margin: 0 auto;
            }

            .heading-section-white {
                color: rgba(255, 255, 255, 0.8);
            }
            .heading-section-white h2 {
                line-height: 1;
                padding-bottom: 0;
            }
            .heading-section-white h2 {
                color: #ffffff;
            }
            .heading-section-white .subheading {
                margin-bottom: 0;
                display: inline-block;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: rgba(255, 255, 255, 0.4);
            }

            /*FOOTER*/

            .footer {
                color: rgba(255, 255, 255, 0.5);
            }
            .footer .heading {
                color: #ffffff;
                font-size: 20px;
            }
            .footer ul {
                margin: 0;
                padding: 0;
            }
            .footer ul li {
                list-style: none;
                margin-bottom: 10px;
            }
            .footer ul li a {
                color: rgba(255, 255, 255, 1);
            }

            @media screen and (max-width: 500px) {
            }
        </style>
    </head>
    <body
        width="100%"
        style="
            margin: 0;
            padding: 0 !important;
            mso-line-height-rule: exactly;
            background-color: #222222;
        "
    >
        <center style="width: 100%; background-color: #f1f1f1">
            <div
                style="max-width: 600px; margin: 0 auto"
                class="email-container"
            >
                <table
                    align="center"
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    width="100%"
                    style="margin: auto"
                    class="bg_white"
                >
                    <tr>
                        <td
                            valign="top"
                            class="bg_white"
                            style="padding: 1em 2.5em"
                        >
                            <table
                                role="presentation"
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                            >
                                <tr>
                                    <td class="logo" style="text-align: left">
                                        <img
                                            width="40%"
                                            src="https://safetyfirstindonesia.co.id/assets/uploads/images/9f09b-kpn-corp.png"
                                        />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <table style="width: 100%">
                            <tr>
                                <td
                                    valign="top"
                                    class="bg_white"
                                    style="padding: 1em 2.5em"
                                >
                                    <h4>
                                        Kepada Yth. Bapak/Ibu <br />
                                        Request ${action} vendor dengan
                                        detail berikut :
                                    </h4>
                                </td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr>
                                <td width="30%" style="padding: 0.1em 2.5em">
                                    Ticket Number
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${ticket_num}
                                </td>
                            </tr>
                            <tr>
                                <td width="30%" style="padding: 0.1em 2.5em">
                                    Vendor Name
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${ven_name}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 1rem"></td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr>
                                <td  style="padding: 0.1em 2.5em">
                                    Ditolak dengan alasan berikut
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 0.1em 2.5em">
                                    ${reason}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 1rem"></td>
                            </tr>
                        </table>
                    </tr>
                </table>
                <table
                    align="center"
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    width="100%"
                    style="margin: auto"
                >
                    <tr>
                        <td
                            valign="middle"
                            class="bg_black footer email-section"
                        >
                            <table>
                                <tr>
                                    <td>KPN Corp Copyright 2023</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>
        </center>
    </body>
</html>

        `;
    },
    ApprDeactVenReq: (action, ticket_num, ven_name) => {
        return `
        <!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width" />
        <title>Email Notification</title>
        <link
            href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap"
            rel="stylesheet"
        />
        <style>
            html,
            body {
                margin: 0 auto !important;
                padding: 0 !important;
                height: 100% !important;
                width: 100% !important;
                background: #f1f1f1;
            }

            /* What it does: Stops email clients resizing small text. */
            * {
                -ms-text-size-adjust: 100%;
                -webkit-text-size-adjust: 100%;
            }

            /* What it does: Centers email on Android 4.4 */
            div[style*="margin: 16px 0"] {
                margin: 0 !important;
            }

            /* What it does: Stops Outlook from adding extra spacing to tables. */
            table,
            td {
                mso-table-lspace: 0pt !important;
                mso-table-rspace: 0pt !important;
            }

            /* What it does: Fixes webkit padding issue. */
            table {
                border-spacing: 0 !important;
                border-collapse: collapse !important;
                table-layout: fixed !important;
                margin: 0 auto !important;
            }

            /* What it does: Uses a better rendering method when resizing images in IE. */
            img {
                -ms-interpolation-mode: bicubic;
            }

            /* What it does: Prevents Windows 10 Mail from underlining links despite inline CSS. Styles for underlined links should be inline. */
            a {
                text-decoration: none;
            }

            /* What it does: A work-around for email clients meddling in triggered links. */
            *[x-apple-data-detectors],  /* iOS */
        .unstyle-auto-detected-links *,
        .aBn {
                border-bottom: 0 !important;
                cursor: default !important;
                color: inherit !important;
                text-decoration: none !important;
                font-size: inherit !important;
                font-family: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
            }

            /* What it does: Prevents Gmail from displaying a download button on large, non-linked images. */
            .a6S {
                display: none !important;
                opacity: 0.01 !important;
            }

            /* What it does: Prevents Gmail from changing the text color in conversation threads. */
            .im {
                color: inherit !important;
            }

            /* If the above doesn't work, add a .g-img class to any image in question. */
            img.g-img + div {
                display: none !important;
            }

            /* What it does: Removes right gutter in Gmail iOS app: https://github.com/TedGoas/Cerberus/issues/89  */
            /* Create one of these media queries for each additional viewport size you'd like to fix */

            /* iPhone 4, 4S, 5, 5S, 5C, and 5SE */
            @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
                u ~ div .email-container {
                    min-width: 320px !important;
                }
            }
            /* iPhone 6, 6S, 7, 8, and X */
            @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
                u ~ div .email-container {
                    min-width: 375px !important;
                }
            }
            /* iPhone 6+, 7+, and 8+ */
            @media only screen and (min-device-width: 414px) {
                u ~ div .email-container {
                    min-width: 414px !important;
                }
            }
        </style>

        <!-- CSS Reset : END -->

        <!-- Progressive Enhancements : BEGIN -->
        <style>
            .primary {
                background: #2f89fc;
            }
            .bg_white {
                background: #ffffff;
            }
            .bg_light {
                background: #fafafa;
            }
            .bg_black {
                background: #000000;
            }
            .bg_dark {
                background: rgba(0, 0, 0, 0.8);
            }
            .email-section {
                padding: 2.5em;
            }

            /*BUTTON*/
            .btn {
                padding: 5px 15px;
                display: inline-block;
            }
            .btn.btn-primary {
                border-radius: 5px;
                background: #2f89fc;
                color: #ffffff;
            }
            .btn.btn-white {
                border-radius: 5px;
                background: #ffffff;
                color: #000000;
            }
            .btn.btn-white-outline {
                border-radius: 5px;
                background: transparent;
                border: 1px solid #fff;
                color: #fff;
            }

            h1,
            h2,
            h3,
            h4,
            h5,
            h6 {
                font-family: "Montserrat", sans-serif;
                color: #000000;
                margin-top: 0;
                font-weight: 400;
            }

            body {
                font-family: "Montserrat", sans-serif;
                font-weight: 400;
                font-size: 15px;
                line-height: 1.8;
                color: #000000;
            }

            a {
                color: #2f89fc;
            }

            table {
            }
            /*LOGO*/

            .logo h1 {
                margin: 0;
            }
            .logo h1 a {
                color: #000000;
                font-size: 20px;
                font-weight: 700;
                text-transform: uppercase;
                font-family: "Montserrat", sans-serif;
            }

            .navigation {
                padding: 0;
            }
            .navigation li {
                list-style: none;
                display: inline-block;
                margin-left: 5px;
                font-size: 13px;
                font-weight: 500;
            }
            .navigation li a {
                color: rgba(0, 0, 0, 0.4);
            }

            /*HERO*/
            .hero {
                position: relative;
                z-index: 0;
            }

            .hero .text {
                color: rgba(0, 0, 0, 0.3);
            }
            .hero .text h2 {
                color: #000;
                font-size: 30px;
                margin-bottom: 0;
                font-weight: 300;
            }
            .hero .text h2 span {
                font-weight: 600;
                color: #2f89fc;
            }

            /*HEADING SECTION*/
            .heading-section {
            }
            .heading-section h2 {
                color: #000000;
                font-size: 28px;
                margin-top: 0;
                line-height: 1.4;
                font-weight: 400;
            }
            .heading-section .subheading {
                margin-bottom: 20px !important;
                display: inline-block;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: rgba(0, 0, 0, 0.4);
                position: relative;
            }
            .heading-section .subheading::after {
                position: absolute;
                left: 0;
                right: 0;
                bottom: -10px;
                content: "";
                width: 100%;
                height: 2px;
                background: #2f89fc;
                margin: 0 auto;
            }

            .heading-section-white {
                color: rgba(255, 255, 255, 0.8);
            }
            .heading-section-white h2 {
                line-height: 1;
                padding-bottom: 0;
            }
            .heading-section-white h2 {
                color: #ffffff;
            }
            .heading-section-white .subheading {
                margin-bottom: 0;
                display: inline-block;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: rgba(255, 255, 255, 0.4);
            }

            /*FOOTER*/

            .footer {
                color: rgba(255, 255, 255, 0.5);
            }
            .footer .heading {
                color: #ffffff;
                font-size: 20px;
            }
            .footer ul {
                margin: 0;
                padding: 0;
            }
            .footer ul li {
                list-style: none;
                margin-bottom: 10px;
            }
            .footer ul li a {
                color: rgba(255, 255, 255, 1);
            }

            @media screen and (max-width: 500px) {
            }
        </style>
    </head>
    <body
        width="100%"
        style="
            margin: 0;
            padding: 0 !important;
            mso-line-height-rule: exactly;
            background-color: #222222;
        "
    >
        <center style="width: 100%; background-color: #f1f1f1">
            <div
                style="max-width: 600px; margin: 0 auto"
                class="email-container"
            >
                <table
                    align="center"
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    width="100%"
                    style="margin: auto"
                    class="bg_white"
                >
                    <tr>
                        <td
                            valign="top"
                            class="bg_white"
                            style="padding: 1em 2.5em"
                        >
                            <table
                                role="presentation"
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                            >
                                <tr>
                                    <td class="logo" style="text-align: left">
                                        <img
                                            width="40%"
                                            src="https://safetyfirstindonesia.co.id/assets/uploads/images/9f09b-kpn-corp.png"
                                        />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <table style="width: 100%">
                            <tr>
                                <td
                                    valign="top"
                                    class="bg_white"
                                    style="padding: 1em 2.5em"
                                >
                                    <h4>
                                        Kepada Yth. Bapak/Ibu <br />
                                        Request ${action} vendor dengan
                                        detail berikut :
                                    </h4>
                                </td>
                            </tr>
                        </table>
                    </tr>
                    <tr>
                        <table class="bg_white" width="100%">
                            <tr>
                                <td width="30%" style="padding: 0.1em 2.5em">
                                    Ticket Number
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${ticket_num}
                                </td>
                            </tr>
                            <tr>
                                <td width="30%" style="padding: 0.1em 2.5em">
                                    Vendor Name
                                </td>
                                <td style="padding: 0.1em 2.5em">
                                    : ${ven_name}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 1rem"></td>
                            </tr>
                        </table>
                    </tr>
                </table>
                <table
                    align="center"
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    width="100%"
                    style="margin: auto"
                >
                    <tr>
                        <td
                            valign="middle"
                            class="bg_black footer email-section"
                        >
                            <table>
                                <tr>
                                    <td>KPN Corp Copyright 2023</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>
        </center>
    </body>
</html>

        `;
    },

    approvedVerify: (ticket_num, ven_name, username, password) => {
        return emailTemplate(`
            <tr>
                <table style="width: 100%">
                    <tr>
                    <td valign="top" class="bg_white" style="padding: 1em 2.5em">
                        <h4>
                        Kepada Yth. Bapak/Ibu <br />
                        Request vendor dengan detail berikut:
                        </h4>
                    </td>
                    </tr>
                </table>
            </tr>
            <tr>
            <table class="bg_white" width="100%">
                <tr>
                <td width="30%" style="padding: 0.1em 2.5em">Ticket Number</td>
                <td style="padding: 0.1em 2.5em">: ${ticket_num}</td>
                </tr>
                <tr>
                <td width="30%" style="padding: 0.1em 2.5em">Vendor Name</td>
                <td style="padding: 0.1em 2.5em">: ${ven_name}</td>
                </tr>
                <tr>
                <td style="padding-top: 1rem"></td>
                </tr>
            </table>
            </tr>
            <tr>
                <table style="width: 100%">
                    <tr>
                    <td valign="top" class="bg_white" style="padding: 1em 2.5em">
                        <h4>
                        Telah diverifikasi. Mohon untuk memberikan username dan password kepada vendor terkait agar dapat masuk ke dalam sistem VMS.
                        </h4>
                    </td>
                    </tr>
                </table>
            </tr>
            <tr>
            <table class="bg_white" width="100%">
                <tr>
                <td width="30%" style="padding: 0.1em 2.5em">Username</td>
                <td style="padding: 0.1em 2.5em">: ${username}</td>
                </tr>
                <tr>
                <td width="30%" style="padding: 0.1em 2.5em">Password</td>
                <td style="padding: 0.1em 2.5em">: ${password}</td>
                </tr>
                <tr>
                <td style="padding-top: 1rem"></td>
                </tr>
            </table>
            </tr>
            `);
    },

    rejectedVerify: (ticket_num, ven_name, reject_notes) => {
        return emailTemplate(`
            <tr>
                <table style="width: 100%">
                    <tr>
                    <td valign="top" class="bg_white" style="padding: 1em 2.5em">
                        <h4>
                        Kepada Yth. Bapak/Ibu <br />
                        Request vendor dengan detail berikut:
                        </h4>
                    </td>
                    </tr>
                </table>
            </tr>
            <tr>
            <table class="bg_white" width="100%">
                <tr>
                <td width="30%" style="padding: 0.1em 2.5em">Ticket Number</td>
                <td style="padding: 0.1em 2.5em">: ${ticket_num}</td>
                </tr>
                <tr>
                <td width="30%" style="padding: 0.1em 2.5em">Vendor Name</td>
                <td style="padding: 0.1em 2.5em">: ${ven_name}</td>
                </tr>
                <tr>
                <td style="padding-top: 1rem"></td>
                </tr>
            </table>
            </tr>
            <tr>
                <table style="width: 100%">
                    <tr>
                    <td valign="top" class="bg_white" style="padding: 1em 2.5em">
                        <h4>
                        Ditolak pada tahap verifikasi. Berikut detail yang diberikan oleh verifikator:
                        </h4>
                    </td>
                    </tr>
                </table>
            </tr>
            <tr>
            <table class="bg_white" width="100%">
                <tr>
                <td width="30%" style="padding: 0.1em 2.5em">Catatan</td>
                <td style="padding: 0.1em 2.5em">: ${reject_notes}</td>
                </tr>
                <tr>
                <td style="padding-top: 1rem"></td>
                </tr>
            </table>
            </tr>
            `);
    },
};

module.exports = Email;
