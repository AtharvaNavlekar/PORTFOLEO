import './SectionHeader.css';

export default function SectionHeader({ title, scriptText, align = 'center' }) {
  return (
    <div className={`section-header section-header--${align} animate-on-scroll`}>
      <h2 className="section-header__title">{title}</h2>
      {scriptText && (
        <p className="section-header__script font-script">{scriptText}</p>
      )}
    </div>
  );
}
