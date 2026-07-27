import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import HeroSection from '../../components/HeroSection/HeroSection';
import SectionHeader from '../../components/SectionHeader/SectionHeader';
import ProjectCard from '../../components/ProjectCard/ProjectCard';
import { projects } from '../../data/projects';
import { testimonials } from '../../data/testimonials';
import { personalInfo } from '../../data/socials';
import './Home.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function Home() {
  const featuredProjects = projects.filter((p) => p.featured);
  
  // Parallax for Bridge Section
  const bridgeRef = useRef(null);
  const { scrollYProgress: bridgeScroll } = useScroll({
    target: bridgeRef,
    offset: ['start end', 'end start']
  });
  const bridgeY = useTransform(bridgeScroll, [0, 1], [100, -100]);
  
  // Parallax for Decoding Section
  const decodingRef = useRef(null);
  const { scrollYProgress: decodingScroll } = useScroll({
    target: decodingRef,
    offset: ['start end', 'end start']
  });
  const decodingY = useTransform(decodingScroll, [0, 1], [50, -50]);

  return (
    <main className="home">
      {/* ── Hero ── */}
      <HeroSection
        title={personalInfo.name}
        subtitle="I DESIGN AND BUILD PRODUCTS THAT"
        scriptText="deliver real impact."
        className="hero--home"
        leftBadge={{
          icon: 'IconMapPin',
          title: `BASED IN`,
          sub: personalInfo.location.toUpperCase(),
        }}
        rightBadge={{
          icon: 'IconCode',
          title: personalInfo.role,
          sub: personalInfo.roleSubtitle,
        }}
      />

      {/* ── Venture Showcase ── */}
      <section className="section" id="showcase">
        <div className="container">
          <SectionHeader
            title="Venture"
            scriptText="Showcase"
          />
          <div className="home__project-grid">
            {featuredProjects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ── The Magic Behind ── */}
      <section className="section" id="magic">
        <div className="container">
          <SectionHeader
            title="The Magic"
            scriptText="Behind"
          />
          <motion.div 
            className="home__tech-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {['React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL', 'Figma', 'Git'].map((tech) => (
              <motion.div key={tech} variants={itemVariants} className="home__tech-item">
                <div className="home__tech-icon">
                  <span>{tech.charAt(0)}</span>
                </div>
                <span className="home__tech-name">{tech}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Bridge Section ── */}
      <section className="section home__bridge" id="bridge" ref={bridgeRef}>
        <div className="container">
          <motion.div 
            className="home__bridge-content"
            style={{ y: bridgeY }}
          >
            <h2 className="home__bridge-title">
              Building the bridge between <br />
              <span className="home__bridge-accent">ideas</span> and{' '}
              <span className="home__bridge-accent">technology</span>
            </h2>
          </motion.div>
        </div>
        <div className="home__bridge-glow" aria-hidden="true" />
      </section>

      {/* ── Voices Behind (Testimonials) ── */}
      <section className="section" id="testimonials">
        <div className="container">
          <SectionHeader
            title="The Voices"
            scriptText="Behind"
          />
          <motion.div 
            className="home__testimonials-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {testimonials.map((testimonial) => (
              <motion.div
                key={testimonial.id}
                variants={itemVariants}
                className="home__testimonial"
              >
                <div className="home__testimonial-quote">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" opacity="0.15">
                    <path d="M11.192 15.757c0-.88-.23-1.618-.69-2.217-.326-.412-.768-.683-1.327-.812-.55-.128-1.07-.137-1.54-.028-.16-.95.1-1.956.76-3.022.66-1.065 1.515-1.867 2.558-2.403L9.373 5c-.8.396-1.56.898-2.26 1.505-.71.607-1.34 1.305-1.9 2.094s-.98 1.68-1.25 2.69-.346 2.04-.217 3.1c.168 1.4.62 2.52 1.356 3.35.735.84 1.652 1.26 2.748 1.26.965 0 1.766-.29 2.4-.878.628-.576.94-1.365.94-2.368l.002.004zm9.124 0c0-.88-.23-1.618-.69-2.217-.326-.42-.768-.695-1.327-.825-.55-.13-1.07-.14-1.54-.03-.16-.94.09-1.95.75-3.02.66-1.06 1.514-1.86 2.557-2.4L18.49 5c-.8.396-1.555.898-2.26 1.505-.708.607-1.34 1.305-1.894 2.094-.556.79-.97 1.68-1.24 2.69-.273 1-.345 2.04-.217 3.1.165 1.4.615 2.52 1.35 3.35.732.84 1.648 1.26 2.748 1.26.963 0 1.765-.29 2.4-.878.63-.576.943-1.365.943-2.368l-.004.004z"/>
                  </svg>
                  <p className="home__testimonial-text">{testimonial.quote}</p>
                </div>
                <div className="home__testimonial-author">
                  <div className="home__testimonial-avatar">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="home__testimonial-name">{testimonial.name}</p>
                    <p className="home__testimonial-role">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Decoding Logic ── */}
      <section className="section" id="decoding" ref={decodingRef}>
        <div className="container">
          <SectionHeader
            title="Decoding logic"
            scriptText="&& the lyrics"
          />
          <motion.div 
            className="home__decoding"
            style={{ y: decodingY, opacity: useTransform(decodingScroll, [0, 0.5, 1], [0.3, 1, 0.3]) }}
          >
            <p className="home__decoding-text">
              When I&apos;m not writing code, I&apos;m decoding the meaning behind lyrics,
              exploring new music, or finding inspiration in the intersection of
              art and technology.
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
