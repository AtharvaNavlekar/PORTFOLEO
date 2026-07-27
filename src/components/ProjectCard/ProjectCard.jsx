import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import './ProjectCard.css';

export default function ProjectCard({ project, index = 0 }) {
  const cardRef = useScrollAnimation({
    threshold: 0.2,
    rootMargin: '50px'
  });
  
  // Bento Box Layout Pattern
  const bentoPattern = [
    'bento-card--large',
    'bento-card--tall',
    'bento-card--normal',
    'bento-card--wide',
    'bento-card--tall',
    'bento-card--wide'
  ];
  
  const bentoClass = bentoPattern[index % bentoPattern.length];

  return (
    <div 
      className={`project-card ${bentoClass}`}
      ref={cardRef}
    >
      <div className="project-card__border" style={{ background: `var(--gradient-${project.gradient || 'purple'})` }} />
      <div className="project-card__inner">
        <div className="project-card__image-wrapper">
          <div className="project-card__image-placeholder">
            {project.image ? (
              <img 
                src={project.image} 
                alt={project.title} 
                className="project-card__image"
              />
            ) : (
              <span className="project-card__image-icon">{project.title.charAt(0)}</span>
            )}
          </div>
          <div className="project-card__overlay">
            <a href={project.link} target="_blank" rel="noopener noreferrer" className="btn btn--primary">
              View Live
            </a>
            <a href={project.github} target="_blank" rel="noopener noreferrer" className="btn btn--outline">
              Source Code
            </a>
          </div>
        </div>
        
        <div className="project-card__content">
          <div className="project-card__info">
            <h3 className="project-card__title">{project.title}</h3>
            {project.subtitle && <p className="project-card__subtitle">{project.subtitle}</p>}
            <p className="project-card__description">{project.description}</p>
            
            <div className="project-card__tags">
              {(project.tags || []).map((tech, i) => (
                <span key={i} className="project-card__tag">{tech}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
