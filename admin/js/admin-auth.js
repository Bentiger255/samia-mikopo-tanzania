"use strict";

document.addEventListener("DOMContentLoaded", async function () {

    const supabaseClient = window.supabaseClient;

    if (!supabaseClient) {
        showError("Mfumo wa authentication haujapatikana.");
        return;
    }


    const loginForm =
        document.getElementById("loginForm");

    const loginButton =
        document.getElementById("loginButton");


    async function checkExistingSession() {

        const {
            data,
            error
        } = await supabaseClient.auth.getSession();

        if (error) {
            console.error(error);
            return;
        }

        if (!data.session) {
            return;
        }

        const user =
            data.session.user;

        if (
            user?.app_metadata?.role === "admin"
        ) {
            window.location.href =
                "dashboard.html";
        } else {
            await supabaseClient.auth.signOut();
        }
    }


    function showError(message) {

        const element =
            document.getElementById(
                "authError"
            );

        if (!element) {
            return;
        }

        element.textContent =
            message;

        element.classList.remove(
            "hidden"
        );
    }


    function hideError() {

        const element =
            document.getElementById(
                "authError"
            );

        if (element) {
            element.classList.add(
                "hidden"
            );
        }
    }


    await checkExistingSession();


    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            hideError();

            const email =
                document.getElementById(
                    "email"
                ).value.trim();

            const password =
                document.getElementById(
                    "password"
                ).value;


            if (!email || !password) {

                showError(
                    "Tafadhali jaza email na password."
                );

                return;
            }


            loginButton.disabled =
                true;

            loginButton.textContent =
                "INAINGIA...";


            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth
                        .signInWithPassword({
                            email,
                            password
                        });


                if (error) {
                    throw error;
                }


                const user =
                    data?.user;


                if (
                    !user ||
                    user.app_metadata?.role !== "admin"
                ) {

                    await supabaseClient.auth.signOut();

                    throw new Error(
                        "Huna ruhusa ya kuingia kwenye Admin Portal."
                    );
                }


                window.location.href =
                    "dashboard.html";


            } catch (error) {

                console.error(
                    "Admin login error:",
                    error
                );


                showError(
                    error.message ||
                    "Email au password si sahihi."
                );


                loginButton.disabled =
                    false;

                loginButton.textContent =
                    "INGIA";
            }
        }
    );

});