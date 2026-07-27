import { motion } from 'framer-motion';
import * as TablerIcons from '@tabler/icons-react';
import './HeroSection.css';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

const badgeVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", delay: 0.8 }
  }
};

export default function HeroSection({
  title,
  subtitle,
  scriptText,
  leftBadge,
  rightBadge,
  className = '',
}) {
  return (
    <section className={`hero ${className}`}>
      {/* Ambient glowing background orb */}
      <motion.div
        className="hero__ambient-glow"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />

      <motion.div
        className="hero__container container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Giant Display Title */}
        <motion.h1 className="hero__title" variants={itemVariants}>
          {title}
        </motion.h1>

        {/* Subtitle (plain text) */}
        {subtitle && (
          <motion.p className="hero__subtitle" variants={itemVariants}>
            {subtitle}
          </motion.p>
        )}

        {/* Script/Cursive accent text */}
        {scriptText && (
          <motion.p className="hero__script font-script" variants={itemVariants}>
            {scriptText}
          </motion.p>
        )}

        {/* Bottom Badges */}
        {(leftBadge || rightBadge) && (
          <motion.div className="hero__badges" variants={badgeVariants} initial="hidden" animate="visible">
            {leftBadge && (
              <div className="hero__badge hero__badge--left">
                <span className="hero__badge-icon">
                  {(() => {
                    const LeftIcon = TablerIcons[leftBadge.icon] || TablerIcons.IconCircle;
                    return <LeftIcon size={20} stroke={1.5} />;
                  })()}
                </span>
                <div className="hero__badge-text">
                  <span className="hero__badge-title">{leftBadge.title}</span>
                  <span className="hero__badge-sub">{leftBadge.sub}</span>
                </div>
              </div>
            )}
            {rightBadge && (
              <div className="hero__badge hero__badge--right">
                <span className="hero__badge-icon">
                  {(() => {
                    const RightIcon = TablerIcons[rightBadge.icon] || TablerIcons.IconCircle;
                    return <RightIcon size={20} stroke={1.5} />;
                  })()}
                </span>
                <div className="hero__badge-text">
                  <span className="hero__badge-title">{rightBadge.title}</span>
                  <span className="hero__badge-sub">{rightBadge.sub}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Decorative grid background */}
      <div className="hero__grid-bg" aria-hidden="true" />
    </section>
  );
}