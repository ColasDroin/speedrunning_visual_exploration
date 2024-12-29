"use client";
import { useEffect, useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTwitter,
  faMastodon,
  faFacebook,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";
import Banner from "./components/banner";
import Fig0 from "./components/fig0";
import Fig0bis from "./components/fig0bis";
import Fig05 from "./components/fig05";
import Fig1 from "./components/fig1";
import Fig2 from "./components/fig2";
import Fig3 from "./components/fig3";
import Fig4 from "./components/fig4";
import styles from "./styles/banner.module.css";
import Image from "next/image";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

export default function Home() {
  const [showSafariDisclaimer, setShowSafariDisclaimer] = useState(false);

  function isSafari() {
    if (typeof navigator === "undefined") return false; // SSR safety
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes("safari") && !ua.includes("chrome");
  }
  const safari = isSafari();
  useEffect(() => {
    if (safari) {
      setShowSafariDisclaimer(true);
    }
  }, []);

  const stableFig1 = useMemo(() => <Fig1 />, []);

  return (
    <div>
      <div className="lg:h-[25vh] md:h-[20vw] sm:h-[18vh]">
        <Banner />
      </div>

      <div className="container mx-auto px-4 overflow-x-hidden">
        <div className="grid mx-auto px-4 sm:px-6 lg:px-8 mt-9">
          {showSafariDisclaimer && (
            <div className="mt-5 border border-yellow-600 rounded-lg p-5 text-center break-words w-full max-w-5xl mx-auto">
              <strong>Performance Notice:</strong> You are using Safari. For the
              best experience, we recommend using a Chromium-based browser
              (Chrome, Edge, etc.) or Firefox.
            </div>
          )}
          <div
            className={`${styles.chrome}  ${styles.titleDecorated} mt-11 mb-5`}
          >
            INTRODUCTION
          </div>
          <div className="mx-auto max-w-5xl">
            Speedrunning is the art of completing a video game as quickly as
            possible, often using optimized strategies, glitches, and
            exceptional skill to achieve record-breaking times. Speedrunning
            isn’t just about rushing through a game; it’s a challenge against
            the clock, the game, and even the boundaries of what’s thought
            possible. It’s about deep mastery, creative problem-solving, and
            innovation, all within the context of beloved video games.
          </div>
          <figure className="flex flex-col items-center m-9 ">
            <div
              className="relative w-full max-w-[800px] h-auto"
              style={{
                aspectRatio: "16 / 10",
              }}
            >
              <Image
                src={`${process.env.NEXT_PUBLIC_BASE_PATH_ASSETS}/images/speedrun_mario.gif`}
                alt="Speedrun Mario"
                fill
                style={{ objectFit: "contain" }}
                className="rounded-lg shadow-md"
                priority
              />
            </div>
            <figcaption className="mt-2 text-center text-sm ">
              Speedrunning takes practice, precision, and passion.
            </figcaption>
          </figure>

          <p className="max-w-5xl mx-auto">
            In today’s world, speedrunning thrives on streaming platforms like{" "}
            <a
              href="https://www.twitch.tv"
              target="_blank"
              rel="noopener noreferrer"
            >
              Twitch
            </a>{" "}
            or events like{" "}
            <a
              href="https://gamesdonequick.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Games Done Quick
            </a>
            . These events raise millions for charity while showcasing
            incredible gaming feats. Speedrunning has evolved from playing on
            original consoles or PCs to using emulators that enable retro gaming
            on modern systems. While this expands accessibility, strict rules
            ensure fair competition.
          </p>

          <figure className="flex flex-col items-center m-9">
            <a
              href="https://www.speedrun.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div
                className="relative w-full max-w-[500px] max-h-[100px] h-auto"
                style={{
                  aspectRatio: "16 / 10",
                }}
              >
                {" "}
                <Image
                  src={`${process.env.NEXT_PUBLIC_BASE_PATH_ASSETS}/images/speedrun_com.png`}
                  alt="Speedrun.com"
                  fill
                  style={{ objectFit: "contain" }}
                  className="rounded-lg shadow-md"
                  priority
                />
              </div>

              <figcaption className="mt-0 text-center text-sm ">
                speedrun.com, the ultimate hub for the speedrunning community.
              </figcaption>
            </a>
          </figure>

          <div className="mx-auto mt-2 max-w-5xl">
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
            API to uncover the amazing feats of speedrunners.
            <div className="mt-5 border border-amber-600 rounded-lg p-5 text-center break-words w-full max-w-5xl mx-auto">
              <strong>Data disclaimer:</strong> This analysis focuses mostly on
              the top 50 games (according to their submissions count), only
              considering verified runs for full-game categories. Unfortunately,
              the dataset only goes up to November 2023. While it misses
              speedrunning’s earlier history, it highlights key trends from
              recent years. I plan to scrape and update the data in the future
              to provide a more recent and comprehensive view.
            </div>
          </div>
          <div
            className={`${styles.chrome}  ${styles.titleDecorated} mt-11 mb-10`}
          >
            UNDERSTANDING SPEEDRUNNING
          </div>
          <p className="max-w-5xl mx-auto">
            Speedrunning is incredibly diverse, with categories for every type
            of player and game. Each game has its own set of rules and
            categories that challenge runners in unique ways. Two popular
            category types include:
          </p>
          <ul className="list-disc list-inside max-w-5xl mx-auto">
            <li className="mt-2">
              <strong>Any%</strong> The goal is to finish the game as fast as
              possible, using any tricks, skips, or glitches allowed.
            </li>
            <li className="mt-2">
              <strong>100%</strong> Players must complete every task or collect
              every item, making it a more comprehensive and often lengthier
              challenge.
            </li>
          </ul>

          <p className="max-w-5xl mx-auto mt-5">
            Below are two examples of category trees, showcasing how games
            differ in structure and speedrunning possibilities. Hover over the
            nodes to see the rules of the corresponding category (if they are
            defined on speedrun.com).
          </p>

          <div className="mx-auto w-full mt-5">
            <p className="max-w-5xl mx-auto mb-9">
              In <strong>Minecraft: Java Edition</strong>, the tree has a
              relatively simple shape, as the game is not divided into levels.
              Its categories focus on goals like defeating the Ender Dragon as
              fast as possible. Since there are no per-level runs, the tree is
              straightforward compared to other games.
            </p>
            <Fig0bis />
          </div>

          <div className="mx-auto w-full mt-5">
            <p className="max-w-5xl mx-auto mb-9">
              In contrast, <strong>Portal</strong> has a much more complex
              category tree. The game features both full-game and per-level
              categories, which greatly expand its scope for speedrunners. While
              per-level runs offer fascinating insights into specific parts of
              the game, they were excluded from this analysis due to the sheer
              volume of data they would introduce.
            </p>
            <Fig0 />
          </div>

          <p className="max-w-5xl mx-auto mt-5">
            These examples highlight the endless variety of speedrunning
            category trees, as every game presents unique challenges, rules, and
            opportunities for creativity. Whether a game is open-ended like
            Minecraft or structured like Portal, the diversity in speedrunning
            reflects the ingenuity of its community.
          </p>
          <div
            className={`${styles.chrome}  ${styles.titleDecorated} mt-11 mb-10`}
          >
            THE MOST SPEEDRUNNED GAMES
          </div>
          <p className="max-w-5xl mx-auto mb-5">
            Speedrunning popularity varies across games, with some titles
            standing out for their active communities and high submission
            counts. These games often feature unique mechanics, competitive
            leaderboards, or nostalgia that drives runners to perfect their
            craft.
          </p>
          <div className="mx-auto w-full mt-9 mb-9 lg:max-w-[80%]">
            <Fig05 />
          </div>
          <p className="max-w-5xl mx-auto">
            Above, a scatter plot of 100% runs in{" "}
            <strong>The Legend of Zelda: Breath of the Wild (BotW)</strong>{" "}
            shows how run times have evolved over time. Each point represents a
            completed run, with faster times indicating significant
            breakthroughs, new strategies, or the discovery of game-breaking
            glitches.
          </p>

          <div className="mx-auto max-w-5xl mt-5 mb-5">
            <p className="max-w-5xl mx-auto">
              The figure below is an interactive visualization that allows you
              to explore the dataset of runs by game and category in depth. Have
              a try!
            </p>
          </div>
          <div className="mx-auto w-full lg:max-w-[80%] mt-5 mb-5">
            {stableFig1}
          </div>
          <div
            className={`${styles.chrome} ${styles.titleDecorated} mt-9 mb-9`}
          >
            GAMES COMMUNITIES
          </div>
          <p className="max-w-5xl mx-auto">
            Speedrunning is more than an individual pursuit—it thrives on
            collaboration, shared knowledge, and competition. Communities form
            around specific games, helping runners discover tricks, refine
            strategies, and improve their times.
          </p>
          <div className="mx-auto w-full mt-5 mb-5">
            <Fig2 />
          </div>
          <p className="max-w-5xl mx-auto">
            The network graph above shows connections between the top 50 games,
            grouped by clusters. These clusters were identified using a{" "}
            <a
              href="https://en.wikipedia.org/wiki/Modularity_(networks)"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600"
            >
              greedy modularity algorithm
            </a>
            , which detects closely linked communities. Nodes represent games,
            while edges indicate shared runners. The thicker the edge, the more
            players have submitted runs for both games.
          </p>
          <div
            className={`${styles.chrome}  ${styles.titleDecorated} mt-9 mb-9`}
          >
            EVOLUTION OF GAME POPULARITY
          </div>
          <p className="max-w-5xl mx-auto">
            Speedrunning trends change over time, influenced by new releases,
            rediscovered classics, or viral moments on streaming platforms. The
            river plot below illustrates the monthly submission trends for the
            top 10 games in terms of run counts.
          </p>
          <div className="mx-auto w-full mt-5 mb-5">
            <Fig3 />
          </div>
          <p className="max-w-5xl mx-auto">
            Each stream represents a game, with its width corresponding to the
            number of runs submitted that month. Notice how certain titles surge
            during specific periods, often tied to cultural events, game
            updates, or charity marathons like{" "}
            <a
              href="https://gamesdonequick.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Games Done Quick
            </a>
            .
          </p>
          <div
            className={`${styles.chrome}  ${styles.titleDecorated} mt-9 mb-9`}
          >
            MOST COMPETITIVE COUNTRIES
          </div>
          <p className="max-w-5xl mx-auto">
            Speedrunning is a global phenomenon, with players from around the
            world competing for top times. But which countries are the most
            competitive? To answer this question, we created a scoring system
            based on the positions of runners on the leaderboards.
          </p>
          <p className="max-w-5xl mx-auto">
            For each run, the position of the runner at the time of submission
            determines the score they contribute to their country. The scoring
            system assigns points as follows:
          </p>
          <div className="max-w-5xl mx-auto text-center mt-4 mb-4">
            <BlockMath
              math={`\\begin{array}{|c|c|}
              \\hline
              \\text{Position} & \\text{Points} \\\\
              \\hline
              1^{\\text{st}} & 10 \\\\
              2^{\\text{nd}} & 5 \\\\
              3^{\\text{rd}} & 3 \\\\
              4^{\\text{th}} & 2 \\\\
              5^{\\text{th}} & 1 \\\\
              \\hline
              \\end{array}`}
            />
          </div>
          <p className="max-w-5xl mx-auto">
            Scores are calculated monthly and summed across all games to give
            each country a total score. The scoring system can be formalized as:
          </p>
          <div className="max-w-5xl mx-auto text-center mt-4 mb-4">
            <BlockMath
              math={`S_c = \\sum_{g \\in G} \\sum_{r \\in R_g} \\text{points}(r)`}
            />
          </div>
          <p className="max-w-5xl mx-auto">Where:</p>
          <ul className="list-disc list-inside max-w-5xl mx-auto">
            <li>
              <strong>
                <InlineMath math="S_c" />:
              </strong>{" "}
              Total score for country <InlineMath math="c" />.
            </li>
            <li>
              <strong>
                <InlineMath math="G" />:
              </strong>{" "}
              The set of all games.
            </li>
            <li>
              <strong>
                <InlineMath math="R_g" />:
              </strong>{" "}
              The set of runners from country <InlineMath math="c" /> for game{" "}
              <InlineMath math="g" />.
            </li>
            <li>
              <strong>
                <InlineMath math="\text{points}(r)" />:
              </strong>{" "}
              A function mapping the position of runner <InlineMath math="r" />{" "}
              to a score, based on their position.
            </li>
          </ul>

          <p className="max-w-5xl mx-auto mt-5">
            The animated bar race below visualizes how country scores evolve
            over time, highlighting key shifts in competitiveness. Afterward,
            the colored world map shows the cumulative scores as of November
            2023, revealing which countries dominate the global speedrunning
            scene.
          </p>

          <div className="mx-auto w-full mt-5 mb-5 lg:max-w-[80%]">
            <Fig4 />
          </div>
          <p className="max-w-5xl mx-auto">
            Unsurprisingly, countries with larger player bases, such as the
            United States or Japan tend to score highly. However, smaller
            countries like Canada or the UK, with passionate communities, often
            punch above their weight, making the competition even more exciting!
          </p>

          <div
            className={`${styles.chrome}  ${styles.titleDecorated} mt-9 mb-9`}
          >
            ABOUT THIS WORK
          </div>

          <div className="mt-9 bg-gray-100 border border-gray-300 rounded-lg p-5 flex max-w-2xl mx-auto w-full">
            <div className="flex-shrink-0 mr-5">
              <img
                src="images/my_photo.jpg"
                alt="Picture of Colas"
                className="w-36 h-36 rounded-full border border-gray-300 object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold">Hi there, I'm Colas!</h2>
              <p className="mt-2 text-gray-700">
                I'm transitioning from academia to pursue my passion for data
                visualization. This is my first project, and I’m excited to
                share it with you! Your support means everything, whether it’s
                through a donation, sharing my work, or spreading the word.
              </p>
              <div className="mt-4">
                <a
                  href="https://buymeacoffee.com/colasdroin"
                  target="_blank"
                  className="bg-yellow-400 text-black py-2 px-4 rounded-md font-semibold"
                >
                  Buy Me a Coffee
                </a>
              </div>
              <div className="flex space-x-3 mt-4">
                <a
                  href="https://twitter.com/intent/tweet?text=Check+out+Colas%27+amazing+data+viz+work!&url=https://colasdroin.github.io/speedrunning_visual_exploration/"
                  target="_blank"
                  className="text-gray-700 hover:text-gray-900"
                >
                  <FontAwesomeIcon icon={faTwitter} size="lg" />
                </a>
                <a
                  href="https://mastodon.social/share?text=Check+out+Colas%27+amazing+data+viz+work!&url=https://colasdroin.github.io/speedrunning_visual_exploration/"
                  target="_blank"
                  className="text-gray-700 hover:text-gray-900"
                >
                  <FontAwesomeIcon icon={faMastodon} size="lg" />
                </a>
                <a
                  href="https://www.facebook.com/sharer/sharer.php?u=https://colasdroin.github.io/speedrunning_visual_exploration/"
                  target="_blank"
                  className="text-gray-700 hover:text-gray-900"
                >
                  <FontAwesomeIcon icon={faFacebook} size="lg" />
                </a>
                <a
                  href="https://www.linkedin.com/shareArticle?mini=true&url=https://colasdroin.github.io/speedrunning_visual_exploration/&title=Check+out+Colas%27+data+visualization+work!"
                  target="_blank"
                  className="text-gray-700 hover:text-gray-900"
                >
                  <FontAwesomeIcon icon={faLinkedin} size="lg" />
                </a>
              </div>
              <div className="mt-4">
                <a
                  href="https://www.linkedin.com/in/colas-droin/"
                  target="_blank"
                  className="text-blue-600 font-semibold"
                >
                  Connect with me on LinkedIn
                </a>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-9 mb-9 bg-gray-200 border border-gray-300 rounded-lg p-5 max-w-2xl mx-auto w-full">
            <p className="text-sm text-gray-600">
              <strong>Disclaimer:</strong> All trademarks, logos, and images
              displayed on this website are the property of their respective
              owners. They are used here for informational purposes and to
              facilitate a better experience for visitors. This website is not
              affiliated with, endorsed, sponsored, or specifically approved by
              any video game company or its licensors. All data, including
              images, has been sourced from the public API of{" "}
              <a
                href="https://www.speedrun.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600"
              >
                speedrun.com
              </a>
              . If you are a copyright or trademark owner and believe your
              material has been used in an unauthorized way, please contact me
              immediately and and I will address the issue promptly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
