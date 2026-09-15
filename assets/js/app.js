"use strict";

/* =========================================================
   SUPABASE CHECK
========================================================= */

if (!window.supabaseClient) {
    console.error(
        "Supabase client is not available. Check assets/js/supabase.js and script order."
    );
}


/* =========================================================
   CONFIGURATION
========================================================= */

const CONFIG = {
    paymentNumber: "23505159",
    paymentName: "SAMIA MIKOPO TANZANIA",
    whatsappNumber: "255752009812",

    storageBucket: "loan-documents",
    maxFileSize: 5 * 1024 * 1024,

    tableName: "loan_applications"
};


/* =========================================================
   LOAN DATA
   AKIBA IS CONTROLLED ONLY BY THIS OBJECT
========================================================= */

const loanData = {

    300000:  { akiba: "35,000",  mkopo: "300,000" },
    400000:  { akiba: "45,000",  mkopo: "400,000" },
    500000:  { akiba: "55,000",  mkopo: "500,000" },
    600000:  { akiba: "65,000",  mkopo: "600,000" },
    700000:  { akiba: "75,000", mkopo: "700,000" },
    800000:  { akiba: "85,000", mkopo: "800,000" },
    900000:  { akiba: "95,000", mkopo: "900,000" },
    1000000: { akiba: "100,000", mkopo: "1,000,000" },

    2000000: { akiba: "200,000", mkopo: "2,000,000" },
    3000000: { akiba: "300,000", mkopo: "3,000,000" },
    4000000: { akiba: "400,000", mkopo: "4,000,000" },
    5000000: { akiba: "500,000", mkopo: "5,000,000" },
    6000000: { akiba: "600,000", mkopo: "6,000,000" },
    7000000: { akiba: "700,000", mkopo: "7,000,000" },
    8000000: { akiba: "800,000", mkopo: "8,000,000" },
    9000000: { akiba: "900,000", mkopo: "9,000,000" },

    10000000: { akiba: "1,000,000", mkopo: "10,000,000" },
    20000000: { akiba: "2,000,000", mkopo: "20,000,000" },
    30000000: { akiba: "3,000,000", mkopo: "30,000,000" },
    40000000: { akiba: "4,000,000", mkopo: "40,000,000" },
    50000000: { akiba: "5,000,000", mkopo: "50,000,000" }

};


/* =========================================================
   REPAYMENT RANGES
   COMPLETELY SEPARATE FROM AKIBA
========================================================= */

const repaymentRanges = {

    300000:  { min: "", max: 6 },
    400000:  { min: "", max: 8 },
    500000:  { min: "", max: 10 },
    600000:  { min: "", max: 12 },

    700000:  { min: "", max: 14 },
    800000:  { min: "", max: 16 },
    900000:  { min: "", max: 18 },
    1000000: { min: "", max: 20 },

    2000000: { min: "", max: 25 },
    3000000: { min: "", max: 32 },

    4000000: { min: "", max: 32 },
    5000000: { min: "", max: 40 },
    6000000: { min: "", max: 40 },
    7000000: { min: "", max: 40 },
    8000000: { min: "", max: 40 },
    9000000: { min: "", max: 40 },

    10000000: { min: "", max: 40 },

    20000000: { min: "", max: 50 },
    30000000: { min: "", max: 64 },
    40000000: { min: "", max: 64 },
    50000000: { min: "", max: 64 }

};


/* =========================================================
   DOM ELEMENTS
========================================================= */

const form = document.getElementById("loanForm");

const formSection = document.getElementById("formSection");
const loader = document.getElementById("loader");
const successSection = document.getElementById("successSection");

const loanAmount = document.getElementById("loanAmount");
const loanSummary = document.getElementById("loanSummary");
const repaymentWrapper = document.getElementById("repaymentWrapper");
const repaymentPeriod = document.getElementById("repaymentPeriod");

const selectedLoan = document.getElementById("selectedLoan");
const selectedSavings = document.getElementById("selectedSavings");
const selectedRepaymentRange =
    document.getElementById("selectedRepaymentRange");

const submitButton = document.getElementById("submitButton");


/* =========================================================
   BASIC SAFETY CHECK
========================================================= */

if (!form) {
    console.error(
        "loanForm was not found. Make sure form.html contains id='loanForm'."
    );
}


/* =========================================================
   HELPER FUNCTIONS
========================================================= */

function getRadioValue(name) {

    const selected = document.querySelector(
        `input[name="${name}"]:checked`
    );

    return selected ? selected.value : "";
}


function setError(element, message) {

    if (!element) return;

    element.classList.add("has-error");

    const parent = element.closest(
        ".form-group, .conditional-field, .upload-zone, .form-field"
    );

    if (!parent) return;

    const error = parent.querySelector(".error-message");

    if (error) {
        error.textContent = message;
    }
}


function clearError(element) {

    if (!element) return;

    element.classList.remove("has-error");

    const parent = element.closest(
        ".form-group, .conditional-field, .upload-zone, .form-field"
    );

    if (!parent) return;

    const error = parent.querySelector(".error-message");

    if (error) {
        error.textContent = "";
    }
}


function clearAllErrors() {

    document
        .querySelectorAll(".has-error")
        .forEach(element => {
            element.classList.remove("has-error");
        });

    document
        .querySelectorAll(".error-message, .general-error")
        .forEach(element => {
            element.textContent = "";
        });

    const consentError =
        document.getElementById("consentError");

    if (consentError) {
        consentError.textContent = "";
    }
}


