import { motion } from 'framer-motion';
import HeroSection from '../../components/HeroSection/HeroSection';
import TimelineItem from '../../components/TimelineItem/TimelineItem';
import { experience } from '../../data/experience';
import { personalInfo } from '../../data/socials';
import './About.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } }
};

export default function About() {
  return (
    <main className="about">
      <HeroSection
        title="About"
        subtitle="THE STORY BEHIND THE PIXELS"
        scriptText="&& the code"
        className="hero--page"
      />

      <section className="section">
        <div className="container container-narrow">
          <motion.div 
            className="about__content"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.h2 variants={itemVariants} className="about__heading">Who I am</motion.h2>
            <motion.div variants={itemVariants} className="about__text">
              <p>
                {personalInfo.bio}
              </p>
              <p>
                My journey started with a fascination for how things work on the web. Over the years, I've transitioned from building simple static sites to architecting complex, scalable web applications that serve real users.
              </p>
              <p>
                I believe in a "design-first, build-solid" approach. A great product isn't just about flawless code; it's about the experience it delivers. That's why I focus equally on the frontend aesthetics and the backend robust architecture.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="container container-narrow">
          <motion.div 
            className="about__content"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <motion.h2 variants={itemVariants} className="about__heading">Experience</motion.h2>
            <div className="about__timeline">
              {experience.map((item, index) => (
                <motion.div key={item.id} variants={itemVariants}>
                  <TimelineItem item={item} index={index} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
