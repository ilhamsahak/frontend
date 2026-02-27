"use client";

import { useState, useEffect } from "react";
import {
    LayoutDashboard, Users, Swords, Medal, Trophy,
    CreditCard, Calendar, LogOut, ShieldCheck, Clock
} from "lucide-react";
import styles from "./page.module.css";

const API = "http://localhost:8000";

// ── helpers ───────────────────────────────────────────────────────────────────
function getToken() {
    return typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
}
function getTeamId() {
    return typeof window !== "undefined" ? localStorage.getItem("team_id") : null;
}

export default function DashboardPage() {
    const [team, setTeam] = useState(null);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeSection, setActiveSection] = useState("overview");

    useEffect(() => {
        const token = getToken();
        const teamId = getTeamId();
        if (!token) { window.location.href = "/login"; return; }
        fetchTeam(token, teamId);
    }, []);

    const fetchTeam = async (token, teamId) => {
        try {
            const res = await fetch(`${API}/auth/dashboard/team`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401) { window.location.href = "/login"; return; }
            if (!res.ok) throw new Error("Failed to load team data.");
            const data = await res.json();
            setTeam(data.team);
            setPlayers(data.players || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/login";
    };

    // ── Loading / Error ───────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className={styles.centered}>
                <span className={styles.spinnerLg} />
                <p>Loading your dashboard…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.centered}>
                <p className={styles.errorText}>{error}</p>
                <a href="/login" className={styles.btnPrimary}>Back to Login</a>
            </div>
        );
    }

    const captain = players.find((p) => p.is_captain);

    // ── Mock data (matches/bracket don't exist in DB yet) ─────────────────────
    const matchHistory = []; // will populate when match table is created
    const upcomingMatch = null; // same
    const groupStandings = []; // same

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className={styles.page}>
            {/* Background orbs */}
            <div className={styles.orb1} />
            <div className={styles.orb2} />

            {/* ── Sidebar ── */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarLogo}>
                    <img src="/tournament-logo.png" alt="Logo" className={styles.sidebarLogoImg} />
                </div>

                <nav className={styles.nav}>
                    {[
                        { id: "overview", icon: <LayoutDashboard size={16} />, label: "Overview" },
                        { id: "team", icon: <Users size={16} />, label: "My Team" },
                        { id: "matches", icon: <Swords size={16} />, label: "Matches" },
                        { id: "group", icon: <Medal size={16} />, label: "Group" },
                        { id: "bracket", icon: <Trophy size={16} />, label: "Bracket" },
                    ].map((item) => (
                        <button
                            key={item.id}
                            className={`${styles.navItem} ${activeSection === item.id ? styles.navActive : ""}`}
                            onClick={() => setActiveSection(item.id)}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <button className={styles.logoutBtn} onClick={handleLogout}>
                    <LogOut size={14} /> Logout
                </button>
            </aside>

            {/* ── Main content ── */}
            <main className={styles.main}>
                {/* Top bar */}
                <div className={styles.topBar}>
                    <div>
                        <h1 className={styles.pageTitle}>
                            {activeSection === "overview" && "Dashboard"}
                            {activeSection === "team" && "My Team"}
                            {activeSection === "matches" && "Match History"}
                            {activeSection === "group" && "Group Standings"}
                            {activeSection === "bracket" && "Tournament Bracket"}
                        </h1>
                        <p className={styles.pageSubtitle}>
                            Welcome back, <span className={styles.accentText}>{captain?.real_name || "Captain"}</span>
                        </p>
                    </div>
                    <div className={styles.teamBadge}>
                        <img
                            src={team?.logo_url || "/default-logo.svg"}
                            alt="Team logo"
                            className={styles.teamBadgeImg}
                        />
                        <div>
                            <div className={styles.teamBadgeName}>{team?.team_name}</div>
                            <div className={`${styles.payBadge} ${team?.payment_status === "paid" ? styles.paid : styles.unpaid}`}>
                                {team?.payment_status === "paid" ? "✓ Paid" : "⚠ Unpaid"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── OVERVIEW ── */}
                {activeSection === "overview" && (
                    <div className={styles.grid}>
                        {/* Stat cards */}
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}><Users size={20} strokeWidth={1.5} /></div>
                            <div className={styles.statValue}>{players.length}</div>
                            <div className={styles.statLabel}>Players</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}><Medal size={20} strokeWidth={1.5} /></div>
                            <div className={styles.statValue}>{team?.group_assigned || "—"}</div>
                            <div className={styles.statLabel}>Group</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}><Swords size={20} strokeWidth={1.5} /></div>
                            <div className={styles.statValue}>{matchHistory.length}</div>
                            <div className={styles.statLabel}>Matches Played</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}><CreditCard size={20} strokeWidth={1.5} /></div>
                            <div className={`${styles.statValue} ${team?.payment_status === "paid" ? styles.paidText : styles.unpaidText}`}>
                                {team?.payment_status === "paid" ? "Paid" : "Pending"}
                            </div>
                            <div className={styles.statLabel}>Payment · RM50</div>
                        </div>

                        {/* Team snapshot */}
                        <div className={`${styles.card} ${styles.spanFull}`}>
                            <h2 className={styles.cardTitle}>Team Roster</h2>
                            <div className={styles.rosterGrid}>
                                {players.map((p, i) => (
                                    <div key={i} className={styles.playerChip}>
                                        <div className={`${styles.chipAvatar} ${p.is_captain ? styles.chipCaptain : ""}`}>
                                            {p.is_captain ? "C" : (i + 1)}
                                        </div>
                                        <div>
                                            <div className={styles.chipName}>{p.real_name}</div>
                                            <div className={styles.chipIgn}>{p.ign}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Upcoming match placeholder */}
                        <div className={`${styles.card} ${styles.spanFull}`}>
                            <h2 className={styles.cardTitle}>Upcoming Match</h2>
                            <UpcomingMatchContent match={upcomingMatch} team={team} />
                        </div>
                    </div>
                )}

                {/* ── MY TEAM ── */}
                {activeSection === "team" && (
                    <div className={styles.teamSection}>
                        <div className={styles.teamHero}>
                            <img
                                src={team?.logo_url || "/default-logo.svg"}
                                alt="Team logo"
                                className={styles.teamHeroLogo}
                            />
                            <div>
                                <h2 className={styles.teamHeroName}>{team?.team_name}</h2>
                                <div className={styles.teamMeta}>
                                    <span>Group: <strong>{team?.group_assigned || "TBD"}</strong></span>
                                    <span className={`${styles.payBadge} ${team?.payment_status === "paid" ? styles.paid : styles.unpaid}`}>
                                        {team?.payment_status === "paid" ? "✓ Paid" : "⚠ Unpaid — RM50"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Players ({players.length})</h2>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Real Name</th>
                                        <th>IGN</th>
                                        <th>In-Game ID</th>
                                        <th>Role</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {players.map((p, i) => (
                                        <tr key={i}>
                                            <td>{i + 1}</td>
                                            <td>{p.real_name}</td>
                                            <td className={styles.ignCell}>{p.ign}</td>
                                            <td>{p.ingame_id}</td>
                                            <td>
                                                {p.is_captain
                                                    ? <span className={styles.roleCaptain}>Captain</span>
                                                    : <span className={styles.roleMember}>Member</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── MATCHES ── */}
                {activeSection === "matches" && (
                    <div className={styles.section}>
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Previous Matches</h2>
                            <EmptyState icon={<Swords size={32} strokeWidth={1} />} message="No matches played yet. The tournament hasn't started." />
                        </div>
                    </div>
                )}

                {/* ── GROUP ── */}
                {activeSection === "group" && (
                    <div className={styles.section}>
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>
                                Group {team?.group_assigned || "—"} Standings
                            </h2>
                            {team?.group_assigned ? (
                                <EmptyState icon={<Medal size={32} strokeWidth={1} />} message="Group standings will appear once matches are scheduled." />
                            ) : (
                                <EmptyState icon={<Clock size={32} strokeWidth={1} />} message="Groups haven't been assigned yet. Check back after registration closes." />
                            )}
                        </div>
                    </div>
                )}

                {/* ── BRACKET ── */}
                {activeSection === "bracket" && (
                    <div className={styles.section}>
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Tournament Bracket</h2>
                            <EmptyState icon={<Trophy size={32} strokeWidth={1} />} message="The bracket will be published once the group stage is complete." />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function UpcomingMatchContent({ match, team }) {
    if (!match) {
        return <EmptyState icon={<Calendar size={32} strokeWidth={1} />} message="No upcoming match scheduled yet." />;
    }
    return (
        <div className={styles.matchCard}>
            <div className={styles.matchTeam}>{team?.team_name}</div>
            <div className={styles.matchVs}>VS</div>
            <div className={styles.matchTeam}>{match.opponent}</div>
            <div className={styles.matchTime}>{match.scheduled_time}</div>
        </div>
    );
}

function EmptyState({ icon, message }) {
    return (
        <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>{icon}</div>
            <p>{message}</p>
        </div>
    );
}
