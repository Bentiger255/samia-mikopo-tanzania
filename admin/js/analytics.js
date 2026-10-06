/* =========================================================
   SAMIA MIKOPO TANZANIA
   ANALYTICS JAVASCRIPT
========================================================= */

"use strict";

/* =========================================================
   GLOBAL STATE
========================================================= */

let analyticsData = [];
let filteredData = [];
let charts = {};

let currentFilters = {
    date: "all",
    region: ""
};

/* =========================================================
   DOM
========================================================= */

const loadingElement = document.getElementById("analyticsLoading");
const contentElement = document.getElementById("analyticsContent");
const errorElement = document.getElementById("analyticsError");

const dateFilter = document.getElementById("dateFilter");
const regionFilter = document.getElementById("regionFilter");

const applyFiltersButton = document.getElementById("applyFilters");
const resetFiltersButton = document.getElementById("resetFilters");
const refreshButton = document.getElementById("refreshAnalytics");

const lastUpdatedElement = document.getElementById("lastUpdated");

/* =========================================================
   SUPABASE CLIENT
========================================================= */

function getSupabaseClient() {

    /*
     * The existing ../assets/js/supabase.js creates:
     *
     * window.supabaseClient
     *
     * We intentionally prefer that client.
     */

    if (
        window.supabaseClient &&
        typeof window.supabaseClient.from === "function"
    ) {
        return window.supabaseClient;
    }

    /*
     * Fallbacks for compatibility.
     */

    try {

        if (
            typeof supabase !== "undefined" &&
            supabase &&
            typeof supabase.from === "function" &&
            typeof supabase.auth === "object"
        ) {
            return supabase;
        }

    } catch (error) {
        // Ignore.
    }

    if (
        window.sb &&
        typeof window.sb.from === "function"
    ) {
        return window.sb;
    }

    return null;
}

/* =========================================================
   TIMEOUT HELPER
========================================================= */

function withTimeout(promise, milliseconds = 15000) {

    return Promise.race([

        promise,

        new Promise((_, reject) => {

            setTimeout(() => {

                reject(
                    new Error(
                        "Request timed out."
                    )
                );

            }, milliseconds);

        })

    ]);

}

/* =========================================================
   FORMATTERS
========================================================= */

function formatTZS(value) {

    const amount = Number(value) || 0;

    return (
        "TZS " +
        amount.toLocaleString("en-TZ")
    );

}

function formatNumber(value) {

    return (
        Number(value || 0)
            .toLocaleString("en-TZ")
    );

}

function formatCompactTZS(value) {

    const number = Number(value) || 0;

    if (number >= 1000000000) {

        return (
            "TZS " +
            (number / 1000000000).toFixed(1) +
            "B"
        );

    }

    if (number >= 1000000) {

        return (
            "TZS " +
            (number / 1000000).toFixed(1) +
            "M"
        );

    }

    if (number >= 1000) {

        return (
            "TZS " +
            (number / 1000).toFixed(0) +
            "K"
        );

    }

    return formatTZS(number);

}

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

/* =========================================================
   UI STATES
========================================================= */

function showLoading() {

    if (loadingElement) {
        loadingElement.classList.remove("hidden");
    }

    if (contentElement) {
        contentElement.classList.add("hidden");
    }

    clearError();

}

function hideLoading() {

    if (loadingElement) {
        loadingElement.classList.add("hidden");
    }

    if (contentElement) {
        contentElement.classList.remove("hidden");
    }

}

function showError(message) {

    if (loadingElement) {
        loadingElement.classList.add("hidden");
    }

    if (contentElement) {
        contentElement.classList.add("hidden");
    }

    if (errorElement) {

        errorElement.textContent = message;

        errorElement.classList.remove("hidden");

    }

}

function clearError() {

    if (!errorElement) {
        return;
    }

    errorElement.textContent = "";

    errorElement.classList.add("hidden");

}

/* =========================================================
   LOAD ANALYTICS DATA
========================================================= */