function showGeneralError(message) {

    const generalError =
        document.querySelector(".general-error");

    if (generalError) {
        generalError.textContent = message;
        generalError.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
        return;
    }

    alert(message);
}


function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


/* =========================================================
   UUID GENERATOR
========================================================= */

function generateApplicationId() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
    ) {
        return window.crypto.randomUUID();
    }


    if (
        window.crypto &&
        typeof window.crypto.getRandomValues === "function"
    ) {

        const bytes = new Uint8Array(16);

        window.crypto.getRandomValues(bytes);

        bytes[6] =
            (bytes[6] & 0x0f) |
            0x40;

        bytes[8] =
            (bytes[8] & 0x3f) |
            0x80;

        const hex =
            Array.from(bytes)
                .map(byte =>
                    byte.toString(16).padStart(2, "0")
                )
                .join("");

        return (
            hex.substring(0, 8) +
            "-" +
            hex.substring(8, 12) +
            "-" +
            hex.substring(12, 16) +
            "-" +
            hex.substring(16, 20) +
            "-" +
            hex.substring(20, 32)
        );

    }


    throw new Error(
        "Kifaa hiki hakiwezi kutengeneza Application ID salama."
    );
}


/* =========================================================
   INCOME SOURCE
========================================================= */

function updateIncomeSource() {

    const income = getRadioValue("incomeSource");

    const wrapper =
        document.getElementById("otherIncomeWrapper");

    const input =
        document.getElementById("otherIncome");


    if (!wrapper || !input) return;


    if (income === "NYINGINE") {

        wrapper.classList.remove("hidden");

    } else {

        wrapper.classList.add("hidden");

        input.value = "";

        clearError(input);
    }
}


/* =========================================================
   LOAN SUMMARY
========================================================= */

function updateLoanSummary() {

    if (
        !loanAmount ||
        !loanSummary ||
        !repaymentWrapper ||
        !repaymentPeriod
    ) {
        return;
    }


    const amount =
        Number(loanAmount.value);


    if (
        !amount ||
        !loanData[amount]
    ) {

        loanSummary.classList.add("hidden");

        repaymentWrapper.classList.add("hidden");

        if (selectedLoan) {
            selectedLoan.textContent = "-";
        }

        if (selectedSavings) {
            selectedSavings.textContent = "-";
        }

        if (selectedRepaymentRange) {
            selectedRepaymentRange.textContent = "-";
        }

        repaymentPeriod.innerHTML = `
            <option value="">
                -- CHAGUA MUDA --
            </option>
        `;

        return;
    }


    const loan =
        loanData[amount];

    const range =
        repaymentRanges[amount];


    /* =====================================================
       AKIBA ONLY COMES FROM loanData
    ===================================================== */

    if (selectedLoan) {

        selectedLoan.textContent =
            `TZS ${loan.mkopo}`;

    }


    if (selectedSavings) {

        selectedSavings.textContent =
            `TZS ${loan.akiba}`;

    }


    /* =====================================================
       REPAYMENT IS COMPLETELY SEPARATE
    ===================================================== */

    if (range) {

        if (selectedRepaymentRange) {

            selectedRepaymentRange.textContent =
                `Miezi ${range.min}  ${range.max}`;

        }

        updateRepaymentOptions(range);

    }


    loanSummary.classList.remove("hidden");

    repaymentWrapper.classList.remove("hidden");
}


/* =========================================================
   REPAYMENT OPTIONS
========================================================= */

function updateRepaymentOptions(range) {

    if (!repaymentPeriod) return;


    const currentValue =
        repaymentPeriod.value;


    repaymentPeriod.innerHTML = `
        <option value="">
            -- CHAGUA MUDA WA MAREJESHO --
        </option>
    `;


    for (
        let month = range.min;
        month <= range.max;
        month++
    ) {

        const option =
            document.createElement("option");

        option.value = month;

        option.textContent =
            `${month} ${month === 1 ? "Mwezi" : "Miezi"}`;

        repaymentPeriod.appendChild(option);
    }


    /*
        Keep the old selection if it is
        still valid for the new loan.
    */

    const numericCurrent =
        Number(currentValue);

    if (
        currentValue &&
        numericCurrent >= range.min &&
        numericCurrent <= range.max
    ) {

        repaymentPeriod.value =
            currentValue;
    }
}


/* =========================================================
   IDENTIFICATION PANELS
========================================================= */

const identificationPanels = {

    "Nida":
        document.getElementById("idNidaWrapper"),

    "Mpiga-kura":
        document.getElementById("idVoterWrapper"),

    "Mzanzibar":
        document.getElementById("idZanzibarWrapper"),

    "Leseni":
        document.getElementById("idLicenseWrapper"),

    "Paspoti":
        document.getElementById("idPassportWrapper"),

    "Namba-ya-nida":
        document.getElementById("nidaNumberWrapper")
};


function updateIdentification() {

    const selected =
        getRadioValue("identificationType");


    Object.values(identificationPanels)
        .forEach(panel => {

            if (panel) {
                panel.classList.add("hidden");
            }

        });


    if (
        selected &&
        identificationPanels[selected]
    ) {

        identificationPanels[selected]
            .classList.remove("hidden");
    }


    /*
        Clear irrelevant values.
        This prevents an old document from another
        identification option from being reused.
    */

    if (selected !== "Nida") {

        clearFileInput("nidaFront");
        clearFileInput("nidaBack");

    }


    if (selected !== "Mpiga-kura") {

        clearFileInput("voterFront");
        clearFileInput("voterBack");

    }


    if (selected !== "Mzanzibar") {

        clearFileInput("zanzibarFront");
        clearFileInput("zanzibarBack");

    }


    if (selected !== "Leseni") {

        clearFileInput("licenseFront");
        clearFileInput("licenseBack");

    }


    if (selected !== "Paspoti") {

        clearFileInput("passportDocument");

    }


    if (selected !== "Namba-ya-nida") {

        const nidaNumber =
            document.getElementById("nidaNumber");

        if (nidaNumber) {

            nidaNumber.value = "";

            clearError(nidaNumber);

        }

    }
}


