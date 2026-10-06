"use strict";

document.addEventListener("DOMContentLoaded", async function () {

    /* =====================================================
       SUPABASE
    ===================================================== */

    const supabaseClient = window.supabaseClient;

    if (!supabaseClient) {
        window.location.href = "login.html";
        return;
    }


    /* =====================================================
       DOM
    ===================================================== */

    const tableBody =
        document.getElementById("applicationsTableBody");

    const loadingState =
        document.getElementById("loadingState");

    const emptyState =
        document.getElementById("emptyState");

    const tableContainer =
        document.getElementById("tableContainer");

    const dashboardError =
        document.getElementById("dashboardError");

    const searchInput =
        document.getElementById("searchInput");

    const regionFilter =
        document.getElementById("regionFilter");

    const loanFilter =
        document.getElementById("loanFilter");

    const sortSelect =
        document.getElementById("sortSelect");

    const clearFiltersButton =
        document.getElementById("clearFiltersButton");

    const refreshButton =
        document.getElementById("refreshButton");

    const exportButton =
        document.getElementById("exportButton");

    const pageSizeSelect =
        document.getElementById("pageSizeSelect");

    const paginationControls =
        document.getElementById("paginationControls");

    const previousPageButton =
        document.getElementById("previousPageButton");

    const nextPageButton =
        document.getElementById("nextPageButton");

    const pageInfo =
        document.getElementById("pageInfo");

    const paginationSummary =
        document.getElementById("paginationSummary");

    const notificationButton =
        document.getElementById("notificationButton");

    const notificationPanel =
        document.getElementById("notificationPanel");

    const notificationBadge =
        document.getElementById("notificationBadge");

    const notificationList =
        document.getElementById("notificationList");

    const markNotificationsRead =
        document.getElementById("markNotificationsRead");

    const actionModal =
        document.getElementById("actionModal");

    const closeActionModal =
        document.getElementById("closeActionModal");

    const actionModalTitle =
        document.getElementById("actionModalTitle");

    const actionModalSubtitle =
        document.getElementById("actionModalSubtitle");

    const actionModalActions =
        document.getElementById("actionModalActions");

    const deleteModal =
        document.getElementById("deleteModal");

    const deleteTargetName =
        document.getElementById("deleteTargetName");

    const cancelDeleteButton =
        document.getElementById("cancelDeleteButton");

    const confirmDeleteButton =
        document.getElementById("confirmDeleteButton");

    const toastContainer =
        document.getElementById("toastContainer");

    const mobileMenuButton =
        document.getElementById("mobileMenuButton");

    const sidebar =
        document.getElementById("sidebar");


    /* =====================================================
       STATE
    ===================================================== */

    let applications = [];

    let filteredApplications = [];

    let currentPage = 1;

    let pageSize =
        Number(pageSizeSelect?.value || 10);

    let pendingDeleteId = null;

    let realtimeChannel = null;

    let isLoading = false;


    /* =====================================================
       ADMIN AUTH
    ===================================================== */

    async function requireAdmin() {

        const {
            data,
            error
        } = await supabaseClient.auth.getSession();

        if (
            error ||
            !data.session
        ) {
            window.location.href = "login.html";
            return null;
        }

        const user = data.session.user;

        const role =
            user?.app_metadata?.role;

        if (role !== "admin") {

            await supabaseClient.auth.signOut();

            window.location.href = "login.html";

            return null;
        }

        const adminEmail =
            document.getElementById("adminEmail");

        if (adminEmail) {
            adminEmail.textContent =
                user.email || "Admin";
        }

        return user;
    }


    const admin = await requireAdmin();

    if (!admin) {
        return;
    }


    /* =====================================================
       HELPERS
    ===================================================== */

    function escapeHtml(value) {

        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    function formatMoney(value) {

        return Number(value || 0)
            .toLocaleString("en-US");
    }


    function formatDate(value) {

        if (!value) {
            return "—";
        }

        return new Date(value)
            .toLocaleDateString("sw-TZ", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
    }


    function formatPhone(phone) {

        if (!phone) {
            return "—";
        }

        return String(phone).trim();
    }


    function normalizeTanzaniaPhone(phone) {

        if (!phone) {
            return "";
        }

        let number =
            String(phone)
                .trim()
                .replace(/[\s\-().]/g, "");

        if (number.startsWith("+255")) {

            number =
                number.substring(1);

        } else if (
            number.startsWith("0")
        ) {

            number =
                "255" +
                number.substring(1);
        }

        return number;
    }


    function getLocalDateKey(value) {

        const date =
            value instanceof Date
                ? value
                : new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return [
            date.getFullYear(),
            String(date.getMonth() + 1)
                .padStart(2, "0"),
            String(date.getDate())
                .padStart(2, "0")
        ].join("-");
    }


    function getStartOfToday() {

        const date = new Date();

        date.setHours(0, 0, 0, 0);

        return date;
    }


    function getStartOfWeek() {

        const date =
            getStartOfToday();

        const day =
            date.getDay();

        const daysFromMonday =
            day === 0 ? 6 : day - 1;

        date.setDate(
            date.getDate() -
            daysFromMonday
        );

        return date;
    }


    function getStartOfMonth() {

        const date =
            getStartOfToday();

        date.setDate(1);

        return date;
    }


    function showError(message) {

        if (!dashboardError) {
            return;
        }

        dashboardError.textContent =
            message;

        dashboardError.classList.remove(
            "hidden"
        );
    }


    function clearError() {

        dashboardError?.classList.add(
            "hidden"
        );
    }


    function setText(id, value) {

        const element =
            document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    }


    function showToast(
        message,
        type = "success"
    ) {

        if (!toastContainer) {
            return;
        }

        const toast =
            document.createElement("div");

        toast.className =
            `toast ${type}`;

        toast.textContent =
            message;

        toastContainer.appendChild(
            toast
        );

        setTimeout(() => {

            toast.remove();

        }, 3500);
    }


    /* =====================================================
       LOAD APPLICATIONS
    ===================================================== */

    async function loadApplications(
        options = {}
    ) {

        const {
            silent = false
        } = options;

        if (isLoading) {
            return;
        }

        isLoading = true;

        clearError();

        if (!silent) {

            loadingState.classList.remove(
                "hidden"
            );

            emptyState.classList.add(
                "hidden"
            );

            tableContainer.classList.add(
                "hidden"
            );
        }

        const {
            data,
            error
        } = await supabaseClient
            .from("loan_applications")
            .select(`
                id,
                created_at,
                full_name,
                phone,
                region,
                district,
                ward,
                loan_amount,
                savings_amount,
                repayment_period,
                borrower_photo_path,
                nida_front_path,
                nida_back_path,
                voter_front_path,
                voter_back_path,
                zanzibar_front_path,
                zanzibar_back_path,
                license_front_path,
                license_back_path,
                passport_document_path
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        isLoading = false;

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

        populateRegionFilter();

        setInitialNotificationReadState();

        applyFilters();
    }


    /* =====================================================
       KPI
    ===================================================== */

    function updateStats(data) {

        const today =
            getStartOfToday();

        const weekStart =
            getStartOfWeek();

        const monthStart =
            getStartOfMonth();

        const todayKey =
            getLocalDateKey(today);


        const todayApplications =
            data.filter(application => {

                return getLocalDateKey(
                    application.created_at
                ) === todayKey;

            });


        const totalLoanAmount =
            data.reduce(
                (sum, application) => {

                    return sum +
                        Number(
                            application.loan_amount || 0
                        );

                },
                0
            );


        const todayLoanAmount =
            todayApplications.reduce(
                (sum, application) => {

                    return sum +
                        Number(
                            application.loan_amount || 0
                        );

                },
                0
            );


        const regionCounts = {};

        data.forEach(application => {

            const region =
                String(
                    application.region || ""
                ).trim();

            if (!region) {
                return;
            }

            regionCounts[region] =
                (regionCounts[region] || 0) + 1;

        });


        let mostRegion = "—";
        let mostRegionCount = 0;

        Object.entries(regionCounts)
            .forEach(
                ([region, count]) => {

                    if (
                        count >
                        mostRegionCount
                    ) {

                        mostRegion =
                            region;

                        mostRegionCount =
                            count;
                    }

                }
            );


        setText(
            "todayApplications",
            todayApplications.length
                .toLocaleString()
        );


        setText(
            "totalApplications",
            data.length.toLocaleString()
        );


        setText(
            "todayLoanAmount",
            `TZS ${formatMoney(
                todayLoanAmount
            )}`
        );


        setText(
            "totalLoanAmount",
            `TZS ${formatMoney(
                totalLoanAmount
            )}`
        );


        setText(
            "mostApplicationRegion",
            mostRegion
        );


        setText(
            "mostApplicationRegionCount",
            mostRegion === "—"
                ? "Hakuna data"
                : `${mostRegionCount.toLocaleString()} maombi`
        );
    }


    /* =====================================================
       REGION FILTER
    ===================================================== */

    function populateRegionFilter() {

        if (!regionFilter) {
            return;
        }

        const currentValue =
            regionFilter.value;

        const regions =
            [
                ...new Set(
                    applications
                        .map(
                            application =>
                                String(
                                    application.region || ""
                                ).trim()
                        )
                        .filter(Boolean)
                )
            ]
            .sort(
                (a, b) =>
                    a.localeCompare(
                        b,
                        "sw"
                    )
            );


        regionFilter.innerHTML =
            `<option value="">Mikoa yote</option>`;


        regions.forEach(region => {

            const option =
                document.createElement("option");

            option.value =
                region;

            option.textContent =
                region;

            regionFilter.appendChild(
                option
            );

        });


        if (
            regions.includes(
                currentValue
            )
        ) {

            regionFilter.value =
                currentValue;

        }
    }


    /* =====================================================
       FILTER + SORT
    ===================================================== */

    function applyFilters() {

        const query =
            searchInput.value
                .trim()
                .toLowerCase();

        const selectedRegion =
            regionFilter.value;

        const selectedLoan =
            loanFilter.value;

        const sort =
            sortSelect.value;


        let result =
            applications.filter(
                application => {

                    const fullName =
                        String(
                            application.full_name || ""
                        ).toLowerCase();

                    const phone =
                        String(
                            application.phone || ""
                        ).toLowerCase();

                    const region =
                        String(
                            application.region || ""
                        ).toLowerCase();

                    const district =
                        String(
                            application.district || ""
                        ).toLowerCase();

                    const ward =
                        String(
                            application.ward || ""
                        ).toLowerCase();


                    const matchesSearch =
                        !query ||
                        fullName.includes(query) ||
                        phone.includes(query) ||
                        region.includes(query) ||
                        district.includes(query) ||
                        ward.includes(query);


                    const matchesRegion =
                        !selectedRegion ||
                        application.region ===
                            selectedRegion;


                    const amount =
                        Number(
                            application.loan_amount || 0
                        );


                    let matchesLoan =
                        true;


                    if (
                        selectedLoan ===
                        "under500"
                    ) {

                        matchesLoan =
                            amount < 500000;

                    } else if (
                        selectedLoan ===
                        "500to1"
                    ) {

                        matchesLoan =
                            amount >= 500000 &&
                            amount <= 1000000;

                    } else if (
                        selectedLoan ===
                        "1to5"
                    ) {

                        matchesLoan =
                            amount > 1000000 &&
                            amount <= 5000000;

                    } else if (
                        selectedLoan ===
                        "5plus"
                    ) {

                        matchesLoan =
                            amount > 5000000;
                    }


                    return (
                        matchesSearch &&
                        matchesRegion &&
                        matchesLoan
                    );

                }
            );


        result.sort(
            (a, b) => {

                if (sort === "oldest") {

                    return (
                        new Date(
                            a.created_at
                        ) -
                        new Date(
                            b.created_at
                        )
                    );

                }


                if (sort === "highest") {

                    return (
                        Number(
                            b.loan_amount || 0
                        ) -
                        Number(
                            a.loan_amount || 0
                        )
                    );

                }


                if (sort === "lowest") {

                    return (
                        Number(
                            a.loan_amount || 0
                        ) -
                        Number(
                            b.loan_amount || 0
                        )
                    );

                }


                return (
                    new Date(
                        b.created_at
                    ) -
                    new Date(
                        a.created_at
                    )
                );
            }
        );


        filteredApplications =
            result;

        currentPage = 1;

        renderApplications();
    }


    /* =====================================================
       RENDER TABLE
    ===================================================== */

    function renderApplications() {

        tableBody.innerHTML = "";


        if (
            !filteredApplications.length
        ) {

            tableContainer.classList.add(
                "hidden"
            );

            emptyState.classList.remove(
                "hidden"
            );

            paginationControls.classList.add(
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


        const totalPages =
            Math.ceil(
                filteredApplications.length /
                pageSize
            );


        if (
            currentPage >
            totalPages
        ) {

            currentPage =
                totalPages;
        }


        const start =
            (currentPage - 1) *
            pageSize;


        const end =
            start +
            pageSize;


        const pageItems =
            filteredApplications.slice(
                start,
                end
            );


        pageItems.forEach(
            application => {

                const row =
                    document.createElement("tr");


                const phone =
                    formatPhone(
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


                const repayment =
                    Number(
                        application.repayment_period || 0
                    );


                const repaymentText =
                    repayment > 0
                        ? `Miezi ${repayment}`
                        : "—";


                const viewButton = `
                    <a
                        class="action-button view-button"
                        href="details.html?id=${encodeURIComponent(application.id)}"
                        title="Tazama maombi"
                    >

                        <svg viewBox="0 0 24 24">
                            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>

                        <span>Tazama</span>

                    </a>
                `;


                const callButton =
                    whatsappNumber
                        ? `
                            <a
                                class="action-button call-button"
                                href="tel:${callNumber}"
                                title="Piga simu"
                            >

                                <svg viewBox="0 0 24 24">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.08 5.18 2 2 0 0 1 5.06 3h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L9 10.73a16 16 0 0 0 4.27 4.27l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z"></path>
                                </svg>

                                <span>Call</span>

                            </a>
                        `
                        : "";


                const whatsappButton =
                    whatsappNumber
                        ? `
                            <a
                                class="action-button whatsapp-button"
                                href="https://wa.me/${encodedWhatsAppNumber}"
                                target="_blank"
                                rel="noopener noreferrer"
                                title="WhatsApp"
                            >

                                <svg viewBox="0 0 24 24">
                                    <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5Z"></path>
                                    <path d="M8.5 9.5c.3 1.7 2.2 3.6 4 4 .6.1 1-.2 1.3-.7l.4-.7-1.5-.8-.6.7c-.8-.3-1.4-.9-1.7-1.7l.6-.6-.8-1.5-.7.4c-.5.3-.9.9-1 1.5Z"></path>
                                </svg>

                                <span>WhatsApp</span>

                            </a>
                        `
                        : "";


                const deleteButton = `
                    <button
                        type="button"
                        class="action-button delete-button"
                        data-action="delete"
                        data-id="${escapeHtml(application.id)}"
                        title="Futa maombi"
                    >

                        <svg viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6l-1 14H6L5 6"></path>
                            <path d="M10 11v5"></path>
                            <path d="M14 11v5"></path>
                            <path d="M9 6V4h6v2"></path>
                        </svg>

                        <span>Futa</span>

                    </button>
                `;


                const moreButton = `
                    <button
                        type="button"
                        class="more-button"
                        data-action="more"
                        data-id="${escapeHtml(application.id)}"
                        aria-label="Vitendo vya ${escapeHtml(application.full_name)}"
                    >

                        <svg viewBox="0 0 24 24">
                            <circle cx="5" cy="12" r="1.5"></circle>
                            <circle cx="12" cy="12" r="1.5"></circle>
                            <circle cx="19" cy="12" r="1.5"></circle>
                        </svg>

                    </button>
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
                        ${escapeHtml(phone)}
                    </td>


                    <td data-label="Mkoa">
                        ${escapeHtml(
                            application.region || "—"
                        )}
                    </td>


                    <td data-label="Kiasi cha Mkopo">
                        <strong>
                            TZS ${formatMoney(
                                application.loan_amount
                            )}
                        </strong>
                    </td>


                    <td data-label="Muda">
                        ${repaymentText}
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

                        <div class="application-actions">

                            ${viewButton}

                            ${callButton}

                            ${whatsappButton}

                            ${deleteButton}

                        </div>

                        ${moreButton}

                    </td>

                `;


                tableBody.appendChild(
                    row
                );

            }
        );


        updatePagination(
            totalPages,
            start,
            end
        );
    }


    /* =====================================================
       PAGINATION
    ===================================================== */

    function updatePagination(
        totalPages,
        start,
        end
    ) {

        if (
            filteredApplications.length <=
            pageSize
        ) {

            paginationControls.classList.add(
                "hidden"
            );

            return;
        }


        paginationControls.classList.remove(
            "hidden"
        );


        pageInfo.textContent =
            `${currentPage} / ${totalPages}`;


        const displayedEnd =
            Math.min(
                end,
                filteredApplications.length
            );


        paginationSummary.textContent =
            `${start + 1}–${displayedEnd} ya ${filteredApplications.length}`;


        previousPageButton.disabled =
            currentPage <= 1;


        nextPageButton.disabled =
            currentPage >= totalPages;
    }


    previousPageButton.addEventListener(
        "click",
        function () {

            if (currentPage > 1) {

                currentPage--;

                renderApplications();

            }

        }
    );


    nextPageButton.addEventListener(
        "click",
        function () {

            const totalPages =
                Math.ceil(
                    filteredApplications.length /
                    pageSize
                );

            if (
                currentPage <
                totalPages
            ) {

                currentPage++;

                renderApplications();

            }

        }
    );


    pageSizeSelect.addEventListener(
        "change",
        function () {

            pageSize =
                Number(
                    pageSizeSelect.value
                );

            currentPage = 1;

            renderApplications();

        }
    );


    /* =====================================================
       SEARCH + FILTERS
    ===================================================== */

    searchInput.addEventListener(
        "input",
        applyFilters
    );


    regionFilter.addEventListener(
        "change",
        applyFilters
    );


    loanFilter.addEventListener(
        "change",
        applyFilters
    );


    sortSelect.addEventListener(
        "change",
        applyFilters
    );


    clearFiltersButton.addEventListener(
        "click",
        function () {

            searchInput.value = "";

            regionFilter.value = "";

            loanFilter.value = "";

            sortSelect.value = "newest";

            currentPage = 1;

            applyFilters();

        }
    );


    /* =====================================================
       MOBILE ACTION MODAL
    ===================================================== */

    function openActionModal(id) {

        const application =
            applications.find(
                item =>
                    String(item.id) ===
                    String(id)
            );

        if (!application) {
            return;
        }


        const whatsappNumber =
            normalizeTanzaniaPhone(
                application.phone
            );


        const encodedNumber =
            encodeURIComponent(
                whatsappNumber
            );


        actionModalTitle.textContent =
            application.full_name ||
            "Applicant";


        actionModalSubtitle.textContent =
            `${formatPhone(
                application.phone
            )} • ${application.region || "Mkoa haujawekwa"}`;


        actionModalActions.innerHTML = `

            <a
                class="mobile-action"
                href="details.html?id=${encodeURIComponent(application.id)}"
            >

                <svg viewBox="0 0 24 24">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>

                <span>Tazama Maombi</span>

            </a>


            ${
                whatsappNumber
                    ? `
                        <a
                            class="mobile-action"
                            href="tel:+${whatsappNumber}"
                        >

                            <svg viewBox="0 0 24 24">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.08 5.18 2 2 0 0 1 5.06 3h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L9 10.73a16 16 0 0 0 4.27 4.27l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z"></path>
                            </svg>

                            <span>Piga Simu</span>

                        </a>


                        <a
                            class="mobile-action"
                            href="https://wa.me/${encodedNumber}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >

                            <svg viewBox="0 0 24 24">
                                <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5Z"></path>
                                <path d="M8.5 9.5c.3 1.7 2.2 3.6 4 4 .6.1 1-.2 1.3-.7l.4-.7-1.5-.8-.6.7c-.8-.3-1.4-.9-1.7-1.7l.6-.6-.8-1.5-.7.4c-.5.3-.9.9-1 1.5Z"></path>
                            </svg>

                            <span>Fungua WhatsApp</span>

                        </a>
                    `
                    : ""
            }


            <button
                type="button"
                class="mobile-action danger"
                data-mobile-delete="${escapeHtml(application.id)}"
            >

                <svg viewBox="0 0 24 24">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6l-1 14H6L5 6"></path>
                    <path d="M10 11v5"></path>
                    <path d="M14 11v5"></path>
                    <path d="M9 6V4h6v2"></path>
                </svg>

                <span>Futa Maombi</span>

            </button>

        `;


        actionModal.classList.remove(
            "hidden"
        );

        actionModal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow =
            "hidden";
    }


    function closeActionModalFunction() {

        actionModal.classList.add(
            "hidden"
        );

        actionModal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.style.overflow =
            "";
    }


    closeActionModal.addEventListener(
        "click",
        closeActionModalFunction
    );


    actionModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target.matches(
                    "[data-close-action-modal]"
                )
            ) {

                closeActionModalFunction();

            }


            const deleteButton =
                event.target.closest(
                    "[data-mobile-delete]"
                );


            if (deleteButton) {

                closeActionModalFunction();

                openDeleteModal(
                    deleteButton.dataset.mobileDelete
                );
            }

        }
    );


    /* =====================================================
       TABLE ACTIONS
    ===================================================== */

    tableBody.addEventListener(
        "click",
        function (event) {

            const actionButton =
                event.target.closest(
                    "[data-action]"
                );

            if (!actionButton) {
                return;
            }


            const action =
                actionButton.dataset.action;

            const id =
                actionButton.dataset.id;


            if (action === "more") {

                openActionModal(id);

                return;
            }


            if (action === "delete") {

                openDeleteModal(id);

            }

        }
    );


    /* =====================================================
       DELETE
    ===================================================== */

    function openDeleteModal(id) {

        const application =
            applications.find(
                item =>
                    String(item.id) ===
                    String(id)
            );

        if (!application) {
            return;
        }


        pendingDeleteId =
            application.id;


        deleteTargetName.textContent =
            application.full_name ||
            "Applicant";


        deleteModal.classList.remove(
            "hidden"
        );

        deleteModal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow =
            "hidden";
    }


    function closeDeleteModal() {

        deleteModal.classList.add(
            "hidden"
        );

        deleteModal.setAttribute(
            "aria-hidden",
            "true"
        );

        pendingDeleteId =
            null;

        document.body.style.overflow =
            "";
    }


    cancelDeleteButton.addEventListener(
        "click",
        closeDeleteModal
    );


    deleteModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target.matches(
                    "[data-close-delete-modal]"
                )
            ) {

                closeDeleteModal();

            }

        }
    );


    async function deleteApplication() {

        if (!pendingDeleteId) {
            return;
        }


        const application =
            applications.find(
                item =>
                    String(item.id) ===
                    String(pendingDeleteId)
            );


        if (!application) {

            closeDeleteModal();

            return;
        }


        const originalText =
            confirmDeleteButton.textContent;


        confirmDeleteButton.disabled =
            true;

        confirmDeleteButton.textContent =
            "Inafuta...";


        try {

            const {
                error
            } = await supabaseClient
                .from("loan_applications")
                .delete()
                .eq(
                    "id",
                    pendingDeleteId
                );


            if (error) {
                throw error;
            }


            /*
             * Remove uploaded documents from
             * Supabase Storage when paths exist.
             */

            const storagePaths = [
                application.borrower_photo_path,
                application.nida_front_path,
                application.nida_back_path,
                application.voter_front_path,
                application.voter_back_path,
                application.zanzibar_front_path,
                application.zanzibar_back_path,
                application.license_front_path,
                application.license_back_path,
                application.passport_document_path
            ].filter(Boolean);


            if (storagePaths.length) {

                const {
                    error:
                        storageError
                } =
                    await supabaseClient
                        .storage
                        .from("loan-documents")
                        .remove(
                            storagePaths
                        );


                if (storageError) {

                    console.warn(
                        "Storage cleanup warning:",
                        storageError
                    );

                    showToast(
                        "Maombi yamefutwa, lakini baadhi ya files hazikufutika.",
                        "warning"
                    );

                }

            }


            applications =
                applications.filter(
                    item =>
                        String(item.id) !==
                        String(pendingDeleteId)
                );


            updateStats(
                applications
            );

            populateRegionFilter();

            applyFilters();

            closeDeleteModal();


            if (
                !storagePaths.length
            ) {

                showToast(
                    "Maombi yamefutwa kikamilifu."
                );

            }


        } catch (error) {

            console.error(
                "Delete application error:",
                error
            );


            showToast(
                "Imeshindikana kufuta maombi. Hakikisha ruhusa za Supabase.",
                "error"
            );

        } finally {

            confirmDeleteButton.disabled =
                false;

            confirmDeleteButton.textContent =
                originalText;
        }
    }


    confirmDeleteButton.addEventListener(
        "click",
        deleteApplication
    );


    /* =====================================================
       CSV EXPORT
    ===================================================== */

    function csvEscape(value) {

        const text =
            String(value ?? "");

        return `"${text.replaceAll(
            '"',
            '""'
        )}"`;
    }


    function exportCSV() {

        if (
            !filteredApplications.length
        ) {

            showToast(
                "Hakuna data ya ku-export.",
                "warning"
            );

            return;
        }


        const headers = [
            "Jina",
            "Simu",
            "Mkoa",
            "Wilaya",
            "Kata",
            "Kiasi cha Mkopo",
            "Akiba",
            "Muda wa Marejesho",
            "Tarehe"
        ];


        const rows =
            filteredApplications.map(
                application => [

                    application.full_name,

                    application.phone,

                    application.region,

                    application.district,

                    application.ward,

                    application.loan_amount,

                    application.savings_amount,

                    application.repayment_period,

                    formatDate(
                        application.created_at
                    )

                ]
            );


        const csv = [
            headers,
            ...rows
        ]
            .map(
                row =>
                    row
                        .map(csvEscape)
                        .join(",")
            )
            .join("\r\n");


        const blob =
            new Blob(
                [
                    "\uFEFF" +
                    csv
                ],
                {
                    type:
                        "text/csv;charset=utf-8;"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement("a");

        link.href =
            url;

        link.download =
            `samia-mikopo-${getLocalDateKey(
                new Date()
            )}.csv`;

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        URL.revokeObjectURL(
            url
        );


        showToast(
            `${filteredApplications.length} maombi yame-exportiwa.`
        );
    }


    exportButton.addEventListener(
        "click",
        exportCSV
    );


    /* =====================================================
       REFRESH
    ===================================================== */

    refreshButton.addEventListener(
        "click",
        async function () {

            const originalText =
                refreshButton.innerHTML;


            refreshButton.disabled =
                true;


            refreshButton.innerHTML =
                `
                    <span class="spinner"
                          style="width:13px;height:13px;border-width:2px;">
                    </span>
                    <span>Inapakia...</span>
                `;


            await loadApplications();


            refreshButton.disabled =
                false;


            refreshButton.innerHTML =
                originalText;


            showToast(
                "Dashboard imehuishwa."
            );

        }
    );


    /* =====================================================
       NOTIFICATIONS
    ===================================================== */

    const notificationStorageKey =
        "samia_admin_notifications_read_at";


    function setInitialNotificationReadState() {

        const saved =
            localStorage.getItem(
                notificationStorageKey
            );


        if (
            saved ||
            !applications.length
        ) {

            updateNotificationBadge();

            return;
        }


        const latest =
            applications[0]?.created_at ||
            new Date().toISOString();


        localStorage.setItem(
            notificationStorageKey,
            latest
        );


        updateNotificationBadge();
    }


    function updateNotificationBadge() {

        const readAt =
            localStorage.getItem(
                notificationStorageKey
            );


        if (!readAt) {

            notificationBadge.classList.add(
                "hidden"
            );

            return;
        }


        const unread =
            applications.some(
                application => {

                    return new Date(
                        application.created_at
                    ) >
                    new Date(readAt);

                }
            );


        notificationBadge.classList.toggle(
            "hidden",
            !unread
        );


        renderNotifications();
    }


    function renderNotifications() {

        if (!notificationList) {
            return;
        }


        const readAt =
            localStorage.getItem(
                notificationStorageKey
            );


        const notifications =
            applications
                .filter(
                    application => {

                        if (!readAt) {
                            return false;
                        }

                        return new Date(
                            application.created_at
                        ) >
                        new Date(readAt);

                    }
                )
                .slice(0, 5);


        if (!notifications.length) {

            notificationList.innerHTML =
                `
                    <p class="notification-empty">
                        Hakuna notifications mpya.
                    </p>
                `;

            return;
        }


        notificationList.innerHTML =
            notifications
                .map(
                    application => {

                        return `
                            <a
                                class="notification-item"
                                href="details.html?id=${encodeURIComponent(application.id)}"
                            >

                                <strong>
                                    ${escapeHtml(
                                        application.full_name
                                    )}
                                </strong>

                                <span>
                                    Ameomba TZS
                                    ${formatMoney(
                                        application.loan_amount
                                    )}
                                    •
                                    ${formatDate(
                                        application.created_at
                                    )}
                                </span>

                            </a>
                        `;

                    }
                )
                .join("");
    }


    notificationButton.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            const isHidden =
                notificationPanel.classList.contains(
                    "hidden"
                );


            notificationPanel.classList.toggle(
                "hidden"
            );


            notificationButton.setAttribute(
                "aria-expanded",
                String(isHidden)
            );

        }
    );


    markNotificationsRead.addEventListener(
        "click",
        function () {

            localStorage.setItem(
                notificationStorageKey,
                new Date().toISOString()
            );


            updateNotificationBadge();

            showToast(
                "Notifications zimewekwa kama zimesomwa."
            );

        }
    );


    document.addEventListener(
        "click",
        function (event) {

            if (
                !notificationPanel.contains(
                    event.target
                ) &&
                !notificationButton.contains(
                    event.target
                )
            ) {

                notificationPanel.classList.add(
                    "hidden"
                );

                notificationButton.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }
    );


    /* =====================================================
       REALTIME UPDATES
    ===================================================== */

    function setupRealtime() {

        try {

            realtimeChannel =
                supabaseClient
                    .channel(
                        "admin-loan-applications"
                    )
                    .on(
                        "postgres_changes",
                        {
                            event: "INSERT",
                            schema: "public",
                            table: "loan_applications"
                        },
                        payload => {

                            if (
                                applications.some(
                                    item =>
                                        String(item.id) ===
                                        String(payload.new.id)
                                )
                            ) {
                                return;
                            }


                            applications.unshift(
                                payload.new
                            );


                            updateStats(
                                applications
                            );

                            populateRegionFilter();

                            applyFilters();

                            updateNotificationBadge();

                            showToast(
                                "Maombi mapya yamepokelewa."
                            );

                        }
                    )
                    .on(
                        "postgres_changes",
                        {
                            event: "DELETE",
                            schema: "public",
                            table: "loan_applications"
                        },
                        payload => {

                            applications =
                                applications.filter(
                                    item =>
                                        String(item.id) !==
                                        String(payload.old.id)
                                );


                            updateStats(
                                applications
                            );

                            populateRegionFilter();

                            applyFilters();

                        }
                    )
                    .subscribe();

        } catch (error) {

            console.warn(
                "Realtime unavailable:",
                error
            );

        }
    }


    /* =====================================================
       MOBILE SIDEBAR
    ===================================================== */

    mobileMenuButton?.addEventListener(
        "click",
        function () {

            sidebar.classList.toggle(
                "mobile-open"
            );

        }
    );


    /* =====================================================
       LOGOUT
    ===================================================== */

    document
        .getElementById("logoutButton")
        ?.addEventListener(
            "click",
            async function () {

                await supabaseClient.auth.signOut();

                window.location.href =
                    "login.html";

            }
        );


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Escape"
            ) {

                closeActionModalFunction();

                closeDeleteModal();

                notificationPanel.classList.add(
                    "hidden"
                );

            }

        }
    );


    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    await loadApplications();

    setupRealtime();

});