async function loadAnalyticsData() {

    showLoading();

    const client = getSupabaseClient();

    if (!client) {

        console.error(
            "SAMIA MIKOPO: Supabase client not found."
        );

        showError(
            "Supabase haijaunganishwa. Hakikisha supabase.js ime-load vizuri."
        );

        return;

    }

    try {

        /*
         * Only real columns from:
         * public.loan_applications
         */

        const columns = [
            "id",
            "created_at",
            "full_name",
            "phone",
            "region",
            "district",
            "ward",
            "loan_amount",
            "repayment_period",
            "gender",
            "age",
            "income_source"
        ].join(",");

        console.log(
            "SAMIA MIKOPO: Loading analytics data..."
        );

        const request = client
            .from("loan_applications")
            .select(columns)
            .order("created_at", {
                ascending: true
            })
            .limit(10000);

        const result =
            await withTimeout(
                request,
                15000
            );

        const data = result?.data;
        const error = result?.error;

        if (error) {

            console.error(
                "Supabase analytics error:",
                error
            );

            throw error;

        }

        analyticsData =
            Array.isArray(data)
                ? data
                : [];

        console.log(
            "SAMIA MIKOPO: Applications loaded:",
            analyticsData.length
        );

        populateRegionFilter();

        applyCurrentFilters();

        updateLastUpdated();

        hideLoading();

    } catch (error) {

        console.error(
            "Analytics loading error:",
            error
        );

        let message =
            "Imeshindikana kupakia data za analytics.";

        if (
            error &&
            error.message
        ) {

            if (
                error.message
                    .toLowerCase()
                    .includes("timed out")
            ) {

                message =
                    "Supabase haijajibu kwa wakati. Angalia connection ya Supabase kisha jaribu tena.";

            } else {

                message =
                    "Imeshindikana kupakia data: " +
                    error.message;

            }

        }

        showError(message);

    }

}

/* =========================================================
   REGION FILTER
========================================================= */