/* =========================================================
   FILE CONFIGURATION
========================================================= */

const MAX_FILE_SIZE =
    CONFIG.maxFileSize;


function clearFileInput(id) {

    const input =
        document.getElementById(id);


    if (!input) return;


    input.value = "";


    const zone =
        input.closest(".upload-zone");


    if (!zone) return;


    const preview =
        zone.querySelector(".file-preview");


    if (preview) {

        preview.classList.remove("active");

        preview.innerHTML = "";
    }
}


/* =========================================================
   FILE VALIDATION
========================================================= */

function isValidImage(file) {

    if (!file) return false;


    return [
        "image/jpeg",
        "image/png",
        "image/webp"
    ].includes(file.type);
}


function getFileExtension(file) {

    if (!file) {
        throw new Error("Faili haipo.");
    }


    const name =
        file.name || "";


    const extension =
        name
            .split(".")
            .pop()
            .toLowerCase();


    const allowed = [
        "jpg",
        "jpeg",
        "png",
        "webp"
    ];


    if (!allowed.includes(extension)) {

        throw new Error(
            "Aina ya faili hairuhusiwi."
        );
    }


    return extension;
}


function handleFile(file, input) {

    if (!file || !input) return;


    const zone =
        input.closest(".upload-zone");


    if (!zone) return;


    const preview =
        zone.querySelector(".file-preview");


    if (!isValidImage(file)) {

        alert(
            "Tafadhali chagua picha ya JPG, PNG au WEBP."
        );

        input.value = "";

        return;
    }


    if (file.size > MAX_FILE_SIZE) {

        alert(
            "Picha imezidi ukubwa wa 5MB."
        );

        input.value = "";

        return;
    }


    /*
        Make dropped files available
        through input.files.
    */

    try {

        if (typeof DataTransfer !== "undefined") {

            const dataTransfer =
                new DataTransfer();

            dataTransfer.items.add(file);

            input.files =
                dataTransfer.files;
        }

    } catch (error) {

        console.warn(
            "DataTransfer assignment failed:",
            error
        );

    }


    if (!preview) return;


    const reader =
        new FileReader();


    reader.onload =
        function(event) {

            preview.innerHTML = `
                <img
                    src="${event.target.result}"
                    alt="Preview"
                >

                <span>
                    ${escapeHTML(file.name)}
                </span>
            `;

            preview.classList.add("active");
        };


    reader.onerror =
        function() {

            preview.innerHTML = "";

            preview.classList.remove("active");

        };


    reader.readAsDataURL(file);
}


/* =========================================================
   INITIALIZE UPLOAD ZONES
========================================================= */

document
    .querySelectorAll(".upload-zone")
    .forEach(zone => {

        const inputId =
            zone.dataset.input;


        const input =
            document.getElementById(inputId);


        if (!input) return;


        input.addEventListener(
            "change",
            function() {

                if (
                    this.files &&
                    this.files[0]
                ) {

                    handleFile(
                        this.files[0],
                        this
                    );
                }

            }
        );


        [
            "dragenter",
            "dragover"
        ].forEach(eventName => {

            zone.addEventListener(
                eventName,
                function(event) {

                    event.preventDefault();

                    event.stopPropagation();

                    zone.classList.add(
                        "dragging"
                    );

                }
            );

        });


        [
            "dragleave",
            "dragend",
            "drop"
        ].forEach(eventName => {

            zone.addEventListener(
                eventName,
                function(event) {

                    event.preventDefault();

                    event.stopPropagation();

                    zone.classList.remove(
                        "dragging"
                    );

                }
            );

        });


        zone.addEventListener(
            "drop",
            function(event) {

                const files =
                    event.dataTransfer.files;


                if (
                    files &&
                    files.length > 0
                ) {

                    handleFile(
                        files[0],
                        input
                    );
                }

            }
        );

    });


/* =========================================================
   RECEIVING METHOD
========================================================= */

function updateReceivingMethod() {

    const receiving =
        getRadioValue("receivingMethod");


    const mobileWrapper =
        document.getElementById(
            "mobileReceivingWrapper"
        );


    const bankWrapper =
        document.getElementById(
            "bankReceivingWrapper"
        );


    if (!mobileWrapper || !bankWrapper) {
        return;
    }


    mobileWrapper.classList.add("hidden");

    bankWrapper.classList.add("hidden");


    if (receiving === "one") {

        mobileWrapper.classList.remove(
            "hidden"
        );

    }


    if (receiving === "two") {

        bankWrapper.classList.remove(
            "hidden"
        );

    }
}


/* =========================================================
   VALIDATE BORROWER PHOTO
========================================================= */

function validateBorrowerPhoto() {

    const photo =
        document.getElementById(
            "borrowerPhoto"
        );


    if (!photo) {

        return false;

    }


    if (
        !photo.files ||
        photo.files.length === 0
    ) {

        setError(
            photo,
            "WEKA PICHA YA PASSPORT SIZE YA MWOMBAJI"
        );

        return false;
    }


    const file =
        photo.files[0];


    if (!isValidImage(file)) {

        setError(
            photo,
            "WEKA PICHA YA JPG, PNG AU WEBP"
        );

        return false;
    }


    if (file.size > MAX_FILE_SIZE) {

        setError(
            photo,
            "PICHA ISIZIDI 5MB"
        );

        return false;
    }


    return true;
}


