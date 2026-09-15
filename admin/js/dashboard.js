"use strict";

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const supabaseClient =
            window.supabaseClient;

        if (!supabaseClient) {

            window.location.href =
                "login.html";

            return;
        }


        const tableBody =
            document.getElementById(
                "applicationsTableBody"
            );

        const loadingState =
            document.getElementById(
                "loadingState"
            );

        const emptyState =
            document.getElementById(
                "emptyState"
            );

        const tableContainer =
            document.getElementById(
                "tableContainer"
            );

        const searchInput =
            document.getElementById(
                "searchInput"
            );

        const dashboardError =
            document.getElementById(
                "dashboardError"
            );


        let applications = [];


        /*
        ========================================
        ADMIN AUTHENTICATION
        ========================================
        */

        async function requireAdmin() {

            const {
                data,
                error
            } =
                await supabaseClient.auth
                    .getSession();


            if (
                error ||
                !data.session
            ) {

                window.location.href =
                    "login.html";

                return null;
            }


            const user =
                data.session.user;


            if (
                user?.app_metadata?.role !==
                "admin"
            ) {

                await supabaseClient
                    .auth
                    .signOut();

                window.location.href =
                    "login.html";

                return null;
            }


            const adminEmail =
                document.getElementById(
                    "adminEmail"
                );


            if (adminEmail) {

                adminEmail.textContent =
                    user.email ||
                    "Admin";

            }


            return user;
        }


        const admin =
            await requireAdmin();


        if (!admin) {
            return;
        }


        /*
        ========================================
        ERROR
        ========================================
        */

        function showError(message) {

            dashboardError.textContent =
                message;

            dashboardError.classList.remove(
                "hidden"
            );
        }


        /*
        ========================================
        MONEY FORMAT
        ========================================
        */

        function formatMoney(value) {

            return Number(
                value || 0
            ).toLocaleString(
                "en-US"
            );
        }


        /*
        ========================================
        DATE FORMAT
        ========================================
        */

        function formatDate(value) {

            if (!value) {
                return "—";
            }


            return new Date(value)
                .toLocaleDateString(
                    "sw-TZ",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                );
        }


        /*
        ========================================
        PHONE NORMALIZATION
        ========================================
        */

        function normalizeTanzaniaPhone(
            phone
        ) {

            if (!phone) {
                return "";
            }


            let number =
                String(phone)
                    .trim()
                    .replace(
                        /[\s\-().]/g,
                        ""
                    );


            /*
            +255712345678
            →
            255712345678
            */

            if (
                number.startsWith(
                    "+255"
                )
            ) {

                number =
                    number.substring(1);

            }


            /*
            0712345678
            →
            255712345678
            */

            else if (
                number.startsWith("0")
            ) {

                number =
                    "255" +
                    number.substring(1);

            }


            /*
            Already:
            255712345678
            */

            return number;
        }


        /*
        ========================================
        PHONE DISPLAY
        ========================================
        */

        function formatPhoneForDisplay(
            phone
        ) {

            if (!phone) {
                return "—";
            }


            return String(phone)
                .trim();
        }


        /*
        ========================================
        LOAD APPLICATIONS
        ========================================
        */

        async function loadApplications() {

            loadingState.classList.remove(
                "hidden"
            );

            emptyState.classList.add(
                "hidden"
            );

            tableContainer.classList.add(
                "hidden"
            );


            const {
                data,
                error
            } =
                await supabaseClient
                    .from(
                        "loan_applications"
                    )
                    .select(`
                        id,
                        created_at,
                        full_name,
                        phone,
                        region,
                        loan_amount
                    `)
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    );


            loadingState.classList.add(
                "hidden"
            );


            if (error) {

                console.error(
                    "Application query error:",
                    error
                );


                showError(
                    "Imeshindikana kupakia maombi."
                );

                return;
            }


            applications =
                data || [];


            updateStats(
                applications
            );


            renderApplications(
                applications
            );
        }


        /*
        ========================================
        STATISTICS
        ========================================
        */

        function updateStats(data) {

            const total =
                data.length;


            const today =
                new Date();


            const todayString =
                today
                    .toISOString()
                    .slice(
                        0,
                        10
                    );


            const todayCount =
                data.filter(
                    function (item) {

                        return (
                            item.created_at
                                ?.slice(
                                    0,
                                    10
                                ) ===
                            todayString
                        );

                    }
                ).length;


            const totalAmount =
                data.reduce(
                    function (
                        sum,
                        item
                    ) {

                        return (
                            sum +
                            Number(
                                item.loan_amount ||
                                0
                            )
                        );

                    },
                    0
                );


            document.getElementById(
                "totalApplications"
            ).textContent =
                total.toLocaleString();


            document.getElementById(
                "todayApplications"
            ).textContent =
                todayCount.toLocaleString();


            document.getElementById(
                "totalLoanAmount"
            ).textContent =
                `TZS ${formatMoney(
                    totalAmount
                )}`;
        }


        /*
        ========================================
        RENDER APPLICATIONS
        ========================================
        */

        function renderApplications(
            data
        ) {

            tableBody.innerHTML = "";


            if (!data.length) {

                emptyState.classList.remove(
                    "hidden"
                );

                tableContainer.classList.add(
                    "hidden"
                );

                return;
            }


            emptyState.classList.add(
                "hidden"
            );

            tableContainer.classList.remove(
                "hidden"
            );


            data.forEach(
                function (application) {

                    const row =
                        document.createElement(
                            "tr"
                        );


                    const phone =
                        formatPhoneForDisplay(
                            application.phone
                        );


                    const whatsappNumber =
                        normalizeTanzaniaPhone(
                            application.phone
                        );


                    const callNumber =
                        whatsappNumber
                            ? `+${whatsappNumber}`
                            : "";


                    const encodedWhatsAppNumber =
                        encodeURIComponent(
                            whatsappNumber
                        );


                    /*
                    ========================================
                    ACTION BUTTONS
                    ========================================
                    */

                    const callButton =
                        whatsappNumber
                            ? `
                                <a
                                    class="action-button call-button"
                                    href="tel:${callNumber}"
                                    aria-label="Mpigie ${escapeHtml(
                                        application.full_name
                                    )}"
                                    title="Piga simu"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.08 5.18 2 2 0 0 1 5.06 3h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L9 10.73a16 16 0 0 0 4.27 4.27l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z"
                                        ></path>
                                    </svg>

                                    <span>
                                        Call
                                    </span>
                                </a>
                            `
                            : `
                                <button
                                    class="action-button call-button disabled"
                                    type="button"
                                    disabled
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.08 5.18 2 2 0 0 1 5.06 3h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L9 10.73a16 16 0 0 0 4.27 4.27l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z"
                                        ></path>
                                    </svg>

                                    <span>
                                        Call
                                    </span>
                                </button>
                            `;


                    const whatsappButton =
                        whatsappNumber
                            ? `
                                <a
                                    class="action-button whatsapp-button"
                                    href="https://wa.me/${encodedWhatsAppNumber}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="WhatsApp ${escapeHtml(
                                        application.full_name
                                    )}"
                                    title="Tuma WhatsApp"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M20.52 3.48A11.86 11.86 0 0 0 12.08 0C5.56 0 .26 5.3.26 11.82c0 2.08.54 4.1 1.57 5.88L.16 24l6.45-1.64a11.82 11.82 0 0 0 5.46 1.34h.01c6.52 0 11.82-5.3 11.82-11.82 0-3.16-1.23-6.13-3.38-8.4zM12.08 21.7h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.83.98 1.02-3.73-.23-.38a9.88 9.88 0 0 1-1.51-5.16C2.13 6.37 6.59 1.91 12.08 1.91c2.66 0 5.16 1.04 7.04 2.93a9.9 9.9 0 0 1 2.91 7.04c0 5.49-4.46 9.95-9.95 9.95z"
                                        ></path>

                                        <path
                                            d="M17.55 14.84c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.28-.47-2.44-1.5-.9-.8-1.5-1.79-1.68-2.09-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.08 4.5.71.31 1.27.49 1.7.63.71.23 1.35.2 1.86.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"
                                        ></path>
                                    </svg>

                                    <span>
                                        WhatsApp
                                    </span>
                                </a>
                            `
                            : `
                                <button
                                    class="action-button whatsapp-button disabled"
                                    type="button"
                                    disabled
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M20.52 3.48A11.86 11.86 0 0 0 12.08 0C5.56 0 .26 5.3.26 11.82c0 2.08.54 4.1 1.57 5.88L.16 24l6.45-1.64a11.82 11.82 0 0 0 5.46 1.34h.01c6.52 0 11.82-5.3 11.82-11.82 0-3.16-1.23-6.13-3.38-8.4zM12.08 21.7h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.83.98 1.02-3.73-.23-.38a9.88 9.88 0 0 1-1.51-5.16C2.13 6.37 6.59 1.91 12.08 1.91c2.66 0 5.16 1.04 7.04 2.93a9.9 9.9 0 0 1 2.91 7.04c0 5.49-4.46 9.95-9.95 9.95z"
                                        ></path>

                                        <path
                                            d="M17.55 14.84c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.28-.47-2.44-1.5-.9-.8-1.5-1.79-1.68-2.09-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.08 4.5.71.31 1.27.49 1.7.63.71.23 1.35.2 1.86.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"
                                        ></path>
                                    </svg>

                                    <span>
                                        WhatsApp
                                    </span>
                                </button>
                            `;


                    const viewButton = `
                        <a
                            class="action-button view-button"
                            href="details.html?id=${encodeURIComponent(
                                application.id
                            )}"
                            aria-label="Tazama ${escapeHtml(
                                application.full_name
                            )}"
                            title="Tazama maombi"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"
                                ></path>

                                <circle
                                    cx="12"
                                    cy="12"
                                    r="2.5"
                                ></circle>
                            </svg>

                            <span>
                                Tazama
                            </span>
                        </a>
                    `;


                    row.innerHTML = `

                        <td data-label="Jina">

                            <strong>
                                ${escapeHtml(
                                    application.full_name
                                )}
                            </strong>

                        </td>


                        <td data-label="Simu">

                            ${escapeHtml(
                                formatPhoneForDisplay(
                                    phone
                                )
                            )}

                        </td>


                        <td data-label="Mkoa">

                            ${escapeHtml(
                                application.region
                            )}

                        </td>


                        <td data-label="Kiasi">

                            <strong>
                                TZS ${formatMoney(
                                    application.loan_amount
                                )}
                            </strong>

                        </td>


                        <td data-label="Tarehe">

                            ${formatDate(
                                application.created_at
                            )}

                        </td>


                        <td
                            data-label="Vitendo"
                            class="actions-cell"
                        >

                            <div
                                class="application-actions"
                            >

                                ${callButton}

                                ${whatsappButton}

                                ${viewButton}

                            </div>

                        </td>

                    `;


                    tableBody.appendChild(
                        row
                    );

                }
            );
        }


        /*
        ========================================
        SEARCH
        ========================================
        */

        searchInput.addEventListener(
            "input",
            function () {

                const query =
                    searchInput.value
                        .trim()
                        .toLowerCase();


                if (!query) {

                    renderApplications(
                        applications
                    );

                    return;
                }


                const filtered =
                    applications.filter(
                        function (
                            application
                        ) {

                            return (

                                application
                                    .full_name
                                    ?.toLowerCase()
                                    .includes(
                                        query
                                    )

                                ||

                                application
                                    .phone
                                    ?.toLowerCase()
                                    .includes(
                                        query
                                    )

                                ||

                                application
                                    .region
                                    ?.toLowerCase()
                                    .includes(
                                        query
                                    )

                            );

                        }
                    );


                renderApplications(
                    filtered
                );

            }
        );


        /*
        ========================================
        LOGOUT
        ========================================
        */

        document
            .getElementById(
                "logoutButton"
            )
            .addEventListener(
                "click",
                async function () {

                    await supabaseClient
                        .auth
                        .signOut();


                    window.location.href =
                        "login.html";

                }
            );


        /*
        ========================================
        ESCAPE HTML
        ========================================
        */

        function escapeHtml(value) {

            return String(
                value ?? ""
            )
                .replaceAll(
                    "&",
                    "&amp;"
                )
                .replaceAll(
                    "<",
                    "&lt;"
                )
                .replaceAll(
                    ">",
                    "&gt;"
                )
                .replaceAll(
                    '"',
                    "&quot;"
                )
                .replaceAll(
                    "'",
                    "&#039;"
                );
        }


        /*
        ========================================
        START
        ========================================
        */

        await loadApplications();

    }
);