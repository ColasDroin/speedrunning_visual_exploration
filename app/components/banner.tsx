import styles from "../styles/banner.module.css";

const Banner = () => {
  return (
    <div className="relative w-full h-full">
      <div
        className={`${styles.background80s} ${styles.animatedclouds} ${styles.stars}`}
      >
        <div className={styles.grid}></div>
        <div className={styles.progressLine}></div>
        <div className={styles.overlay}></div>

        {/* Hero Content Container */}
        <div className={styles.heroContent}>
          {/* Coin on the Left */}
          <div className={styles.coin}></div>

          {/* Text in the Center */}
          <div className={styles.heroText}>
            <div className={`${styles.chrome}`} data-text="SPEEDRUNNING">
              SPEEDRUNNING
            </div>
            <div className={`${styles.outrun} ${styles.glow}`}>
              How a community has kept pushing the limits of gaming
            </div>
          </div>

          {/* Star on the Right */}
          <div className={styles.star}></div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
