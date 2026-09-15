"use strict";

document.addEventListener("DOMContentLoaded", async function () {

    const supabaseClient =
        window.supabaseClient;

    if (!supabaseClient) {
        return;
    }


    const message =
        document.getElementById(
            "passwordMessage"
        );


    function showMessage(
        text,
        type = "error"
    ) {

        if (!message) {
            return;
        }

        message.textContent =
            text;

        message.className =
            `alert alert-${type}`;
    }


    /* =========================================================
       FORGOT PASSWORD
    ========================================================= */

    const forgotForm =
        document.getElementById(
            "forgotPasswordForm"
        );


    if (forgotForm) {

        const resetButton =
            document.getElementById(
                "resetButton"
            );


        forgotForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const email =
                    document.getElementById(
                        "email"
                    ).value.trim();


                if (!email) {

                    showMessage(
                        "Weka email yako."
                    );

                    return;
                }


                resetButton.disabled =
                    true;

                resetButton.textContent =
                    "INATUMA...";


                try {

                    const redirectUrl =
                        new URL(
                            "update-password.html",
                            window.location.href
                        ).href;


                    const {
                        error
                    } =
                        await supabaseClient.auth
                            .resetPasswordForEmail(
                                email,
                                {
                                    redirectTo:
                                        redirectUrl
                                }
                            );


                    if (error) {
                        throw error;
                    }


                    showMessage(
                        "Reset link imetumwa kwenye email yako.",
                        "success"
                    );


                } catch (error) {

                    console.error(
                        error
                    );

                    showMessage(
                        "Imeshindikana kutuma reset link."
                    );

                } finally {

                    resetButton.disabled =
                        false;

                    resetButton.textContent =
                        "TUMA RESET LINK";
                }
            }
        );
    }


    /* =========================================================
       UPDATE PASSWORD
    ========================================================= */

    const updateForm =
        document.getElementById(
            "updatePasswordForm"
        );


    if (updateForm) {

        const updateButton =
            document.getElementById(
                "updateButton"
            );


        const {
            data
        } =
            await supabaseClient.auth
                .getSession();


        if (!data.session) {

            showMessage(
                "Session ya password reset haipo. Tafadhali omba reset link mpya."
            );

            return;
        }


        updateForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const password =
                    document.getElementById(
                        "password"
                    ).value;

                const confirmPassword =
                    document.getElementById(
                        "confirmPassword"
                    ).value;


                if (
                    password.length < 8
                ) {

                    showMessage(
                        "Password lazima iwe na angalau herufi 8."
                    );

                    return;
                }


                if (
                    password !==
                    confirmPassword
                ) {

                    showMessage(
                        "Password hazifanani."
                    );

                    return;
                }


                updateButton.disabled =
                    true;

                updateButton.textContent =
                    "INAHIFADHI...";


                try {

                    const {
                        error
                    } =
                        await supabaseClient.auth
                            .updateUser({
                                password
                            });


                    if (error) {
                        throw error;
                    }


                    showMessage(
                        "Password imebadilishwa kikamilifu. Unaelekezwa kwenye login...",
                        "success"
                    );


                    await supabaseClient.auth.signOut();


                    setTimeout(
                        function () {

                            window.location.href =
                                "login.html";

                        },
                        1500
                    );


                } catch (error) {

                    console.error(
                        error
                    );

                    showMessage(
                        "Imeshindikana kubadilisha password."
                    );

                } finally {

                    updateButton.disabled =
                        false;

                    updateButton.textContent =
                        "HIFADHI PASSWORD";
                }
            }
        );
    }

});