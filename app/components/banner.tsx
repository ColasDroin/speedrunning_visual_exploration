import styles from "../styles/banner.module.css";

const Banner = () => {
  return (
    <div className="h-full">
      <div
        className={`${styles.background80s} ${styles.animatedclouds} ${styles.stars}`}
      >
        <div className={styles.coin}></div>
        <div className={styles.starWrap}>
          <div className={styles.star}></div>
        </div>
        <div className={styles.grid}></div>
        <div className={styles.progressLine}></div>

        <div className={styles.overlay}></div>

        <div className={styles.text}>
          <div
            className={`${styles.chrome} ${styles.shine}`}
            data-text="SPEEDRUNNING"
          >
            SPEEDRUNNING
          </div>
          <div className={`${styles.outrun} ${styles.glow}`}>
            How a community has pushed the limits of what was thought possible
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