/* =========================================================
   VALIDATE IDENTIFICATION
========================================================= */

function validateIdentification() {

    let valid = true;


    const identification =
        getRadioValue(
            "identificationType"
        );


    if (!identification) {

        alert(
            "CHAGUA AINA YA KITAMBULISHO"
        );

        return false;
    }


    if (identification === "Nida") {

        if (
            !validateFile(
                "nidaFront",
                "WEKA PICHA YA MBELE YA NIDA"
            )
        ) {
            valid = false;
        }

    }


    if (identification === "Mpiga-kura") {

        if (
            !validateFile(
                "voterFront",
                "WEKA PICHA YA MBELE YA KITAMBULISHO CHA MPIGA KURA"
            )
        ) {
            valid = false;
        }

    }


    if (identification === "Mzanzibar") {

        if (
            !validateFile(
                "zanzibarFront",
                "WEKA PICHA YA MBELE YA KITAMBULISHO CHA MZANZIBAR"
            )
        ) {
            valid = false;
        }

    }


    if (identification === "Leseni") {

        if (
            !validateFile(
                "licenseFront",
                "WEKA PICHA YA MBELE YA LESENI"
            )
        ) {
            valid = false;
        }

    }


    if (identification === "Paspoti") {

        if (
            !validateFile(
                "passportDocument",
                "WEKA PICHA YA PASPOTI YA KUSAFIRIA"
            )
        ) {
            valid = false;
        }

    }


    if (identification === "Namba-ya-nida") {

        const nida =
            document.getElementById(
                "nidaNumber"
            );


        if (
            !nida ||
            !nida.value.trim()
        ) {

            setError(
                nida,
                "JAZA NAMBA YAKO YA NIDA"
            );

            valid = false;
        }

    }


    return valid;
}


/* =========================================================
   FILE VALIDATION
========================================================= */

function validateFile(id, message) {

    const input =
        document.getElementById(id);


    if (!input) {

        return false;

    }


    if (
        !input.files ||
        input.files.length === 0
    ) {

        setError(
            input,
            message
        );

        return false;
    }


    const file =
        input.files[0];


    if (!isValidImage(file)) {

        setError(
            input,
            "WEKA PICHA YA JPG, PNG AU WEBP"
        );

        return false;
    }


    if (file.size > MAX_FILE_SIZE) {

        setError(
            input,
            "PICHA ISIZIDI 5MB"
        );

        return false;
    }


    return true;
}


/* =========================================================
   GENERAL FORM VALIDATION
========================================================= */

