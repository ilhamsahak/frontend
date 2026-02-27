"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./page.module.css";

const API = "http://localhost:8000";

const MIN_MEMBERS = 4;
const MAX_MEMBERS = 10;

const defaultMember = () => ({ real_name: "", ign: "", ingame_id: "" });

// ── Default logo fallback ─────────────────────────────────────────────────────
const DEFAULT_LOGO = "/default-logo.svg";

export default function RegisterPage() {
    const [regOpen, setRegOpen] = useState(true);
    const [regChecked, setRegChecked] = useState(false);
    const [step, setStep] = useState(1);

    // Step 1 — Captain
    const [captain, setCaptain] = useState({
        email: "",
        username: "",
        password: "",
        confirm: "",
    });
    const [captainRealName, setCaptainRealName] = useState("");

    // Step 2 — Team + Members
    const [teamName, setTeamName] = useState("");
    const [members, setMembers] = useState([
        defaultMember(), // captain (index 0)
        defaultMember(), // 3 additional initial slots
        defaultMember(),
        defaultMember(),
    ]);

    // Step 3 — Logo & Payment
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoWarning, setLogoWarning] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const fileRef = useRef();

    // UI State
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [success, setSuccess] = useState(false);

    // Check if registration is open
    useEffect(() => {
        fetch(`${API}/admin/registration-status`)
            .then(r => r.json())
            .then(d => { setRegOpen(d.registration_open); setRegChecked(true); })
            .catch(() => setRegChecked(true)); // if unreachable, default to open
    }, []);

    // ── Registration Closed screen ────────────────────────────────────────────
    if (regChecked && !regOpen) {
        return (
            <div className={styles.successOverlay}>
                <div className={styles.successCard}>
                    <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🔒</div>
                    <h1>Registration Closed</h1>
                    <p>Team registration for this tournament has been closed.<br />Please contact the organiser for more information.</p>
                    <a href="/login" className={styles.btnPrimary}>Login to Dashboard</a>
                </div>
            </div>
        );
    }

    // ── Validation ──────────────────────────────────────────────────────────────
    const validateStep1 = () => {
        const e = {};
        if (!captain.email) e.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(captain.email))
            e.email = "Invalid email address.";
        if (!captain.username) e.username = "Username is required.";
        if (!captain.password || captain.password.length < 8)
            e.password = "Password must be at least 8 characters.";
        if (captain.password !== captain.confirm)
            e.confirm = "Passwords do not match.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateStep2 = () => {
        const e = {};
        if (!teamName.trim()) e.teamName = "Team name is required.";
        if (!captainRealName.trim()) e.captainRealName = "Required";
        if (members.length < MIN_MEMBERS)
            e.members = `At least ${MIN_MEMBERS} members required (including you).`;
        members.forEach((m, i) => {
            if (i !== 0 && !m.real_name.trim()) e[`real_name_${i}`] = "Required";
            if (!m.ign.trim()) e[`ign_${i}`] = "Required";
            if (!m.ingame_id.trim()) e[`ingame_id_${i}`] = "Required";
        });
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Step navigation ─────────────────────────────────────────────────────────
    const nextStep = () => {
        if (step === 1 && !validateStep1()) return;
        if (step === 2 && !validateStep2()) return;
        setErrors({});
        setStep((s) => s + 1);
    };
    const prevStep = () => {
        setErrors({});
        setStep((s) => s - 1);
    };

    // ── Member helpers ──────────────────────────────────────────────────────────
    const updateMember = (idx, field, value) => {
        setMembers((prev) =>
            prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
        );
    };

    const addMember = () => {
        if (members.length < MAX_MEMBERS)
            setMembers((prev) => [...prev, defaultMember()]);
    };

    const removeMember = (idx) => {
        if (idx === 0) return; // captain cannot be removed
        setMembers((prev) => prev.filter((_, i) => i !== idx));
    };

    // ── Logo handling ───────────────────────────────────────────────────────────
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLogoFile(file);

        const img = document.createElement("img");
        const url = URL.createObjectURL(file);
        img.onload = () => {
            if (Math.abs(img.width - img.height) > 10) {
                setLogoWarning(
                    `⚠️ Your image is ${img.width}×${img.height}px. A 1:1 square ratio is recommended for best display.`
                );
            } else {
                setLogoWarning("");
            }
            URL.revokeObjectURL(url);
        };
        img.src = url;
        setLogoPreview(URL.createObjectURL(file));
    };

    const uploadLogo = async () => {
        if (!logoFile) return null;
        const fd = new FormData();
        fd.append("file", logoFile);
        const res = await fetch(`${API}/auth/upload-logo`, {
            method: "POST",
            body: fd,
        });
        if (!res.ok) throw new Error("Logo upload failed.");
        const data = await res.json();
        return data.logo_url;
    };

    // ── Final submit ────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        setLoading(true);
        setSubmitError("");
        try {
            let finalLogoUrl = logoUrl;
            if (logoFile && !logoUrl) {
                try {
                    finalLogoUrl = await uploadLogo();
                    setLogoUrl(finalLogoUrl);
                } catch {
                    // Logo upload failed — proceed with default logo
                    setLogoWarning("⚠️ Logo upload failed. Registering with default logo.");
                    finalLogoUrl = null;
                }
            }

            const payload = {
                email: captain.email,
                username: captain.username,
                password: captain.password,
                team_name: teamName,
                logo_url: finalLogoUrl || null,
                members: members.map((m, i) => ({
                    real_name: i === 0 ? captainRealName : m.real_name,
                    ign: m.ign,
                    ingame_id: m.ingame_id,
                })),
            };

            const res = await fetch(`${API}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Registration failed.");
            }

            setSuccess(true);
        } catch (err) {
            setSubmitError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── Render ──────────────────────────────────────────────────────────────────
    if (success) {
        return (
            <div className={styles.successOverlay}>
                <div className={styles.successCard}>
                    <h1>Registration Complete!</h1>
                    <p>Your team has been successfully registered.</p>
                    <a href="/login" className={styles.btnPrimary}>
                        Login to Dashboard
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            {/* Background effects */}
            <div className={styles.bgOrb1} />
            <div className={styles.bgOrb2} />
            <div className={styles.bgOrb3} />

            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.logoMark}>
                        <img
                            src="/tournament-logo.png"
                            alt="Magic Chess Tournament"
                            className={styles.logoImg}
                        />
                    </div>
                    <h1 className={styles.title}>Magic Chess Tournament</h1>
                    <p className={styles.subtitle}>Team Registration</p>
                </div>

                {/* Step indicator */}
                <div className={styles.stepBar}>
                    {["Captain Account", "Team & Members", "Logo & Payment"].map(
                        (label, i) => (
                            <div
                                key={i}
                                className={`${styles.stepItem} ${step === i + 1
                                    ? styles.stepActive
                                    : step > i + 1
                                        ? styles.stepDone
                                        : ""
                                    }`}
                            >
                                <div className={styles.stepNum}>
                                    {step > i + 1 ? "✓" : i + 1}
                                </div>
                                <span className={styles.stepLabel}>{label}</span>
                            </div>
                        )
                    )}
                    <div
                        className={styles.stepProgress}
                        style={{ width: `${((step - 1) / 2) * 100}%` }}
                    />
                </div>

                {/* Card */}
                <div className={styles.card}>
                    {/* ── STEP 1 ── */}
                    {step === 1 && (
                        <div className={styles.stepContent}>
                            <h2 className={styles.stepTitle}>
                                <span className={styles.stepBadge}>1</span> Captain Details
                            </h2>
                            <p className={styles.stepDesc}>
                                You are the captain of your team. Create your account below.
                            </p>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Email Address</label>
                                <input
                                    id="email"
                                    className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                                    type="email"
                                    placeholder="captain@email.com"
                                    value={captain.email}
                                    onChange={(e) =>
                                        setCaptain({ ...captain, email: e.target.value })
                                    }
                                />
                                {errors.email && (
                                    <span className={styles.errorMsg}>{errors.email}</span>
                                )}
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Username</label>
                                <input
                                    id="username"
                                    className={`${styles.input} ${errors.username ? styles.inputError : ""
                                        }`}
                                    type="text"
                                    placeholder="Your display name"
                                    value={captain.username}
                                    onChange={(e) =>
                                        setCaptain({ ...captain, username: e.target.value })
                                    }
                                />
                                {errors.username && (
                                    <span className={styles.errorMsg}>{errors.username}</span>
                                )}
                            </div>

                            <div className={styles.row}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Password</label>
                                    <input
                                        id="password"
                                        className={`${styles.input} ${errors.password ? styles.inputError : ""
                                            }`}
                                        type="password"
                                        placeholder="Min. 8 characters"
                                        value={captain.password}
                                        onChange={(e) =>
                                            setCaptain({ ...captain, password: e.target.value })
                                        }
                                    />
                                    {errors.password && (
                                        <span className={styles.errorMsg}>{errors.password}</span>
                                    )}
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Confirm Password</label>
                                    <input
                                        id="confirm"
                                        className={`${styles.input} ${errors.confirm ? styles.inputError : ""
                                            }`}
                                        type="password"
                                        placeholder="Re-enter password"
                                        value={captain.confirm}
                                        onChange={(e) =>
                                            setCaptain({ ...captain, confirm: e.target.value })
                                        }
                                    />
                                    {errors.confirm && (
                                        <span className={styles.errorMsg}>{errors.confirm}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2 ── */}
                    {step === 2 && (
                        <div className={styles.stepContent}>
                            <h2 className={styles.stepTitle}>
                                <span className={styles.stepBadge}>2</span> Team & Members
                            </h2>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Team Name</label>
                                <input
                                    id="teamName"
                                    className={`${styles.input} ${errors.teamName ? styles.inputError : ""
                                        }`}
                                    type="text"
                                    placeholder="Enter your team name"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                />
                                {errors.teamName && (
                                    <span className={styles.errorMsg}>{errors.teamName}</span>
                                )}
                            </div>

                            <div className={styles.membersHeader}>
                                <span className={styles.label}>
                                    Team Members ({members.length}/{MAX_MEMBERS})
                                </span>
                                <span className={styles.memberHint}>
                                    Minimum {MIN_MEMBERS} · Maximum {MAX_MEMBERS}
                                </span>
                            </div>

                            {errors.members && (
                                <span className={styles.errorMsg}>{errors.members}</span>
                            )}

                            <div className={styles.memberList}>
                                {members.map((m, i) => (
                                    <div
                                        key={i}
                                        className={`${styles.memberRow} ${i === 0 ? styles.captainRow : ""
                                            }`}
                                    >
                                        <div className={styles.memberIdx}>
                                            {i === 0 ? (
                                                <span className={styles.captainBadge}>C</span>
                                            ) : (
                                                <span className={styles.memberNum}>{i + 1}</span>
                                            )}
                                        </div>

                                        <div className={styles.memberFields}>
                                            <div className={styles.memberField}>
                                                <input
                                                    id={`real_name_${i}`}
                                                    className={`${styles.inputSm} ${(i === 0 ? errors.captainRealName : errors[`real_name_${i}`]) ? styles.inputError : ""
                                                        }`}
                                                    placeholder={i === 0 ? "Your real name" : "Real name"}
                                                    value={i === 0 ? captainRealName : m.real_name}
                                                    onChange={(e) =>
                                                        i === 0
                                                            ? setCaptainRealName(e.target.value)
                                                            : updateMember(i, "real_name", e.target.value)
                                                    }
                                                />
                                                <label className={styles.labelSm}>Real Name</label>
                                            </div>

                                            <div className={styles.memberField}>
                                                <input
                                                    id={`ign_${i}`}
                                                    className={`${styles.inputSm} ${errors[`ign_${i}`] ? styles.inputError : ""
                                                        }`}
                                                    placeholder="In-game name"
                                                    value={m.ign}
                                                    onChange={(e) =>
                                                        updateMember(i, "ign", e.target.value)
                                                    }
                                                />
                                                <label className={styles.labelSm}>IGN</label>
                                            </div>

                                            <div className={styles.memberField}>
                                                <input
                                                    id={`ingame_id_${i}`}
                                                    className={`${styles.inputSm} ${errors[`ingame_id_${i}`] ? styles.inputError : ""
                                                        }`}
                                                    placeholder="e.g. 123456789"
                                                    value={m.ingame_id}
                                                    onChange={(e) =>
                                                        updateMember(i, "ingame_id", e.target.value)
                                                    }
                                                />
                                                <label className={styles.labelSm}>In-Game ID</label>
                                            </div>
                                        </div>

                                        {i !== 0 && (
                                            <button
                                                className={styles.removeBtn}
                                                onClick={() => removeMember(i)}
                                                title="Remove member"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {members.length < MAX_MEMBERS && (
                                <button className={styles.addMemberBtn} onClick={addMember}>
                                    + Add Member
                                </button>
                            )}
                        </div>
                    )}

                    {/* ── STEP 3 ── */}
                    {step === 3 && (
                        <div className={styles.stepContent}>
                            <h2 className={styles.stepTitle}>
                                <span className={styles.stepBadge}>3</span> Team Logo & Payment
                            </h2>
                            <p className={styles.stepDesc}>
                                Upload your team logo (1:1 ratio recommended). You can proceed
                                without a logo — a default one will be used.
                            </p>

                            <div className={styles.logoSection}>
                                <div
                                    className={styles.logoPreviewBox}
                                    onClick={() => fileRef.current.click()}
                                >
                                    <img
                                        src={logoPreview || DEFAULT_LOGO}
                                        alt="Team logo"
                                        className={styles.logoPreviewImg}
                                    />
                                    <div className={styles.logoOverlay}>
                                        <span>Click to upload</span>
                                    </div>
                                </div>

                                <div className={styles.logoInfo}>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        className={styles.hiddenFile}
                                        onChange={handleLogoChange}
                                    />
                                    <button
                                        className={styles.uploadBtn}
                                        onClick={() => fileRef.current.click()}
                                    >
                                        📁 Choose Logo
                                    </button>
                                    {logoWarning && (
                                        <p className={styles.logoWarning}>{logoWarning}</p>
                                    )}
                                    {!logoFile && (
                                        <p className={styles.logoNotice}>
                                            No file selected — default logo will be used.
                                        </p>
                                    )}
                                    {logoFile && (
                                        <p className={styles.logoFilename}>✓ {logoFile.name}</p>
                                    )}
                                </div>
                            </div>

                            {/* Registration Summary */}
                            <div className={styles.summaryCard}>
                                <h3 className={styles.summaryTitle}>Registration Summary</h3>
                                <div className={styles.summaryRow}>
                                    <span>Captain</span>
                                    <strong>{captain.username}</strong>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Email</span>
                                    <strong>{captain.email}</strong>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Team</span>
                                    <strong>{teamName}</strong>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Members</span>
                                    <strong>{members.length} players</strong>
                                </div>
                            </div>

                            {/* Fee box */}
                            <div className={styles.feeBox}>
                                <span className={styles.feeLabel}>Registration Fee</span>
                                <span className={styles.feeAmount}>RM 50</span>
                            </div>

                            {submitError && (
                                <div className={styles.submitError}>{submitError}</div>
                            )}

                            <button
                                id="proceedPayment"
                                className={`${styles.payBtn} ${loading ? styles.payBtnLoading : ""}`}
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className={styles.spinner} />
                                ) : (
                                    <>Register Team · RM50</>
                                )}
                            </button>
                            <p className={styles.payNote}>
                                Your team will be registered immediately upon submission.
                            </p>
                        </div>
                    )}

                    {/* ── Navigation ── */}
                    <div className={styles.navButtons}>
                        {step > 1 && (
                            <button className={styles.btnSecondary} onClick={prevStep}>
                                ← Back
                            </button>
                        )}
                        {step < 3 && (
                            <button className={styles.btnPrimary} onClick={nextStep}>
                                Next →
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
