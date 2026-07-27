import * as TablerIcons from '@tabler/icons-react';
import './TimelineItem.css';

export default function TimelineItem({ item, index = 0 }) {
  const IconComponent = TablerIcons[item.companyIcon] || TablerIcons.IconCode;
  
  return (
    <div className={`timeline-item animate-on-scroll stagger-${(index % 4) + 1}`}>
      <div className="timeline-item__line">
        <div className={`timeline-item__dot ${item.current ? 'timeline-item__dot--active' : ''}`} />
      </div>
      <div className="timeline-item__content">
        <div className="timeline-item__header">
          <div className="timeline-item__icon">
            <IconComponent size={24} stroke={1.5} />
          </div>
          <div className="timeline-item__meta">
            <span className="timeline-item__company">{item.company}</span>
            <span className="timeline-item__period">{item.period}</span>
          </div>
        </div>
        <h3 className="timeline-item__role">{item.role}</h3>
        <p className="timeline-item__description">{item.description}</p>
        <div className="timeline-item__tags">
          {item.technologies.map((tech) => (
            <span key={tech} className="timeline-item__tag">{tech}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