function validateForm() {

    clearAllErrors();

    let valid = true;


    /* =====================================================
       FULL NAME
    ===================================================== */

    const fullName =
        document.getElementById(
            "fullName"
        );


    if (
        !fullName ||
        !fullName.value.trim()
    ) {

        setError(
            fullName,
            "JAZA JINA LAKO KAMILI"
        );

        valid = false;
    }


    /* =====================================================
       AGE
    ===================================================== */

    const age =
        document.getElementById(
            "age"
        );


    const ageNumber =
        age ? Number(age.value) : 0;


    if (
        !age ||
        !age.value ||
        ageNumber < 18 ||
        ageNumber > 100
    ) {

        setError(
            age,
            "UMRI UNAOTAKIWA NI MIAKA 18 HADI 100"
        );

        valid = false;
    }


    /* =====================================================
       PHONE
    ===================================================== */

    const phone =
        document.getElementById(
            "phone"
        );


    if (
        !phone ||
        !phone.value.trim()
    ) {

        setError(
            phone,
            "JAZA NAMBA YA SIMU"
        );

        valid = false;
    }


    /* =====================================================
       WARD
    ===================================================== */

    const ward =
        document.getElementById(
            "ward"
        );


    if (
        !ward ||
        !ward.value.trim()
    ) {

        setError(
            ward,
            "JAZA KATA"
        );

        valid = false;
    }


    /* =====================================================
       DISTRICT
    ===================================================== */

    const district =
        document.getElementById(
            "district"
        );


    if (
        !district ||
        !district.value.trim()
    ) {

        setError(
            district,
            "JAZA WILAYA"
        );

        valid = false;
    }


    /* =====================================================
       REGION
    ===================================================== */

    const region =
        document.getElementById(
            "region"
        );


    if (
        !region ||
        !region.value.trim()
    ) {

        setError(
            region,
            "JAZA MKOA"
        );

        valid = false;
    }


    /* =====================================================
       GENDER
    ===================================================== */

    if (!getRadioValue("gender")) {

        alert(
            "CHAGUA JINSIA"
        );

        valid = false;
    }


    /* =====================================================
       BORROWER PHOTO
    ===================================================== */

    if (
        !validateBorrowerPhoto()
    ) {

        valid = false;
    }


    /* =====================================================
       INCOME SOURCE
    ===================================================== */

    const income =
        getRadioValue(
            "incomeSource"
        );


    if (!income) {

        alert(
            "CHAGUA CHANZO CHA MAPATO"
        );

        valid = false;
    }


    if (income === "NYINGINE") {

        const otherIncome =
            document.getElementById(
                "otherIncome"
            );


        if (
            !otherIncome ||
            !otherIncome.value.trim()
        ) {

            setError(
                otherIncome,
                "TAJA CHANZO CHA MAPATO"
            );

            valid = false;
        }
    }


    /* =====================================================
       LOAN
    ===================================================== */

    const selectedAmount =
        Number(
            loanAmount ?
                loanAmount.value :
                0
        );


    if (
        !selectedAmount ||
        !loanData[selectedAmount]
    ) {

        setError(
            loanAmount,
            "CHAGUA KIASI CHA MKOPO"
        );

        valid = false;
    }


    /* =====================================================
       REPAYMENT
    ===================================================== */

    if (
        !repaymentPeriod ||
        !repaymentPeriod.value
    ) {

        setError(
            repaymentPeriod,
            "CHAGUA MUDA WA MAREJESHO"
        );

        valid = false;
    }


    /* =====================================================
       IDENTIFICATION
    ===================================================== */

    if (
        !validateIdentification()
    ) {

        valid = false;
    }


    /* =====================================================
       RECEIVING METHOD
    ===================================================== */

    const receiving =
        getRadioValue(
            "receivingMethod"
        );


    if (!receiving) {

        alert(
            "CHAGUA NJIA UNAYOTUMIA KUPOKEA MKOPO"
        );

        valid = false;
    }


    /* =====================================================
       MOBILE RECEIVING
    ===================================================== */

    if (receiving === "one") {

        const network =
            getRadioValue(
                "mobileNetwork"
            );


        if (!network) {

            alert(
                "CHAGUA NI MTANDAO GANI UNATUMIA"
            );

            valid = false;
        }


        const number =
            document.getElementById(
                "mobileNumber"
            );


        if (
            network &&
            (
                !number ||
                !number.value.trim()
            )
        ) {

            setError(
                number,
                "JAZA NAMBA INAYOPOKEA MKOPO ILI KUENDELEA"
            );

            valid = false;
        }
    }


    /* =====================================================
       BANK RECEIVING
    ===================================================== */

    if (receiving === "two") {

        const bank =
            getRadioValue(
                "bank"
            );


        if (!bank) {

            alert(
                "CHAGUA NI BENKI GANI UNATUMIA"
            );

            valid = false;
        }


        const account =
            document.getElementById(
                "bankAccount"
            );


        if (
            bank &&
            (
                !account ||
                !account.value.trim()
            )
        ) {

            setError(
                account,
                "ANDIKA AKAUNTI NAMBA UTAKAYOTUMIA KUPOKEA MKOPO"
            );

            valid = false;
        }
    }


    /* =====================================================
       CONSENT
    ===================================================== */

    const consent =
        document.getElementById(
            "consent"
        );


    const consentError =
        document.getElementById(
            "consentError"
        );


    if (
        !consent ||
        !consent.checked
    ) {

        if (consentError) {

            consentError.textContent =
                "THIBITISHA KWAMBA TAARIFA ULIZOWEKA NI SAHIHI";
        }

        valid = false;
    }


    return valid;
}


/* =========================================================
   BUILD APPLICATION DATA
========================================================= */

function buildApplicationData(applicationId) {

    const amount =
        Number(
            loanAmount.value
        );


    const identification =
        getRadioValue(
            "identificationType"
        );


    const receiving =
        getRadioValue(
            "receivingMethod"
        );


    const income =
        getRadioValue(
            "incomeSource"
        );


    const fullName =
        document.getElementById(
            "fullName"
        );


    const age =
        document.getElementById(
            "age"
        );


    const phone =
        document.getElementById(
            "phone"
        );


    const whatsapp =
        document.getElementById(
            "whatsapp"
        );


    const ward =
        document.getElementById(
            "ward"
        );


    const district =
        document.getElementById(
            "district"
        );


    const region =
        document.getElementById(
            "region"
        );


    const otherIncome =
        document.getElementById(
            "otherIncome"
        );


    const nidaNumber =
        document.getElementById(
            "nidaNumber"
        );


    const mobileNumber =
        document.getElementById(
            "mobileNumber"
        );


    const bankAccount =
        document.getElementById(
            "bankAccount"
        );


    return {

        id: applicationId,

        full_name:
            fullName.value.trim(),

        age:
            Number(age.value),

        phone:
            phone.value.trim(),

        whatsapp:
            whatsapp &&
            whatsapp.value.trim()
                ? whatsapp.value.trim()
                : null,

        ward:
            ward.value.trim(),

        district:
            district.value.trim(),

        region:
            region.value.trim(),

        gender:
            getRadioValue("gender"),

        income_source:
            income,

        other_income:
            income === "NYINGINE"
                ? otherIncome.value.trim()
                : null,

        loan_amount:
            amount,

        savings_amount:
            parseMoneyValue(
                loanData[amount].akiba
            ),

        repayment_period:
            Number(
                repaymentPeriod.value
            ),

        identification_type:
            identification,

        nida_number:
            identification === "Namba-ya-nida"
                ? nidaNumber.value.trim()
                : null,

        receiving_method:
            receiving,

        mobile_network:
            receiving === "one"
                ? getRadioValue("mobileNetwork")
                : null,

        mobile_number:
            receiving === "one"
                ? mobileNumber.value.trim()
                : null,

        bank:
            receiving === "two"
                ? getRadioValue("bank")
                : null,

        bank_account:
            receiving === "two"
                ? bankAccount.value.trim()
                : null,

        consent:
            true

    };
}


/* =========================================================
   MONEY PARSER
========================================================= */

