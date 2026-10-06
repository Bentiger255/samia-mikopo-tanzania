/* =========================================================
   SAMIA MIKOPO
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

const loadingElement =
    document.getElementById("analyticsLoading");

const contentElement =
    document.getElementById("analyticsContent");

const errorElement =
    document.getElementById("analyticsError");

const dateFilter =
    document.getElementById("dateFilter");

const regionFilter =
    document.getElementById("regionFilter");

const applyFiltersButton =
    document.getElementById("applyFilters");

const resetFiltersButton =
    document.getElementById("resetFilters");

const refreshButton =
    document.getElementById("refreshAnalytics");

const lastUpdatedElement =
    document.getElementById("lastUpdated");


/* =========================================================
   HELPERS
========================================================= */

function getSupabaseClient() {

    /*
     * IMPORTANT:
     *
     * We do NOT create another Supabase client here.
     *
     * Your existing:
     *
     * ../assets/js/supabase.js
     *
     * should already create the client used by the dashboard.
     *
     * This function supports common names used by existing
     * Supabase configuration files.
     */

    try {

        if (
            typeof supabase !== "undefined" &&
            supabase &&
            typeof supabase.from === "function"
        ) {
            return supabase;
        }

    } catch (error) {
        // Ignore and continue checking other names.
    }


    if (
        window.supabaseClient &&
        typeof window.supabaseClient.from === "function"
    ) {
        return window.supabaseClient;
    }


    if (
        window.sb &&
        typeof window.sb.from === "function"
    ) {
        return window.sb;
    }


    if (
        window.supabase &&
        typeof window.supabase.from === "function"
    ) {
        return window.supabase;
    }


    return null;
}


/* =========================================================
   FORMATTERS
========================================================= */

