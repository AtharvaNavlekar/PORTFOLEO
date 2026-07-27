import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import HeroSection from '../../components/HeroSection/HeroSection';
import ProjectCard from '../../components/ProjectCard/ProjectCard';
import { projects } from '../../data/projects';
import './Projects.css';

export default function Projects() {
  const sectionRef = useScrollAnimation();

  return (
    <main className="projects" ref={sectionRef}>
      <HeroSection
        title="Work"
        subtitle="SELECTED PROJECTS AND"
        scriptText="experiments"
        className="hero--page"
      />

      <section className="section">
        <div className="container">
          <div className="projects__grid">
            {projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