function populateRegionFilter() {

    if (!regionFilter) {
        return;
    }

    const regions = [
        ...new Set(

            analyticsData
                .map(item =>
                    String(
                        item.region || ""
                    ).trim()
                )
                .filter(Boolean)

        )
    ];

    regions.sort(
        (a, b) =>
            a.localeCompare(
                b,
                "sw"
            )
    );

    const currentValue =
        regionFilter.value;

    regionFilter.innerHTML =
        `<option value="">Mikoa yote</option>`;

    regions.forEach(region => {

        const option =
            document.createElement("option");

        option.value = region;

        option.textContent = region;

        regionFilter.appendChild(option);

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

/* =========================================================
   DATE RANGE
========================================================= */

function getDateRange(filter) {

    const now = new Date();

    const start = new Date(now);

    start.setHours(
        0,
        0,
        0,
        0
    );

    if (filter === "today") {

        return {
            start,
            end: now
        };

    }

    if (filter === "7days") {

        start.setDate(
            start.getDate() - 6
        );

        return {
            start,
            end: now
        };

    }

    if (filter === "30days") {

        start.setDate(
            start.getDate() - 29
        );

        return {
            start,
            end: now
        };

    }

    if (filter === "month") {

        start.setDate(1);

        return {
            start,
            end: now
        };

    }

    return null;

}

/* =========================================================
   FILTER DATA
========================================================= */

function applyCurrentFilters() {

    const dateRange =
        getDateRange(
            currentFilters.date
        );

    const selectedRegion =
        currentFilters.region;

    filteredData =
        analyticsData.filter(item => {

            const region =
                String(
                    item.region || ""
                ).trim();

            if (
                selectedRegion &&
                region !== selectedRegion
            ) {
                return false;
            }

            if (dateRange) {

                const created =
                    new Date(
                        item.created_at
                    );

                if (
                    Number.isNaN(
                        created.getTime()
                    )
                ) {
                    return false;
                }

                if (
                    created < dateRange.start ||
                    created > dateRange.end
                ) {
                    return false;
                }

            }

            return true;

        });

    renderAnalytics();

}

/* =========================================================
   APPLY FILTERS
========================================================= */

function applyFilters() {

    currentFilters = {

        date:
            dateFilter
                ? dateFilter.value
                : "all",

        region:
            regionFilter
                ? regionFilter.value
                : ""

    };

    applyCurrentFilters();

}

/* =========================================================
   RESET FILTERS
========================================================= */

function resetFilters() {

    if (dateFilter) {
        dateFilter.value = "all";
    }

    if (regionFilter) {
        regionFilter.value = "";
    }

    currentFilters = {

        date: "all",
        region: ""

    };

    applyCurrentFilters();

}

/* =========================================================
   RENDER ALL ANALYTICS
========================================================= */

function renderAnalytics() {

    updateKPIs();

    updateInsights();

    updateSummary();

    renderApplicationsTrend();

    renderLoanAmountTrend();

    renderApplicationsByRegion();

    renderAmountByRegion();

    renderLoanDistribution();

    renderDayOfWeek();

    renderHourChart();

    renderMonthlyApplications();

    renderMonthlyAmount();

    hideLoading();

}

/* =========================================================
   KPI
========================================================= */

function updateKPIs() {

    const amounts =
        filteredData
            .map(item =>
                Number(
                    item.loan_amount
                ) || 0
            )
            .filter(
                amount => amount > 0
            );

    const totalApplications =
        filteredData.length;

    const totalAmount =
        amounts.reduce(
            (sum, amount) =>
                sum + amount,
            0
        );

    const averageAmount =
        amounts.length
            ? totalAmount / amounts.length
            : 0;

    const highestAmount =
        amounts.length
            ? Math.max(...amounts)
            : 0;

    const lowestAmount =
        amounts.length
            ? Math.min(...amounts)
            : 0;

    setText(
        "totalApplications",
        formatNumber(
            totalApplications
        )
    );

    setText(
        "totalAmount",
        formatTZS(
            totalAmount
        )
    );

    setText(
        "averageAmount",
        formatTZS(
            averageAmount
        )
    );

    setText(
        "highestAmount",
        formatTZS(
            highestAmount
        )
    );

    setText(
        "lowestAmount",
        formatTZS(
            lowestAmount
        )
    );

}

/* =========================================================
   INSIGHTS
========================================================= */

function updateInsights() {

    if (!filteredData.length) {

        setText(
            "topRegion",
            "Hakuna data"
        );

        setText(
            "topRegionCount",
            "Hakuna maombi"
        );

        setText(
            "busiestDay",
            "Hakuna data"
        );

        setText(
            "busiestHour",
            "Hakuna data"
        );

        setText(
            "highestAmountApplicant",
            "Hakuna data"
        );

        setText(
            "highValueApplications",
            "0"
        );

        return;

    }

    /* ---------- TOP REGION ---------- */

    const regionCounts = {};

    filteredData.forEach(item => {

        const region =
            String(
                item.region ||
                "Haijulikani"
            ).trim();

        regionCounts[region] =
            (regionCounts[region] || 0) + 1;

    });

    const topRegionEntry =
        Object.entries(
            regionCounts
        ).sort(
            (a, b) =>
                b[1] - a[1]
        )[0];

    if (topRegionEntry) {

        setText(
            "topRegion",
            topRegionEntry[0]
        );

        setText(
            "topRegionCount",
            formatNumber(
                topRegionEntry[1]
            ) +
            " maombi"
        );

    }

    /* ---------- BUSIEST DAY ---------- */

    const dayNames = [
        "Jumapili",
        "Jumatatu",
        "Jumanne",
        "Jumatano",
        "Alhamisi",
        "Ijumaa",
        "Jumamosi"
    ];

    const dayCounts =
        Array(7).fill(0);

    filteredData.forEach(item => {

        const date =
            new Date(
                item.created_at
            );

        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {

            dayCounts[
                date.getDay()
            ]++;

        }

    });

    const busiestDayIndex =
        dayCounts.indexOf(
            Math.max(...dayCounts)
        );

    setText(
        "busiestDay",
        dayNames[
            busiestDayIndex
        ]
    );

    /* ---------- BUSIEST HOUR ---------- */

    const hourCounts =
        Array(24).fill(0);

    filteredData.forEach(item => {

        const date =
            new Date(
                item.created_at
            );

        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {

            hourCounts[
                date.getHours()
            ]++;

        }

    });

    const busiestHourIndex =
        hourCounts.indexOf(
            Math.max(...hourCounts)
        );

    setText(
        "busiestHour",
        String(
            busiestHourIndex
        ).padStart(2, "0") +
        ":00"
    );

    /* ---------- HIGHEST APPLICANT ---------- */

    const highestApplication =
        filteredData.reduce(
            (highest, item) => {

                const amount =
                    Number(
                        item.loan_amount
                    ) || 0;

                if (
                    !highest ||
                    amount >
                    (
                        Number(
                            highest.loan_amount
                        ) || 0
                    )
                ) {

                    return item;

                }

                return highest;

            },
            null
        );

    if (
        highestApplication
    ) {

        const name =
            String(
                highestApplication.full_name ||
                "Haijulikani"
            );

        const amount =
            Number(
                highestApplication.loan_amount
            ) || 0;

        setText(
            "highestAmountApplicant",
            name
        );

        const applicantElement =
            document.getElementById(
                "highestAmountApplicant"
            );

        if (applicantElement) {

            applicantElement.title =
                formatTZS(amount);

        }

    }

    /* ---------- HIGH VALUE ---------- */

    const highValue =
        filteredData.filter(
            item =>
                (
                    Number(
                        item.loan_amount
                    ) || 0
                ) >= 5000000
        ).length;

    setText(
        "highValueApplications",
        formatNumber(
            highValue
        )
    );

}

/* =========================================================
   SUMMARY
========================================================= */

function updateSummary() {

    const today =
        new Date();

    const weekStart =
        new Date(today);

    weekStart.setDate(
        weekStart.getDate() - 6
    );

    weekStart.setHours(
        0,
        0,
        0,
        0
    );

    const monthStart =
        new Date(today);

    monthStart.setDate(1);

    monthStart.setHours(
        0,
        0,
        0,
        0
    );

    const weekApplications =
        analyticsData.filter(item => {

            const date =
                new Date(
                    item.created_at
                );

            return (
                !Number.isNaN(
                    date.getTime()
                ) &&
                date >= weekStart &&
                date <= today
            );

        }).length;

    const monthApplications =
        analyticsData.filter(item => {

            const date =
                new Date(
                    item.created_at
                );

            return (
                !Number.isNaN(
                    date.getTime()
                ) &&
                date >= monthStart &&
                date <= today
            );

        }).length;

    setText(
        "applicationsThisWeek",
        formatNumber(
            weekApplications
        )
    );

    setText(
        "applicationsThisMonth",
        formatNumber(
            monthApplications
        )
    );

}

/* =========================================================
   APPLICATION TREND
========================================================= */

function renderApplicationsTrend() {

    const grouped = {};

    filteredData.forEach(item => {

        const date =
            new Date(
                item.created_at
            );

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return;
        }

        const key =
            getDateKey(date);

        grouped[key] =
            (grouped[key] || 0) + 1;

    });

    const labels =
        Object.keys(grouped)
            .sort();

    const values =
        labels.map(
            label =>
                grouped[label]
        );

    createChart(
        "applicationsTrendChart",
        {
            type: "line",

            data: {

                labels,

                datasets: [{

                    label: "Maombi",

                    data: values,

                    borderColor:
                        "#92e3a9",

                    backgroundColor:
                        "rgba(146,227,169,0.08)",

                    borderWidth: 2,

                    fill: true,

                    tension: 0.35,

                    pointRadius: 3

                }]

            },

            options:
                chartOptions(
                    "count"
                )

        }
    );

}

/* =========================================================
   LOAN AMOUNT TREND
========================================================= */

function renderLoanAmountTrend() {

    const grouped = {};

    filteredData.forEach(item => {

        const date =
            new Date(
                item.created_at
            );

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return;
        }

        const key =
            getDateKey(date);

        grouped[key] =
            (grouped[key] || 0) +
            (
                Number(
                    item.loan_amount
                ) || 0
            );

    });

    const labels =
        Object.keys(grouped)
            .sort();

    const values =
        labels.map(
            label =>
                grouped[label]
        );

    createChart(
        "loanAmountTrendChart",
        {
            type: "line",

            data: {

                labels,

                datasets: [{

                    label: "Kiasi",

                    data: values,

                    borderColor:
                        "#a78bfa",

                    backgroundColor:
                        "rgba(167,139,250,0.08)",

                    borderWidth: 2,

                    fill: true,

                    tension: 0.35,

                    pointRadius: 3

                }]

            },

            options:
                chartOptions(
                    "currency"
                )

        }
    );

}

/* =========================================================
   APPLICATIONS BY REGION
========================================================= */

function renderApplicationsByRegion() {

    const grouped = {};

    filteredData.forEach(item => {

        const region =
            String(
                item.region ||
                "Haijulikani"
            ).trim();

        grouped[region] =
            (grouped[region] || 0) + 1;

    });

    const entries =
        Object.entries(
            grouped
        ).sort(
            (a, b) =>
                b[1] - a[1]
        );

    const labels =
        entries.map(
            item =>
                item[0]
        );

    const values =
        entries.map(
            item =>
                item[1]
        );

    createChart(
        "applicationsRegionChart",
        {
            type: "bar",

            data: {

                labels,

                datasets: [{

                    label: "Maombi",

                    data: values,

                    backgroundColor:
                        "#92e3a9",

                    borderRadius: 5

                }]

            },

            options:
                chartOptions(
                    "count",
                    true
                )

        }
    );

}

/* =========================================================
   AMOUNT BY REGION
========================================================= */

function renderAmountByRegion() {

    const grouped = {};

    filteredData.forEach(item => {

        const region =
            String(
                item.region ||
                "Haijulikani"
            ).trim();

        grouped[region] =
            (grouped[region] || 0) +
            (
                Number(
                    item.loan_amount
                ) || 0
            );

    });

    const entries =
        Object.entries(
            grouped
        ).sort(
            (a, b) =>
                b[1] - a[1]
        );

    const labels =
        entries.map(
            item =>
                item[0]
        );

    const values =
        entries.map(
            item =>
                item[1]
        );

    createChart(
        "amountRegionChart",
        {
            type: "bar",

            data: {

                labels,

                datasets: [{

                    label: "Kiasi",

                    data: values,

                    backgroundColor:
                        "#7dd3fc",

                    borderRadius: 5

                }]

            },

            options:
                chartOptions(
                    "currency",
                    true
                )

        }
    );

}

/* =========================================================
   LOAN DISTRIBUTION
========================================================= */

function renderLoanDistribution() {

    const ranges = {

        "Chini ya 500K": 0,

        "500K - 1M": 0,

        "1M - 5M": 0,

        "Zaidi ya 5M": 0

    };

    filteredData.forEach(item => {

        const amount =
            Number(
                item.loan_amount
            ) || 0;

        if (
            amount < 500000
        ) {

            ranges[
                "Chini ya 500K"
            ]++;

        } else if (
            amount < 1000000
        ) {

            ranges[
                "500K - 1M"
            ]++;

        } else if (
            amount < 5000000
        ) {

            ranges[
                "1M - 5M"
            ]++;

        } else {

            ranges[
                "Zaidi ya 5M"
            ]++;

        }

    });

    createChart(
        "loanDistributionChart",
        {
            type: "bar",

            data: {

                labels:
                    Object.keys(
                        ranges
                    ),

                datasets: [{

                    label: "Maombi",

                    data:
                        Object.values(
                            ranges
                        ),

                    backgroundColor:
                        "#92e3a9",

                    borderRadius: 5

                }]

            },

            options:
                chartOptions(
                    "count"
                )

        }
    );

}

/* =========================================================
   DAY OF WEEK
========================================================= */

function renderDayOfWeek() {

    const days = [

        "Jumapili",
        "Jumatatu",
        "Jumanne",
        "Jumatano",
        "Alhamisi",
        "Ijumaa",
        "Jumamosi"

    ];

    const counts =
        Array(7).fill(0);

    filteredData.forEach(item => {

        const date =
            new Date(
                item.created_at
            );

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return;
        }

        counts[
            date.getDay()
        ]++;

    });

    createChart(
        "dayOfWeekChart",
        {
            type: "bar",

            data: {

                labels: days,

                datasets: [{

                    label: "Maombi",

                    data: counts,

                    backgroundColor:
                        "#c4b5fd",

                    borderRadius: 5

                }]

            },

            options:
                chartOptions(
                    "count"
                )

        }
    );

}