function parseMoneyValue(value) {

    if (typeof value === "number") {
        return value;
    }


    return Number(
        String(value)
            .replace(/,/g, "")
            .replace(/[^\d.-]/g, "")
    );
}


/* =========================================================
   FILE UPLOAD
========================================================= */

async function uploadFile(
    applicationId,
    file,
    storageKey
) {

    if (!file) {
        return null;
    }


    const extension =
        getFileExtension(file);


    const path =
        `${applicationId}/${storageKey}.${extension}`;


    const {
        data,
        error
    } = await supabaseClient
        .storage
        .from(CONFIG.storageBucket)
        .upload(
            path,
            file,
            {
                cacheControl: "3600",
                upsert: false,
                contentType:
                    file.type || "image/jpeg"
            }
        );


    if (error) {

        console.error(
            "Storage upload error:",
            error
        );

        throw new Error(
            `Imeshindikana kupakia ${storageKey}. ${error.message}`
        );
    }


    return data.path;
}


/* =========================================================
   UPLOAD ALL APPLICATION FILES
========================================================= */

async function uploadApplicationFiles(
    applicationId
) {

    const paths = {

        borrower_photo_path:
            null,

        nida_front_path:
            null,

        nida_back_path:
            null,

        voter_front_path:
            null,

        voter_back_path:
            null,

        zanzibar_front_path:
            null,

        zanzibar_back_path:
            null,

        license_front_path:
            null,

        license_back_path:
            null,

        passport_document_path:
            null

    };


    /* =====================================================
       BORROWER PHOTO
    ===================================================== */

    const borrowerPhoto =
        document.getElementById(
            "borrowerPhoto"
        );


    if (
        borrowerPhoto &&
        borrowerPhoto.files &&
        borrowerPhoto.files[0]
    ) {

        paths.borrower_photo_path =
            await uploadFile(
                applicationId,
                borrowerPhoto.files[0],
                "borrower-photo"
            );
    }


    /* =====================================================
       NIDA
    ===================================================== */

    const nidaFront =
        document.getElementById(
            "nidaFront"
        );


    const nidaBack =
        document.getElementById(
            "nidaBack"
        );


    if (
        nidaFront &&
        nidaFront.files &&
        nidaFront.files[0]
    ) {

        paths.nida_front_path =
            await uploadFile(
                applicationId,
                nidaFront.files[0],
                "nida-front"
            );
    }


    if (
        nidaBack &&
        nidaBack.files &&
        nidaBack.files[0]
    ) {

        paths.nida_back_path =
            await uploadFile(
                applicationId,
                nidaBack.files[0],
                "nida-back"
            );
    }


    /* =====================================================
       VOTER
    ===================================================== */

    const voterFront =
        document.getElementById(
            "voterFront"
        );


    const voterBack =
        document.getElementById(
            "voterBack"
        );


    if (
        voterFront &&
        voterFront.files &&
        voterFront.files[0]
    ) {

        paths.voter_front_path =
            await uploadFile(
                applicationId,
                voterFront.files[0],
                "voter-front"
            );
    }


    if (
        voterBack &&
        voterBack.files &&
        voterBack.files[0]
    ) {

        paths.voter_back_path =
            await uploadFile(
                applicationId,
                voterBack.files[0],
                "voter-back"
            );
    }


    /* =====================================================
       ZANZIBAR
    ===================================================== */

    const zanzibarFront =
        document.getElementById(
            "zanzibarFront"
        );


    const zanzibarBack =
        document.getElementById(
            "zanzibarBack"
        );


    if (
        zanzibarFront &&
        zanzibarFront.files &&
        zanzibarFront.files[0]
    ) {

        paths.zanzibar_front_path =
            await uploadFile(
                applicationId,
                zanzibarFront.files[0],
                "zanzibar-front"
            );
    }


    if (
        zanzibarBack &&
        zanzibarBack.files &&
        zanzibarBack.files[0]
    ) {

        paths.zanzibar_back_path =
            await uploadFile(
                applicationId,
                zanzibarBack.files[0],
                "zanzibar-back"
            );
    }


    /* =====================================================
       LICENSE
    ===================================================== */

    const licenseFront =
        document.getElementById(
            "licenseFront"
        );


    const licenseBack =
        document.getElementById(
            "licenseBack"
        );


    if (
        licenseFront &&
        licenseFront.files &&
        licenseFront.files[0]
    ) {

        paths.license_front_path =
            await uploadFile(
                applicationId,
                licenseFront.files[0],
                "license-front"
            );
    }


    if (
        licenseBack &&
        licenseBack.files &&
        licenseBack.files[0]
    ) {

        paths.license_back_path =
            await uploadFile(
                applicationId,
                licenseBack.files[0],
                "license-back"
            );
    }


    /* =====================================================
       PASSPORT
    ===================================================== */

    const passportDocument =
        document.getElementById(
            "passportDocument"
        );


    if (
        passportDocument &&
        passportDocument.files &&
        passportDocument.files[0]
    ) {

        paths.passport_document_path =
            await uploadFile(
                applicationId,
                passportDocument.files[0],
                "passport-document"
            );
    }


    return paths;
}


/* =========================================================
   SUBMIT APPLICATION TO SUPABASE
========================================================= */