function formatTZS(value) {

    const amount =
        Number(value) || 0;

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


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   UI
========================================================= */

function showLoading() {

    loadingElement.classList.remove("hidden");

    contentElement.classList.add("hidden");

    errorElement.classList.add("hidden");
}


function hideLoading() {

    loadingElement.classList.add("hidden");

    contentElement.classList.remove("hidden");
}


function showError(message) {

    loadingElement.classList.add("hidden");

    contentElement.classList.add("hidden");

    errorElement.textContent = message;

    errorElement.classList.remove("hidden");
}


function clearError() {

    errorElement.textContent = "";

    errorElement.classList.add("hidden");
}


/* =========================================================
   LOAD DATA
========================================================= */

async function loadAnalyticsData() {

    showLoading();

    clearError();


    const client =
        getSupabaseClient();


    if (!client) {

        showError(
            "Supabase client haikupatikana. Hakikisha ../assets/js/supabase.js ime-load kabla ya analytics.js."
        );

        console.error(
            "SAMIA MIKOPO: Supabase client not found."
        );

        return;
    }


    try {

        /*
         * Only columns that actually exist in:
         *
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


        const {
            data,
            error
        } = await client
            .from("loan_applications")
            .select(columns)
            .order("created_at", {
                ascending: true
            })
            .limit(10000);


        if (error) {

            console.error(
                "Analytics Supabase error:",
                error
            );

            throw error;
        }


        analyticsData =
            Array.isArray(data)
                ? data
                : [];


        populateRegionFilter();


        applyCurrentFilters();


        updateLastUpdated();


    } catch (error) {

        console.error(
            "Analytics loading error:",
            error
        );


        showError(
            "Imeshindikana kupakia data za analytics. Tafadhali jaribu tena."
        );

    }

}


/* =========================================================
   REGION FILTER
========================================================= */

function populateRegionFilter() {

    const regions = [
        ...new Set(
            analyticsData
                .map(item =>
                    String(item.region || "").trim()
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
        regions.includes(currentValue)
    ) {
        regionFilter.value =
            currentValue;
    }
}


/* =========================================================
   DATE FILTER
========================================================= */

function getDateRange(filter) {

    const now =
        new Date();


    const start =
        new Date(now);


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

    const dateType =
        currentFilters.date;

    const selectedRegion =
        currentFilters.region;


    const dateRange =
        getDateRange(dateType);


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
   APPLY FILTER BUTTON
========================================================= */

function applyFilters() {

    currentFilters = {

        date:
            dateFilter.value,

        region:
            regionFilter.value

    };


    applyCurrentFilters();

}


/* =========================================================
   RESET FILTERS
========================================================= */

function resetFilters() {

    dateFilter.value =
        "all";

    regionFilter.value =
        "";


    currentFilters = {

        date: "all",

        region: ""

    };


    applyCurrentFilters();

}


/* =========================================================
   RENDER ANALYTICS
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

}


/* =========================================================
   KPI
========================================================= */

function updateKPIs() {

    const amounts =
        filteredData
            .map(item =>
                Number(item.loan_amount) || 0
            )
            .filter(amount =>
                amount > 0
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

    const regionCounts =
        {};


    filteredData.forEach(item => {

        const region =
            String(
                item.region || "Haijulikani"
            ).trim() ||
            "Haijulikani";


        regionCounts[region] =
            (regionCounts[region] || 0) + 1;

    });


    const topRegion =
        Object.entries(regionCounts)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )[0];


    if (topRegion) {

        setText(
            "topRegion",
            topRegion[0]
        );


        setText(
            "topRegionCount",
            `${formatNumber(topRegion[1])} maombi`
        );

    } else {

        setText(
            "topRegion",
            "—"
        );

        setText(
            "topRegionCount",
            "Hakuna data"
        );

    }


    /* =====================================================
       BUSIEST DAY
    ====================================================== */

    const dayCounts =
        {};


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


        const day =
            date.toLocaleDateString(
                "sw-TZ",
                {
                    weekday: "long"
                }
            );


        dayCounts[day] =
            (dayCounts[day] || 0) + 1;

    });


    const busiestDay =
        Object.entries(dayCounts)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )[0];


    setText(
        "busiestDay",
        busiestDay
            ? capitalize(
                busiestDay[0]
            )
            : "—"
    );


    /* =====================================================
       BUSIEST HOUR
    ====================================================== */

    const hourCounts =
        {};


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


        const hour =
            date.getHours();


        hourCounts[hour] =
            (hourCounts[hour] || 0) + 1;

    });


    const busiestHour =
        Object.entries(hourCounts)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )[0];


    if (busiestHour) {

        const hour =
            Number(
                busiestHour[0]
            );


        const nextHour =
            (hour + 1) % 24;


        setText(
            "busiestHour",
            `${String(hour).padStart(2, "0")}:00 - ${String(nextHour).padStart(2, "0")}:00`
        );

    } else {

        setText(
            "busiestHour",
            "—"
        );

    }


    /* =====================================================
       HIGHEST AMOUNT APPLICANT
    ====================================================== */

    const highestApplicant =
        filteredData
            .slice()
            .sort(
                (a, b) =>
                    (Number(b.loan_amount) || 0) -
                    (Number(a.loan_amount) || 0)
            )[0];


    if (highestApplicant) {

        const name =
            String(
                highestApplicant.full_name ||
                "Haijulikani"
            );


        const amount =
            Number(
                highestApplicant.loan_amount
            ) || 0;


        setText(
            "highestAmountApplicant",
            name
        );


        const applicantElement =
            document.getElementById(
                "highestAmountApplicant"
            );


        applicantElement.title =
            `${name} — ${formatTZS(amount)}`;

    } else {

        setText(
            "highestAmountApplicant",
            "—"
        );

    }


    /* =====================================================
       HIGH VALUE APPLICATIONS
    ====================================================== */

    const highValue =
        filteredData.filter(item =>
            Number(item.loan_amount) >= 5000000
        ).length;


    setText(
        "highValueApplications",
        formatNumber(highValue)
    );

}


/* =========================================================
   SUMMARY
========================================================= */

function updateSummary() {

    const amounts =
        filteredData.map(item =>
            Number(item.loan_amount) || 0
        );


    const total =
        amounts.reduce(
            (sum, amount) =>
                sum + amount,
            0
        );


    const highValue =
        amounts.filter(
            amount =>
                amount >= 5000000
        ).length;


    const regionCounts =
        {};


    filteredData.forEach(item => {

        const region =
            String(
                item.region ||
                "Haijulikani"
            ).trim();


        regionCounts[region] =
            (regionCounts[region] || 0) + 1;

    });


    const topRegion =
        Object.entries(regionCounts)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )[0];


    setText(
        "summaryApplications",
        formatNumber(
            filteredData.length
        )
    );


    setText(
        "summaryAmount",
        formatTZS(total)
    );


    setText(
        "summaryRegion",
        topRegion
            ? topRegion[0]
            : "—"
    );


    setText(
        "summaryHighValue",
        formatNumber(
            highValue
        )
    );

}


