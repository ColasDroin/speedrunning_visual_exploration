import Banner from "./components/banner";
import Fig1 from "./components/fig1";
import styles from "./styles/banner.module.css";

export default function Home() {
  return (
    <div>
      <div className="h-[30vh]">
        <Banner />
      </div>

      <div className="grid w-full lg:max-w-[70%] 2xl:max-w-[65%] mx-auto sm:max-w-full mt-15">
        <div className="grid-cols-1">
          <div
            className={`${styles.chrome} ${styles.shine} ${styles.titleDecorated} mt-11 mb-5`}
            data-text="INTRODUCTION"
          >
            INTRODUCTION
          </div>
          <div className="mx-auto">
            Speedrunning is the art of completing a video game as quickly as
            possible, often using optimized strategies, glitches, and
            exceptional skill to achieve record-breaking times. But speedrunning
            is more than just rushing a game: it’s a battle against the clock,
            against the game, and sometimes, against the limits of what was
            thought possible. It’s about taking a game you love, learning its
            every nuance, and pushing it to its absolute breaking point.
          </div>

          <div className="mx-auto mt-2">
            Let&apos;s analyze some data gathered from the{" "}
            <span className={`${styles.subtleGlow}`}>
              <a
                href="https://www.speedrun.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                speedrun.com
              </a>
            </span>{" "}
            API to better understand the amazing feats of speedrunners.
          </div>
          <div
            className={`${styles.chrome} ${styles.shine} ${styles.titleDecorated} mt-11 mb-10`}
            data-text="THE MOST SPEEDRUNNED GAMES"
          >
            THE MOST SPEEDRUNNED GAMES
          </div>

          <div className="mx-auto">
            <Fig1 />
          </div>
        </div>
      </div>
    </div>
  );
}
