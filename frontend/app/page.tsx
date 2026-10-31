import { Suspense } from "react";
import { connection } from "next/server";
import CoursList from "@/components/CoursList";
import DevOpsLoop from "@/components/DevOpsLoop";
import { getCours } from "@/lib/api";
import { sortBySession } from "@devops2/cours-utils";

// Rendu Ã  la requÃªte (pas au build) : Strapi n'est pas joignable pendant "next build"
async function CoursSection() {
  await connection();
  try {
    const cours = sortBySession(await getCours());
    return <CoursList cours={cours} />;
  } catch (error) {
    return <p className="error">Impossible de joindre Strapi : {String(error)}</p>;
  }
}

export default function Home() {
  return (
    <>
      <nav className="nav">
        <div className="container">
          <a className="brand" href="#">
            <span className="brand-mark">D</span>
            DevOps 2
          </a>
          <ul className="nav-links">
            <li><a href="#cours">Les cours</a></li>
          </ul>
        </div>
      </nav>

      <header className="hero">
        <div className="container">
          <div>
            <div className="eyebrow">Module ECUE733 Â· Site pÃ©dagogique</div>
            <h1>Les cours du module DevOps 2</h1>
            <p className="lead">
              De Git au dÃ©ploiement continu : retrouvez chaque sÃ©ance, sa durÃ©e, son niveau et ses notions clÃ©s.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#cours">Voir les cours</a>
            </div>
            <span className="pill">DevOps 2 Â· TP3</span>
          </div>
          <DevOpsLoop className="loop" />
        </div>
      </header>

      <section id="cours">
        <div className="container">
          <div className="section-head">
            <h2>Les cours</h2>
            <p>Cherchez une notion ou filtrez par niveau.</p>
          </div>
          <Suspense fallback={<p>Chargement des coursâ€¦</p>}>
            <CoursSection />
          </Suspense>
        </div>
      </section>
    </>
  );
}