/* =========================================================
   HOUR CHART
========================================================= */

function renderHourChart() {

    const counts =
        Array(24).fill(0);

    filteredData.forEach(item => {

        const date =
            new Date(
                item.created_at
            );

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return;
        }

        counts[
            date.getHours()
        ]++;

    });

    const labels =
        counts.map(
            (_, hour) =>
                `${String(hour).padStart(2, "0")}:00`
        );

    createChart(
        "hourChart",
        {
            type: "line",

            data: {

                labels,

                datasets: [{

                    label: "Maombi",

                    data: counts,

                    borderColor:
                        "#fbbf24",

                    backgroundColor:
                        "rgba(251,191,36,0.08)",

                    borderWidth: 2,

                    fill: true,

                    tension: 0.35,

                    pointRadius: 2

                }]

            },

            options:
                chartOptions(
                    "count"
                )

        }
    );

}

/* =========================================================
   MONTHLY APPLICATIONS
========================================================= */

function renderMonthlyApplications() {

    const grouped = {};

    filteredData.forEach(item => {

        const date =
            new Date(
                item.created_at
            );

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return;
        }

        const key =
            getMonthKey(date);

        grouped[key] =
            (grouped[key] || 0) + 1;

    });

    const labels =
        Object.keys(grouped)
            .sort();

    const values =
        labels.map(
            label =>
                grouped[label]
        );

    createChart(
        "monthlyApplicationsChart",
        {
            type: "bar",

            data: {

                labels,

                datasets: [{

                    label: "Maombi",

                    data: values,

                    backgroundColor:
                        "#92e3a9",

                    borderRadius: 5

                }]

            },

            options:
                chartOptions(
                    "count"
                )

        }
    );

}