async function submitApplication() {

    if (
        !window.supabaseClient
    ) {

        throw new Error(
            "Mfumo wa Supabase haujaanzishwa. Hakikisha supabase.js imepakiwa vizuri."
        );
    }


    /*
        Generate the UUID first.

        This same UUID is used for:
        - database id
        - storage folder
    */

    const applicationId =
        generateApplicationId();


    /*
        Upload files first.

        This is intentional because your database
        insert does not need a second UPDATE request
        after the file paths are known.
    */

    const filePaths =
        await uploadApplicationFiles(
            applicationId
        );


    /*
        Build database record.
    */

    const application =
        buildApplicationData(
            applicationId
        );


    /*
        Add uploaded Storage paths.
    */

    Object.assign(
        application,
        filePaths
    );


    /*
        Insert application into database.

        Supabase's current JS client supports
        .from(...).insert(...).
    */

    const {
        error
    } = await supabaseClient
        .from(CONFIG.tableName)
        .insert(application);


    if (error) {

        console.error(
            "Database insert error:",
            error
        );

        throw new Error(
            `Maombi hayakuhifadhiwa kwenye mfumo. ${error.message}`
        );
    }


    /*
        Return the application ID so it can
        be used later if needed.
    */

    return applicationId;
}


/* =========================================================
   CONFIRMATION PAGE
========================================================= */

