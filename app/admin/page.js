"use client";

import { useState, useEffect, useCallback } from "react";
import {
    LayoutDashboard, Users, ClipboardList, Trophy,
    CheckCircle, AlertCircle, Gamepad2, Pencil, Trash2,
    Lock, Clipboard, LogOut, X
} from "lucide-react";
import styles from "./page.module.css";

const API = "http://localhost:8000";

function getToken() {
    return typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
}

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [regOpen, setRegOpen] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState(null); // { id, real_name, ign, ingame_id }
    const [editingTeam, setEditingTeam] = useState(null);     // { id, team_name }
    const [saving, setSaving] = useState(false);

    const authHeaders = () => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
    });

    // ── Fetch all data ────────────────────────────────────────────────────────
    const fetchAll = useCallback(async () => {
        const token = getToken();
        if (!token) { window.location.href = "/login"; return; }

        try {
            const [teamsRes, regRes] = await Promise.all([
                fetch(`${API}/admin/teams`, { headers: authHeaders() }),
                fetch(`${API}/admin/registration-status`),
            ]);
            if (teamsRes.status === 401 || teamsRes.status === 403) {
                window.location.href = "/login"; return;
            }
            const teamsData = await teamsRes.json();
            const regData = await regRes.json();
            setTeams(Array.isArray(teamsData) ? teamsData : []);
            setRegOpen(regData.registration_open);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Toggle registration ───────────────────────────────────────────────────
    const toggleReg = async () => {
        setToggling(true);
        try {
            const res = await fetch(`${API}/admin/toggle-registration`, {
                method: "POST", headers: authHeaders(),
            });
            const data = await res.json();
            setRegOpen(data.registration_open);
        } finally { setToggling(false); }
    };

    // ── Delete team ───────────────────────────────────────────────────────────
    const deleteTeam = async (teamId) => {
        if (!confirm("Delete this team and all its players?")) return;
        await fetch(`${API}/admin/teams/${teamId}`, { method: "DELETE", headers: authHeaders() });
        setTeams(prev => prev.filter(t => t.id !== teamId));
    };

    // ── Delete player ─────────────────────────────────────────────────────────
    const deletePlayer = async (teamId, playerId) => {
        if (!confirm("Remove this player?")) return;
        await fetch(`${API}/admin/players/${playerId}`, { method: "DELETE", headers: authHeaders() });
        setTeams(prev => prev.map(t => t.id === teamId
            ? { ...t, players: t.players.filter(p => p.id !== playerId) }
            : t));
    };

    // ── Save player edit ──────────────────────────────────────────────────────
    const savePlayer = async () => {
        if (!editingPlayer) return;
        setSaving(true);
        try {
            const res = await fetch(`${API}/admin/players/${editingPlayer.id}`, {
                method: "PATCH",
                headers: authHeaders(),
                body: JSON.stringify({
                    real_name: editingPlayer.real_name,
                    ign: editingPlayer.ign,
                    ingame_id: editingPlayer.ingame_id,
                }),
            });
            const updated = await res.json();
            setTeams(prev => prev.map(t => ({
                ...t,
                players: t.players.map(p => p.id === updated.id ? updated : p),
            })));
            setEditingPlayer(null);
        } finally { setSaving(false); }
    };

    // ── Save team name edit ───────────────────────────────────────────────────
    const saveTeam = async () => {
        if (!editingTeam) return;
        setSaving(true);
        try {
            const res = await fetch(`${API}/admin/teams/${editingTeam.id}`, {
                method: "PATCH",
                headers: authHeaders(),
                body: JSON.stringify({ team_name: editingTeam.team_name }),
            });
            const updated = await res.json();
            setTeams(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
            setEditingTeam(null);
        } finally { setSaving(false); }
    };

    const handleLogout = () => { localStorage.clear(); window.location.href = "/login"; };

    // ── Derived stats ─────────────────────────────────────────────────────────
    const totalTeams = teams.length;
    const paidTeams = teams.filter(t => t.payment_status === "paid").length;
    const unpaidTeams = totalTeams - paidTeams;
    const totalPlayers = teams.reduce((s, t) => s + (t.players?.length || 0), 0);

    if (loading) {
        return (
            <div className={styles.centered}>
                <span className={styles.spinnerLg} />
                <p>Loading admin dashboard…</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.orb1} /><div className={styles.orb2} />

            {/* ── Sidebar ── */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarLogo}>
                    <img src="/tournament-logo.png" alt="Logo" className={styles.sidebarLogoImg} />
                </div>
                <div className={styles.adminBadge}>Admin Panel</div>
                <nav className={styles.nav}>
                    {[
                        { id: "overview", icon: <LayoutDashboard size={16} />, label: "Overview" },
                        { id: "teams", icon: <Users size={16} />, label: "Teams" },
                        { id: "registration", icon: <ClipboardList size={16} />, label: "Registration" },
                        { id: "results", icon: <Trophy size={16} />, label: "Results" },
                    ].map(item => (
                        <button key={item.id}
                            className={`${styles.navItem} ${activeTab === item.id ? styles.navActive : ""}`}
                            onClick={() => setActiveTab(item.id)}>
                            <span>{item.icon}</span><span>{item.label}</span>
                        </button>
                    ))}
                </nav>
                <button className={styles.logoutBtn} onClick={handleLogout}>
                    <LogOut size={14} /> Logout
                </button>
            </aside>

            {/* ── Main ── */}
            <main className={styles.main}>
                <div className={styles.topBar}>
                    <div>
                        <h1 className={styles.pageTitle}>
                            {activeTab === "overview" && "Overview"}
                            {activeTab === "teams" && "Registered Teams"}
                            {activeTab === "registration" && "Registration Control"}
                            {activeTab === "results" && "Results"}
                        </h1>
                        <p className={styles.pageSubtitle}>Magic Chess Tournament · Admin</p>
                    </div>
                    <div className={`${styles.regStatusPill} ${regOpen ? styles.regOpen : styles.regClosed}`}>
                        {regOpen ? "● Registration Open" : "● Registration Closed"}
                    </div>
                </div>

                {/* OVERVIEW */}
                {activeTab === "overview" && (
                    <div className={styles.grid4}>
                        <StatCard icon={<Users size={20} strokeWidth={1.5} />} value={totalTeams} label="Total Teams" />
                        <StatCard icon={<CheckCircle size={20} strokeWidth={1.5} />} value={paidTeams} label="Paid" accent="cyan" />
                        <StatCard icon={<AlertCircle size={20} strokeWidth={1.5} />} value={unpaidTeams} label="Unpaid" accent="yellow" />
                        <StatCard icon={<Gamepad2 size={20} strokeWidth={1.5} />} value={totalPlayers} label="Total Players" />
                    </div>
                )}

                {/* TEAMS */}
                {activeTab === "teams" && (
                    <div className={styles.teamsSection}>
                        {teams.length === 0 ? (
                            <EmptyState icon={<Users size={32} strokeWidth={1} />} msg="No teams registered yet." />
                        ) : teams.map(team => (
                            <div key={team.id} className={styles.teamCard}>
                                <div className={styles.teamCardHeader}>
                                    {editingTeam?.id === team.id ? (
                                        <input
                                            className={styles.inlineInput}
                                            value={editingTeam.team_name}
                                            onChange={e => setEditingTeam({ ...editingTeam, team_name: e.target.value })}
                                        />
                                    ) : (
                                        <div className={styles.teamCardName}>{team.team_name}</div>
                                    )}
                                    <div className={styles.teamCardActions}>
                                        <span className={`${styles.payBadge} ${team.payment_status === "paid" ? styles.paid : styles.unpaid}`}>
                                            {team.payment_status === "paid" ? "Paid" : "Unpaid"}
                                        </span>
                                        {editingTeam?.id === team.id ? (
                                            <>
                                                <button className={styles.btnSave} onClick={saveTeam} disabled={saving}>Save</button>
                                                <button className={styles.btnCancel} onClick={() => setEditingTeam(null)}>Cancel</button>
                                            </>
                                        ) : (
                                            <button className={styles.btnEdit} onClick={() => setEditingTeam({ id: team.id, team_name: team.team_name })}><Pencil size={13} /> Edit</button>
                                        )}
                                        <button className={styles.btnDelete} onClick={() => deleteTeam(team.id)}><Trash2 size={13} /> Delete</button>
                                    </div>
                                </div>

                                <table className={styles.table}>
                                    <thead>
                                        <tr><th>#</th><th>Real Name</th><th>IGN</th><th>In-Game ID</th><th>Role</th><th>Actions</th></tr>
                                    </thead>
                                    <tbody>
                                        {(team.players || []).map((p, i) => (
                                            <tr key={p.id}>
                                                <td>{i + 1}</td>
                                                {editingPlayer?.id === p.id ? (
                                                    <>
                                                        <td><input className={styles.cellInput} value={editingPlayer.real_name} onChange={e => setEditingPlayer({ ...editingPlayer, real_name: e.target.value })} /></td>
                                                        <td><input className={styles.cellInput} value={editingPlayer.ign} onChange={e => setEditingPlayer({ ...editingPlayer, ign: e.target.value })} /></td>
                                                        <td><input className={styles.cellInput} value={editingPlayer.ingame_id} onChange={e => setEditingPlayer({ ...editingPlayer, ingame_id: e.target.value })} /></td>
                                                        <td>{p.is_captain ? <span className={styles.roleCaptain}>Captain</span> : <span className={styles.roleMember}>Member</span>}</td>
                                                        <td className={styles.actionCell}>
                                                            <button className={styles.btnSave} onClick={savePlayer} disabled={saving}>Save</button>
                                                            <button className={styles.btnCancel} onClick={() => setEditingPlayer(null)}><X size={13} /></button>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td>{p.real_name}</td>
                                                        <td className={styles.ignCell}>{p.ign}</td>
                                                        <td>{p.ingame_id}</td>
                                                        <td>{p.is_captain ? <span className={styles.roleCaptain}>Captain</span> : <span className={styles.roleMember}>Member</span>}</td>
                                                        <td className={styles.actionCell}>
                                                            <button className={styles.btnEdit} onClick={() => setEditingPlayer({ id: p.id, real_name: p.real_name, ign: p.ign, ingame_id: p.ingame_id })}><Pencil size={13} /></button>
                                                            {!p.is_captain && <button className={styles.btnDelete} onClick={() => deletePlayer(team.id, p.id)}><Trash2 size={13} /></button>}
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                )}

                {/* REGISTRATION */}
                {activeTab === "registration" && (
                    <div className={styles.regSection}>
                        <div className={`${styles.regCard} ${regOpen ? styles.regCardOpen : styles.regCardClosed}`}>
                            <div className={styles.regCardIcon}>{regOpen ? <Clipboard size={28} strokeWidth={1.5} /> : <Lock size={28} strokeWidth={1.5} />}</div>
                            <h2 className={styles.regCardTitle}>
                                Registration is currently <span>{regOpen ? "OPEN" : "CLOSED"}</span>
                            </h2>
                            <p className={styles.regCardDesc}>
                                {regOpen
                                    ? "Teams can still sign up. Click below to close registration when you're ready to start the tournament."
                                    : "The registration form is locked. New teams cannot register. Click below to re-open."}
                            </p>
                            <button
                                className={`${styles.toggleBtn} ${regOpen ? styles.toggleClose : styles.toggleOpen}`}
                                onClick={toggleReg}
                                disabled={toggling}
                            >
                                {toggling ? <span className={styles.spinner} /> : (regOpen ? <><Lock size={14} /> Close Registration</> : <><Clipboard size={14} /> Open Registration</>)}
                            </button>
                        </div>
                        <div className={styles.regStats}>
                            <div className={styles.regStatRow}><span>Registered Teams</span><strong>{totalTeams}</strong></div>
                            <div className={styles.regStatRow}><span>Paid</span><strong className={styles.cyanText}>{paidTeams}</strong></div>
                            <div className={styles.regStatRow}><span>Unpaid</span><strong className={styles.yellowText}>{unpaidTeams}</strong></div>
                        </div>
                    </div>
                )}

                {/* RESULTS */}
                {activeTab === "results" && (
                    <EmptyState icon={<Trophy size={32} strokeWidth={1} />} msg="Match results will appear here once the tournament begins." />
                )}
            </main>
        </div>
    );
}

function StatCard({ icon, value, label, accent }) {
    const styles2 = require("./page.module.css");
    return (
        <div className={styles2.default.statCard}>
            <div className={styles2.default.statIcon}>{icon}</div>
            <div className={`${styles2.default.statValue} ${accent === "cyan" ? styles2.default.cyanText : accent === "yellow" ? styles2.default.yellowText : ""}`}>{value}</div>
            <div className={styles2.default.statLabel}>{label}</div>
        </div>
    );
}

function EmptyState({ icon, msg }) {
    const styles2 = require("./page.module.css");
    return (
        <div className={styles2.default.emptyState}>
            <div className={styles2.default.emptyIcon}>{icon}</div>
            <p>{msg}</p>
        </div>
    );
}
