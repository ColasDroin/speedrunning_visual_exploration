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
            data-text="SPEEDRUN"
          >
            SPEEDRUN<span className={styles.spark}></span>
          </div>
          <div className={`${styles.outrun} ${styles.glow}`}>
            A DATA VIZ STORY
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