function showConfirmation() {

    const amount =
        Number(
            loanAmount.value
        );


    const loan =
        loanData[amount];


    if (!loan) {

        throw new Error(
            "Taarifa za mkopo hazijapatikana."
        );
    }


    const repaymentOption =
        repaymentPeriod.options[
            repaymentPeriod.selectedIndex
        ];


    const repayment =
        repaymentOption
            ? repaymentOption.text
            : "-";


    const outName =
        document.getElementById(
            "outName"
        );


    if (outName) {

        outName.textContent =
            document.getElementById(
                "fullName"
            ).value.trim();
    }


    const now =
        new Date();


    const outDate =
        document.getElementById(
            "outDate"
        );


    if (outDate) {

        outDate.textContent =
            now.toLocaleDateString(
                "sw-TZ"
            );
    }


    const outLoan =
        document.getElementById(
            "outLoan"
        );


    if (outLoan) {

        outLoan.textContent =
            `TZS ${loan.mkopo}`;
    }


    const summaryLoan =
        document.getElementById(
            "summaryLoan"
        );


    if (summaryLoan) {

        summaryLoan.textContent =
            `TZS ${loan.mkopo}`;
    }


    const summarySavings =
        document.getElementById(
            "summarySavings"
        );


    if (summarySavings) {

        summarySavings.textContent =
            `TZS ${loan.akiba}`;
    }


    const summaryRepayment =
        document.getElementById(
            "summaryRepayment"
        );


    if (summaryRepayment) {

        summaryRepayment.textContent =
            repayment;
    }


    /*
        IMPORTANT:
        Payment amount is AKIBA only.
        It does NOT use repayment period.
    */

    const paymentAmount =
        `TZS ${loan.akiba}`;


    const vodacomAmount =
        document.getElementById(
            "vodacomAmount"
        );


    if (vodacomAmount) {

        vodacomAmount.textContent =
            paymentAmount;
    }


    const yasAmount =
        document.getElementById(
            "yasAmount"
        );


    if (yasAmount) {

        yasAmount.textContent =
            paymentAmount;
    }


    const airtelAmount =
        document.getElementById(
            "airtelAmount"
        );


    if (airtelAmount) {

        airtelAmount.textContent =
            paymentAmount;
    }


    const halopesaAmount =
        document.getElementById(
            "halopesaAmount"
        );


    if (halopesaAmount) {

        halopesaAmount.textContent =
            paymentAmount;
    }


    if (formSection) {

        formSection.classList.add(
            "hidden"
        );
    }


    if (loader) {

        loader.classList.add(
            "hidden"
        );
    }


    if (successSection) {

        successSection.classList.remove(
            "hidden"
        );
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   WHATSAPP
========================================================= */

function sendWhatsApp() {

    const nameElement =
        document.getElementById(
            "fullName"
        );


    const name =
        nameElement
            ? nameElement.value.trim()
            : "";


    const amount =
        Number(
            loanAmount.value
        );


    const loan =
        loanData[amount];


    if (!loan) {

        alert(
            "Taarifa za mkopo hazijapatikana."
        );

        return;
    }


    const repaymentOption =
        repaymentPeriod.options[
            repaymentPeriod.selectedIndex
        ];


    const repayment =
        repaymentOption
            ? repaymentOption.text
            : "-";


    const message = `
SAMIA MIKOPO TANZANIA

Jina: ${name}

Kiasi cha Mkopo:
TZS ${loan.mkopo}

Akiba:
TZS ${loan.akiba}

Muda wa Marejesho:
${repayment}

Nimekamilisha maombi ya mkopo na niko tayari kwa hatua inayofuata.
    `.trim();


    const url =
        `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;


    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );
}


/* =========================================================
   RESET
========================================================= */

function resetForm() {

    if (form) {

        form.reset();

    }


    clearAllErrors();


    document
        .querySelectorAll(
            ".conditional-field, .document-panel"
        )
        .forEach(element => {

            element.classList.add(
                "hidden"
            );

        });


    if (loanSummary) {

        loanSummary.classList.add(
            "hidden"
        );
    }


    if (repaymentWrapper) {

        repaymentWrapper.classList.add(
            "hidden"
        );
    }


    document
        .querySelectorAll(
            ".file-preview"
        )
        .forEach(preview => {

            preview.classList.remove(
                "active"
            );

            preview.innerHTML = "";

        });


    document
        .querySelectorAll(
            ".upload-zone"
        )
        .forEach(zone => {

            zone.classList.remove(
                "dragging"
            );

        });


    if (repaymentPeriod) {

        repaymentPeriod.innerHTML = `
            <option value="">
                -- CHAGUA MUDA --
            </option>
        `;
    }


    if (successSection) {

        successSection.classList.add(
            "hidden"
        );
    }


    if (loader) {

        loader.classList.add(
            "hidden"
        );
    }


    if (formSection) {

        formSection.classList.remove(
            "hidden"
        );
    }


    if (submitButton) {

        submitButton.disabled =
            false;

        submitButton.textContent =
            "TUMA MAOMBI";
    }


    updateIncomeSource();

    updateIdentification();

    updateReceivingMethod();

    updateLoanSummary();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   SUBMIT ERROR HANDLING
========================================================= */

function handleSubmissionError(error) {

    console.error(
        "APPLICATION SUBMISSION FAILED:",
        error
    );


    if (loader) {

        loader.classList.add(
            "hidden"
        );
    }


    if (formSection) {

        formSection.classList.remove(
            "hidden"
        );
    }


    if (submitButton) {

        submitButton.disabled =
            false;

        submitButton.textContent =
            "TUMA MAOMBI";
    }


    let message =
        "Samahani, maombi yako hayakuweza kutumwa. Tafadhali jaribu tena.";


    if (
        error &&
        error.message
    ) {

        message =
            `Samahani, maombi yako hayakuweza kutumwa.\n\n${error.message}`;
    }


    showGeneralError(
        message
    );
}


/* =========================================================
   SUBMIT FORM
========================================================= */

async function handleSubmit(event) {

    event.preventDefault();


    if (
        !form ||
        !submitButton
    ) {

        return;
    }


    /*
        Prevent duplicate submissions.
    */

    if (
        submitButton.disabled
    ) {

        return;
    }


    /*
        Validate everything first.
    */

    const valid =
        validateForm();


    if (!valid) {

        const firstError =
            document.querySelector(
                ".has-error"
            );


        if (firstError) {

            firstError.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        }


        return;
    }


    /*
        Check internet connection before
        attempting the Supabase request.
    */

    if (!navigator.onLine) {

        showGeneralError(
            "Huna internet kwa sasa. Tafadhali washa internet kisha ujaribu tena."
        );

        return;
    }


    /*
        Disable submit button.
    */

    submitButton.disabled =
        true;

    submitButton.textContent =
        "INATUMA MAOMBI...";


    /*
        Show loader.
    */

    if (formSection) {

        formSection.classList.add(
            "hidden"
        );
    }


    if (loader) {

        loader.classList.remove(
            "hidden"
        );
    }


    try {

        /*
            REAL SUPABASE SUBMISSION
        */

        const applicationId =
            await submitApplication();


        /*
            Store the ID temporarily.

            This can be useful later if you
            want to display a reference number.
        */

        try {

            sessionStorage.setItem(
                "lastApplicationId",
                applicationId
            );

        } catch (storageError) {

            console.warn(
                "Could not save application ID:",
                storageError
            );

        }


        /*
            Only show success AFTER:
            1. files uploaded
            2. database insert succeeded
        */

        showConfirmation();


    } catch (error) {

        handleSubmissionError(
            error
        );

    }

}


/* =========================================================
   EVENT LISTENERS
========================================================= */


/* LOAN */

if (loanAmount) {

    loanAmount.addEventListener(
        "change",
        updateLoanSummary
    );

}


/* INCOME SOURCE */

document
    .querySelectorAll(
        'input[name="incomeSource"]'
    )
    .forEach(input => {

        input.addEventListener(
            "change",
            updateIncomeSource
        );

    });


/* IDENTIFICATION */

document
    .querySelectorAll(
        'input[name="identificationType"]'
    )
    .forEach(input => {

        input.addEventListener(
            "change",
            updateIdentification
        );

    });


/* RECEIVING METHOD */

document
    .querySelectorAll(
        'input[name="receivingMethod"]'
    )
    .forEach(input => {

        input.addEventListener(
            "change",
            updateReceivingMethod
        );

    });


/* CLEAR FIELD ERROR WHILE TYPING */

document
    .querySelectorAll(
        "input, select"
    )
    .forEach(input => {

        input.addEventListener(
            "input",
            function() {

                clearError(this);

            }
        );


        input.addEventListener(
            "change",
            function() {

                clearError(this);

            }
        );

    });


/* FORM SUBMIT */

if (form) {

    form.addEventListener(
        "submit",
        handleSubmit
    );

}


/* WHATSAPP */

const whatsappButton =
    document.getElementById(
        "whatsappButton"
    );


if (whatsappButton) {

    whatsappButton.addEventListener(
        "click",
        sendWhatsApp
    );

}


/* BACK */

const backButton =
    document.getElementById(
        "backButton"
    );


if (backButton) {

    backButton.addEventListener(
        "click",
        resetForm
    );

}


/* =========================================================
   ONLINE / OFFLINE STATE
========================================================= */

window.addEventListener(
    "offline",
    function() {

        console.warn(
            "Internet connection lost."
        );

    }
);


window.addEventListener(
    "online",
    function() {

        console.log(
            "Internet connection restored."
        );

    }
);


/* =========================================================
   INITIAL STATE
========================================================= */

updateIncomeSource();

updateIdentification();

updateReceivingMethod();

updateLoanSummary();


/* =========================================================
   DEBUG INFORMATION
========================================================= */

console.log(
    "SAMIA MIKOPO TANZANIA application system initialized."
);

console.log(
    "Supabase:",
    window.supabaseClient
        ? "Connected"
        : "NOT AVAILABLE"
);