import Link from "next/link";
import styles from "./page.module.css";

export const metadata = {
  title: "Magic Chess Automanaged Tournament",
  description:
    "The official registration portal for the Magic Chess Automanaged Tournament. Register your team and compete for glory.",
};

export default function Home() {
  return (
    <div className={styles.heroWrapper}>
      {/* Animated background orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      <main className={styles.hero}>
        {/* Tournament logo */}
        <div className={styles.emblem}>
          <img
            src="/tournament-logo.png"
            alt="Magic Chess Tournament Logo"
            className={styles.emblemImg}
          />
        </div>

        <div className={styles.badge}>Season 2026</div>

        <h1 className={styles.heroTitle}>
          Magic Chess
          <br />
          <span className={styles.heroAccent}>Automanaged</span>
          <br />
          Tournament
        </h1>

        <p className={styles.heroDesc}>
          Assemble your squad, register your team, and rise through the ranks.
          <br />
          The battlefield awaits — are you ready?
        </p>

        <div className={styles.ctas}>
          <Link href="/register" className={styles.ctaPrimary}>
            Register Your Team →
          </Link>
          <a href="#about" className={styles.ctaSecondary}>
            Learn More
          </a>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statNum}>4–10</span>
            <span className={styles.statLabel}>Players / Team</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>Free</span>
            <span className={styles.statLabel}>Entry</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>🏆</span>
            <span className={styles.statLabel}>Grand Prize</span>
          </div>
        </div>
      </main>
    </div>
  );
}