/* =========================================================
   MONTHLY AMOUNT
========================================================= */

function renderMonthlyAmount() {

    const grouped = {};

    filteredData.forEach(item => {

        const date =
            new Date(
                item.created_at
            );

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return;
        }

        const key =
            getMonthKey(date);

        grouped[key] =
            (grouped[key] || 0) +
            (
                Number(
                    item.loan_amount
                ) || 0
            );

    });

    const labels =
        Object.keys(grouped)
            .sort();

    const values =
        labels.map(
            label =>
                grouped[label]
        );

    createChart(
        "monthlyAmountChart",
        {
            type: "line",

            data: {

                labels,

                datasets: [{

                    label: "Kiasi",

                    data: values,

                    borderColor:
                        "#a78bfa",

                    backgroundColor:
                        "rgba(167,139,250,0.08)",

                    borderWidth: 2,

                    fill: true,

                    tension: 0.35,

                    pointRadius: 3

                }]

            },

            options:
                chartOptions(
                    "currency"
                )

        }
    );

}

/* =========================================================
   CHART CREATION
========================================================= */

function createChart(
    canvasId,
    config
) {

    const canvas =
        document.getElementById(
            canvasId
        );

    if (!canvas) {
        return;
    }

    if (
        typeof Chart === "undefined"
    ) {

        console.error(
            "Chart.js is not loaded."
        );

        return;

    }

    if (
        charts[canvasId]
    ) {

        try {

            charts[
                canvasId
            ].destroy();

        } catch (error) {

            console.warn(
                "Could not destroy old chart:",
                error
            );

        }

    }

    try {

        charts[canvasId] =
            new Chart(
                canvas,
                config
            );

    } catch (error) {

        console.error(
            "Chart creation error:",
            canvasId,
            error
        );

    }

}

