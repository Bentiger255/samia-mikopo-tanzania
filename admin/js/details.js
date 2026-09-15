"use strict";

document.addEventListener("DOMContentLoaded", async function () {

    const supabaseClient =
        window.supabaseClient;

    if (!supabaseClient) {
        window.location.href =
            "login.html";
        return;
    }


    const loading =
        document.getElementById(
            "detailsLoading"
        );

    const errorElement =
        document.getElementById(
            "detailsError"
        );

    const content =
        document.getElementById(
            "detailsContent"
        );


    /* =========================================================
       AUTH
    ========================================================= */

    const {
        data: sessionData,
        error: sessionError
    } =
        await supabaseClient.auth
            .getSession();


    if (
        sessionError ||
        !sessionData.session ||
        sessionData.session.user
            ?.app_metadata?.role !== "admin"
    ) {

        await supabaseClient.auth.signOut();

        window.location.href =
            "login.html";

        return;
    }


    /* =========================================================
       APPLICATION ID
    ========================================================= */

    const params =
        new URLSearchParams(
            window.location.search
        );

    const applicationId =
        params.get("id");


    if (!applicationId) {

        showError(
            "Application ID haijapatikana."
        );

        return;
    }


    /* =========================================================
       FORMATTERS
    ========================================================= */

    function money(value) {

        return Number(value || 0)
            .toLocaleString("en-US");
    }


    function date(value) {

        if (!value) {
            return "—";
        }

        return new Date(value)
            .toLocaleString(
                "sw-TZ",
                {
                    dateStyle: "medium",
                    timeStyle: "short"
                }
            );
    }


    function escapeHtml(value) {

        return String(value ?? "—")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    /* =========================================================
       DETAIL ITEM
    ========================================================= */

    function detailItem(
        label,
        value
    ) {

        return `
            <div class="detail-item">

                <span>
                    ${escapeHtml(label)}
                </span>

                <strong>
                    ${escapeHtml(value)}
                </strong>

            </div>
        `;
    }


    /* =========================================================
       LOAD APPLICATION
    ========================================================= */

    const {
        data: application,
        error
    } =
        await supabaseClient
            .from("loan_applications")
            .select("*")
            .eq(
                "id",
                applicationId
            )
            .single();


    if (error || !application) {

        console.error(
            "Application details error:",
            error
        );

        showError(
            "Maombi hayawezi kupatikana."
        );

        return;
    }


    /* =========================================================
       HEADER
    ========================================================= */

    document.getElementById(
        "applicantName"
    ).textContent =
        application.full_name;


    document.getElementById(
        "applicationDate"
    ).textContent =
        `Imepokelewa ${date(
            application.created_at
        )}`;


    /* =========================================================
       PERSONAL DETAILS
    ========================================================= */

    document.getElementById(
        "personalDetails"
    ).innerHTML = [

        detailItem(
            "Jina kamili",
            application.full_name
        ),

        detailItem(
            "Umri",
            `${application.age} miaka`
        ),

        detailItem(
            "Jinsia",
            application.gender
        ),

        detailItem(
            "Simu",
            application.phone
        ),

        detailItem(
            "WhatsApp",
            application.whatsapp || "Haijawekwa"
        ),

        detailItem(
            "Kata",
            application.ward
        ),

        detailItem(
            "Wilaya",
            application.district
        ),

        detailItem(
            "Mkoa",
            application.region
        ),

        detailItem(
            "Chanzo cha mapato",
            application.income_source
        ),

        application.other_income
            ? detailItem(
                "Chanzo kingine",
                application.other_income
            )
            : ""

    ].join("");


    /* =========================================================
       LOAN DETAILS
    ========================================================= */

    document.getElementById(
        "loanDetails"
    ).innerHTML = [

        detailItem(
            "Kiasi cha mkopo",
            `TZS ${money(
                application.loan_amount
            )}`
        ),

        detailItem(
            "Akiba",
            `TZS ${money(
                application.savings_amount
            )}`
        ),

        detailItem(
            "Muda wa marejesho",
            `${application.repayment_period} miezi`
        )

    ].join("");


    /* =========================================================
       IDENTIFICATION
    ========================================================= */

    const identificationItems = [

        detailItem(
            "Aina ya kitambulisho",
            application.identification_type
        )

    ];


    if (application.nida_number) {

        identificationItems.push(
            detailItem(
                "Namba ya NIDA",
                application.nida_number
            )
        );
    }


    document.getElementById(
        "identificationDetails"
    ).innerHTML =
        identificationItems.join("");


    /* =========================================================
       RECEIVING
    ========================================================= */

    const receivingItems = [

        detailItem(
            "Njia",
            application.receiving_method === "one"
                ? "Simu"
                : "Benki"
        )

    ];


    if (
        application.receiving_method === "one"
    ) {

        receivingItems.push(
            detailItem(
                "Mtandao",
                application.mobile_network
            )
        );

        receivingItems.push(
            detailItem(
                "Namba",
                application.mobile_number
            )
        );

    } else {

        receivingItems.push(
            detailItem(
                "Benki",
                application.bank
            )
        );

        receivingItems.push(
            detailItem(
                "Akaunti",
                application.bank_account
            )
        );
    }


    document.getElementById(
        "receivingDetails"
    ).innerHTML =
        receivingItems.join("");


    /* =========================================================
       DOCUMENTS
    ========================================================= */

    const documents = [

        {
            label: "Picha ya mwombaji",
            path: application.borrower_photo_path
        },

        {
            label: "NIDA - Mbele",
            path: application.nida_front_path
        },

        {
            label: "NIDA - Nyuma",
            path: application.nida_back_path
        },

        {
            label: "Kitambulisho cha Mpiga Kura - Mbele",
            path: application.voter_front_path
        },

        {
            label: "Kitambulisho cha Mpiga Kura - Nyuma",
            path: application.voter_back_path
        },

        {
            label: "Kitambulisho cha Zanzibar - Mbele",
            path: application.zanzibar_front_path
        },

        {
            label: "Kitambulisho cha Zanzibar - Nyuma",
            path: application.zanzibar_back_path
        },

        {
            label: "Leseni - Mbele",
            path: application.license_front_path
        },

        {
            label: "Leseni - Nyuma",
            path: application.license_back_path
        },

        {
            label: "Pasipoti",
            path: application.passport_document_path
        }

    ].filter(function (document) {
        return Boolean(
            document.path
        );
    });


    const documentsList =
        document.getElementById(
            "documentsList"
        );


    if (!documents.length) {

        documentsList.innerHTML = `
            <div class="empty-state">
                Hakuna nyaraka.
            </div>
        `;

    } else {

        documentsList.innerHTML =
            documents.map(function (document) {

                return `
                    <div
                        class="document-item"
                    >

                        <div>
                            <strong>
                                ${escapeHtml(
                                    document.label
                                )}
                            </strong>

                            <small>
                                Nyaraka iliyohifadhiwa
                            </small>
                        </div>

                        <button
                            type="button"
                            class="document-button"
                            data-path="${escapeHtml(
                                document.path
                            )}"
                        >
                            Fungua
                        </button>

                    </div>
                `;

            }).join("");
    }


    /* =========================================================
       SIGNED URLS
    ========================================================= */

    document
        .querySelectorAll(
            ".document-button"
        )
        .forEach(function (button) {

            button.addEventListener(
                "click",
                async function () {

                    const path =
                        button.dataset.path;

                    button.disabled =
                        true;

                    button.textContent =
                        "Inafungua...";


                    try {

                        const {
                            data,
                            error
                        } =
                            await supabaseClient
                                .storage
                                .from(
                                    "loan-documents"
                                )
                                .createSignedUrl(
                                    path,
                                    300
                                );


                        if (error) {
                            throw error;
                        }


                        if (!data?.signedUrl) {
                            throw new Error(
                                "Signed URL haikupatikana."
                            );
                        }


                        window.open(
                            data.signedUrl,
                            "_blank",
                            "noopener,noreferrer"
                        );


                    } catch (error) {

                        console.error(
                            "Document error:",
                            error
                        );

                        alert(
                            "Imeshindikana kufungua nyaraka."
                        );

                    } finally {

                        button.disabled =
                            false;

                        button.textContent =
                            "Fungua";
                    }
                }
            );
        });


    /* =========================================================
       BORROWER PHOTO
    ========================================================= */

    const photoContainer =
        document.getElementById(
            "borrowerPhoto"
        );


    if (
        application.borrower_photo_path
    ) {

        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .storage
                    .from(
                        "loan-documents"
                    )
                    .createSignedUrl(
                        application.borrower_photo_path,
                        300
                    );


            if (
                !error &&
                data?.signedUrl
            ) {

                photoContainer.innerHTML = `
                    <img
                        src="${data.signedUrl}"
                        alt="Picha ya ${escapeHtml(
                            application.full_name
                        )}"
                    >
                `;
            }

        } catch (photoError) {

            console.error(
                "Photo error:",
                photoError
            );
        }
    }


    /* =========================================================
       SHOW CONTENT
    ========================================================= */

    loading.classList.add(
        "hidden"
    );

    content.classList.remove(
        "hidden"
    );


    /* =========================================================
       LOGOUT
    ========================================================= */

    document
        .getElementById(
            "logoutButton"
        )
        .addEventListener(
            "click",
            async function () {

                await supabaseClient.auth.signOut();

                window.location.href =
                    "login.html";
            }
        );


    /* =========================================================
       ERROR HANDLER
    ========================================================= */

    function showError(message) {

        loading.classList.add(
            "hidden"
        );

        errorElement.textContent =
            message;

        errorElement.classList.remove(
            "hidden"
        );
    }

});