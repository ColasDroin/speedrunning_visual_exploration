import styles from '../styles/banner.module.css'

const Banner = () => {
    return (
        <div className={`${styles.background80s} ${styles.animatedClouds} ${styles.stars}`}>
            <div className={styles.sun}></div>
            <div className={styles.grid}></div>
            <div className={styles.mountain}></div>
            <div className={styles.mountain} style={{ '--mountain-base': '10vw', '--mountain-height': '5vw', '--mountain-color1': '#a684cb', '--mountain-color2': '#681e6b', '--mountain-tilt': '59deg', '--mountain-offset': '20vw' }}></div>
            {/* Repeat for other mountains */}
            <div className={styles.roadOff}></div>
            <div className={styles.overlay}></div>

            <div className={styles.text}>
                <div className={`${styles.outrun} ${styles.glow}`}>OUTRUN</div>
                <div className={`${styles.chrome} ${styles.shine}`} data-text="80'S RETRO">
                    80<span className={styles.spark}></span>S RETRO
                </div>
                <div className={`${styles.chrome} ${styles.shine}`} data-text="DESIGN" style={{ '--shine-delay': '1s' }}>
                    DESIGN<span className={`${styles.spark} ${styles.sparkOffset}`}></span>
                </div>
            </div>

            <svg width="0" height="0">
                <filter id="filter">
                    <feTurbulence type="fractalNoise" baseFrequency=".01" numOctaves="10" id="fractalNoise" />
                    <feDisplacementMap id="displacementMap" in="SourceGraphic" scale="120" />
                </filter>
                <animate xlinkHref="#displacementMap" id="animclouds1" begin="0; animclouds2.end" attributeName="scale" from="50" to="180" dur="3s" fill="freeze" />
                <animate xlinkHref="#displacementMap" id="animclouds2" begin="animclouds1.end" attributeName="scale" from="180" to="50" dur="3s" fill="freeze" />
                <animate xlinkHref="#fractalNoise" id="animclouds3" begin="0;animclouds4.end" attributeName="baseFrequency" from="0.03" to="0.01" dur="30s" fill="freeze" />
                <animate xlinkHref="#fractalNoise" id="animclouds4" begin="animclouds3.end" attributeName="baseFrequency" from="0.01" to="0.03" dur="30s" fill="freeze" />
            </svg>
        </div>
    );
};

export default Banner;