/* =========================================================
   CHART OPTIONS
========================================================= */

function chartOptions(
    type = "count",
    horizontal = false
) {

    return {

        responsive: true,

        maintainAspectRatio: false,

        indexAxis:
            horizontal
                ? "y"
                : "x",

        interaction: {

            intersect: false,

            mode: "index"

        },

        plugins: {

            legend: {

                display: false

            },

            tooltip: {

                callbacks: {

                    label:
                        function(context) {

                            const value =
                                Number(
                                    context.raw
                                ) || 0;

                            if (
                                type ===
                                "currency"
                            ) {

                                return (
                                    " " +
                                    formatTZS(
                                        value
                                    )
                                );

                            }

                            return (
                                " " +
                                formatNumber(
                                    value
                                ) +
                                " maombi"
                            );

                        }

                }

            }

        },

        scales: {

            x: {

                ticks: {

                    color:
                        "#64748b",

                    font: {

                        size: 10

                    }

                },

                grid: {

                    color:
                        "rgba(255,255,255,0.05)"

                }

            },

            y: {

                beginAtZero: true,

                ticks: {

                    color:
                        "#64748b",

                    font: {

                        size: 10

                    },

                    callback:
                        function(value) {

                            if (
                                type ===
                                "currency"
                            ) {

                                return formatCompactTZS(
                                    value
                                );

                            }

                            return value;

                        }

                },

                grid: {

                    color:
                        "rgba(255,255,255,0.05)"

                }

            }

        }

    };

}