/* =========================================================
   APPLICATION TREND
========================================================= */

function renderApplicationsTrend() {

    const grouped =
        {};


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
                        "rgba(146,227,169,0.10)",

                    borderWidth: 2,

                    fill: true,

                    tension: 0.35,

                    pointRadius: 2,

                    pointHoverRadius: 5
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

    const grouped =
        {};


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
            (Number(item.loan_amount) || 0);

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
                        "#7dd3fc",

                    backgroundColor:
                        "rgba(125,211,252,0.08)",

                    borderWidth: 2,

                    fill: true,

                    tension: 0.35,

                    pointRadius: 2
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
   REGION APPLICATIONS
========================================================= */

function renderApplicationsByRegion() {

    const grouped =
        {};


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
        Object.entries(grouped)
            .sort(
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

    const grouped =
        {};


    filteredData.forEach(item => {

        const region =
            String(
                item.region ||
                "Haijulikani"
            ).trim();


        grouped[region] =
            (grouped[region] || 0) +
            (Number(item.loan_amount) || 0);

    });


    const entries =
        Object.entries(grouped)
            .sort(
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
                    Object.keys(ranges),

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

    const grouped =
        {};


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

    const grouped =
        {};


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
            (Number(item.loan_amount) || 0);

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
        charts[canvasId]
    ) {

        charts[canvasId].destroy();

    }


    charts[canvasId] =
        new Chart(
            canvas,
            config
        );

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

                    label: function(context) {

                        const value =
                            Number(
                                context.raw
                            ) || 0;


                        if (
                            type === "currency"
                        ) {

                            return (
                                " " +
                                formatTZS(value)
                            );

                        }


                        return (
                            " " +
                            formatNumber(value) +
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

                    callback: function(value) {

                        if (
                            type === "currency"
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


    return `${year}-${month}-${day}`;
}


function getMonthKey(date) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    return `${year}-${month}`;
}


/* =========================================================
   COMPACT CURRENCY
========================================================= */

function formatCompactTZS(value) {

    const number =
        Number(value) || 0;


    if (
        number >= 1000000000
    ) {

        return (
            "TZS " +
            (number / 1000000000)
                .toFixed(1) +
            "B"
        );

    }


    if (
        number >= 1000000
    ) {

        return (
            "TZS " +
            (number / 1000000)
                .toFixed(1) +
            "M"
        );

    }


    if (
        number >= 1000
    ) {

        return (
            "TZS " +
            (number / 1000)
                .toFixed(0) +
            "K"
        );

    }


    return (
        "TZS " +
        number.toLocaleString(
            "en-TZ"
        )
    );

}


/* =========================================================
   GENERAL DOM HELPERS
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


    if (lastUpdatedElement) {

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

        await client.auth.signOut();

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

    }


    window.location.href =
        "login.html";

}


/* =========================================================
   AUTH / ADMIN EMAIL
========================================================= */

async function loadAdminEmail() {

    const client =
        getSupabaseClient();


    if (!client) {
        return;
    }


    try {

        const {
            data
        } =
            await client.auth.getUser();


        const user =
            data?.user;


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

        console.warn(
            "Could not load admin email:",
            error
        );

    }

}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    if (applyFiltersButton) {

        applyFiltersButton.addEventListener(
            "click",
            applyFilters
        );

    }


    if (resetFiltersButton) {

        resetFiltersButton.addEventListener(
            "click",
            resetFilters
        );

    }


    if (refreshButton) {

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


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );

    }


    /*
     * Allow Enter/change for quick filtering.
     */

    dateFilter.addEventListener(
        "change",
        applyFilters
    );


    regionFilter.addEventListener(
        "change",
        applyFilters
    );

}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        setupMobileSidebar();

        setupEvents();

        await loadAdminEmail();

        await loadAnalyticsData();

    }
);