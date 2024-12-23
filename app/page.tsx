import Banner from "./components/banner";
import Fig0 from "./components/fig0";
import Fig1 from "./components/fig1";
import Fig2 from "./components/fig2_alt";
import Fig3 from "./components/fig3";
import Fig4 from "./components/fig4";
import styles from "./styles/banner.module.css";

export default function Home() {
  return (
    <div>
      <div className="h-[30vh]">
        <Banner />
      </div>

      <div className="grid w-full lg:max-w-[80%] 2xl:max-w-[70%] mx-auto sm:max-w-full mt-15">
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
          <p>
            Nowadays, runs are often shared on streaming platforms like Twitch
            or in charity events like <i>Games Done Quick</i>. Speedrunning has
            been around pretty much since the beginning of video games, and
            while a lot of people keep running games on original consoles or PC,
            some also use emulators, which let you play games from older systems
            on newer hardware. This opens up more possibilities, but there are
            rules to make sure it’s still a fair competition.
          </p>
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
            API to better understand the amazing feats of speedrunners. A WORD
            ABOUT THE DATA Since the number of submitted runs easily exceed the
            4M mark, I decided to mainly focus only on the top 50 games with the
            most submissions, only keeping verified runs for full-game
            categories (per-level categories are not considered). Also, the data
            only goes back to 2012, and speedrunning is a practice that has been
            around for much longer... but we have to start somewhere, and
            speedrun.com is nowadays considered the main hub for speedrunning.
          </div>
          <div
            className={`${styles.chrome} ${styles.shine} ${styles.titleDecorated} mt-11 mb-10`}
            data-text="UNDERSTANDING SPEEDRUNNING"
          >
            UNDERSTANDING SPEEDRUNNING
          </div>
          <p>
            Speedrunning has tons of categories, so it’s not always easy to
            follow everything. There’s the popular "Any%" category, where you do
            whatever it takes to finish fast, and "100%" where you aim to do
            everything in the game. Some speedruns are even broken down by
            level, where players focus on beating individual stages as fast as
            they can. With all these different categories, there's something for
            every kind of speedrunner, and it keeps the community fresh and
            competitive. The figure belows illustrate the main categories and
            their rules for for the top 10 games with the most submissions.
          </p>
          <div className="mx-auto">
            <Fig0 />
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
          <div
            className={`${styles.chrome} ${styles.shine} ${styles.titleDecorated} mt-11 mb-10`}
            data-text="GAMES COMMUNITIES"
          >
            GAMES COMMUNITIES
          </div>
          <div className="mx-auto">
            <Fig2 />
          </div>
          <div
            className={`${styles.chrome} ${styles.shine} ${styles.titleDecorated} mt-11 mb-10`}
            data-text="EVOLUTION OF GAME POPULARITY"
          >
            EVOLUTION OF GAME POPULARITY
          </div>
          <div className="mx-auto">
            <Fig3 />
          </div>
          <div
            className={`${styles.chrome} ${styles.shine} ${styles.titleDecorated} mt-11 mb-10`}
            data-text="MOST COMPETITIVE COUNTRIES"
          >
            MOST COMPETITIVE COUNTRIES
          </div>
          <div className="mx-auto">
            <Fig4 />
          </div>
          <div
            className={`${styles.chrome} ${styles.shine} ${styles.titleDecorated} mt-11 mb-10`}
            data-text="ABOUT THIS WORK"
          >
            ABOUT THIS WORK
          </div>
          COLOR SCRAPPED FROM https://github.com/sshaw/national_colors
        </div>
      </div>
    </div>
  );
}