/* =========================================================
   DATE HELPERS
========================================================= */

function getDateKey(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return (
        `${year}-${month}-${day}`
    );

}

function getMonthKey(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    return (
        `${year}-${month}`
    );

}

/* =========================================================
   DOM HELPERS
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;

    }

}

function capitalize(value) {

    if (!value) {
        return "";
    }

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}

function updateLastUpdated() {

    const now =
        new Date();

    if (
        lastUpdatedElement
    ) {

        lastUpdatedElement.textContent =
            "Updated " +
            now.toLocaleTimeString(
                "sw-TZ",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

    }

}

/* =========================================================
   ADMIN EMAIL
   IMPORTANT:
   This does NOT block analytics.
========================================================= */

async function loadAdminEmail() {

    const client =
        getSupabaseClient();

    if (!client) {
        return;
    }

    try {

        /*
         * Short timeout so this can never block
         * the analytics page.
         */

        const result =
            await withTimeout(
                client.auth.getUser(),
                5000
            );

        const user =
            result?.data?.user;

        if (
            user &&
            user.email
        ) {

            setText(
                "adminEmail",
                user.email
            );

        }

    } catch (error) {

        /*
         * Authentication information is optional
         * for displaying the analytics data.
         */

        console.warn(
            "Admin email could not be loaded:",
            error
        );

    }

}

/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function setupMobileSidebar() {

    const menuButton =
        document.getElementById(
            "mobileMenuButton"
        );

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );

    if (
        !menuButton ||
        !sidebar ||
        !overlay
    ) {
        return;
    }

    function closeSidebar() {

        sidebar.classList.remove(
            "open"
        );

        overlay.classList.remove(
            "active"
        );

    }

    menuButton.addEventListener(
        "click",
        function() {

            sidebar.classList.toggle(
                "open"
            );

            overlay.classList.toggle(
                "active"
            );

        }
    );

    overlay.addEventListener(
        "click",
        closeSidebar
    );

    sidebar
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(link => {

            link.addEventListener(
                "click",
                closeSidebar
            );

        });

}

/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    const client =
        getSupabaseClient();

    if (!client) {

        window.location.href =
            "login.html";

        return;

    }

    try {

        await withTimeout(
            client.auth.signOut(),
            5000
        );

    } catch (error) {

        console.warn(
            "Logout error:",
            error
        );

    }

    window.location.href =
        "login.html";

}

/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    if (
        applyFiltersButton
    ) {

        applyFiltersButton.addEventListener(
            "click",
            applyFilters
        );

    }

    if (
        resetFiltersButton
    ) {

        resetFiltersButton.addEventListener(
            "click",
            resetFilters
        );

    }

    if (
        refreshButton
    ) {

        refreshButton.addEventListener(
            "click",
            async function() {

                refreshButton.disabled =
                    true;

                try {

                    await loadAnalyticsData();

                } finally {

                    refreshButton.disabled =
                        false;

                }

            }
        );

    }

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    if (
        logoutButton
    ) {

        logoutButton.addEventListener(
            "click",
            logout
        );

    }

    if (
        dateFilter
    ) {

        dateFilter.addEventListener(
            "change",
            applyFilters
        );

    }

    if (
        regionFilter
    ) {

        regionFilter.addEventListener(
            "change",
            applyFilters
        );

    }

}

/* =========================================================
   START APPLICATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        setupMobileSidebar();

        setupEvents();

        /*
         * IMPORTANT:
         *
         * Analytics data loads independently.
         * Admin email cannot block it.
         */

        loadAnalyticsData();

        /*
         * Optional authentication information.
         * Runs separately.
         */

        loadAdminEmail();

    }
);