"use client";

import { useState } from "react";
import styles from "./page.module.css";

const API = "http://localhost:8000";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`${API}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier: email, password }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Login failed.");
            }
            const data = await res.json();
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("team_id", data.team_id);
            localStorage.setItem("captain_id", data.captain_id);
            // Redirect based on role
            window.location.href = data.is_admin ? "/admin" : "/dashboard";
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.orb1} />
            <div className={styles.orb2} />

            <div className={styles.card}>
                <div className={styles.logoWrap}>
                    <img src="/tournament-logo.png" alt="Logo" className={styles.logo} />
                </div>
                <h1 className={styles.title}>Captain Login</h1>
                <p className={styles.subtitle}>Access your team dashboard</p>

                <form onSubmit={handleLogin} className={styles.form}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Email or Username</label>
                        <input
                            id="email"
                            type="text"
                            className={styles.input}
                            placeholder="captain@email.com or username"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            id="password"
                            type="password"
                            className={styles.input}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <div className={styles.errorBox}>{error}</div>}

                    <button
                        id="loginBtn"
                        type="submit"
                        className={styles.btnLogin}
                        disabled={loading}
                    >
                        {loading ? <span className={styles.spinner} /> : "Login →"}
                    </button>
                </form>

                <p className={styles.registerLink}>
                    No account yet?{" "}
                    <a href="/register">Register your team</a>
                </p>
            </div>
        </div>
    );
}
