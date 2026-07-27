import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import HeroSection from '../../components/HeroSection/HeroSection';
import { personalInfo } from '../../data/socials';
import './Contact.css';

export default function Contact() {
  const sectionRef = useScrollAnimation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (form) => {
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const message = form.elements.message.value.trim();

    if (name.length < 2 || name.length > 100) return false;
    if (email.length < 5 || email.length > 254) return false;
    if (message.length < 10 || message.length > 2000) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm(e.target)) {
      alert('Please check your input and try again.');
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
        e.target.reset();
      }, 3000);
    }, 1500);
  };

  return (
    <main className="contact" ref={sectionRef}>
      <HeroSection
        title="Contact"
        subtitle="LET'S BUILD SOMETHING"
        scriptText="extraordinary"
        className="hero--page"
      />

      <section className="section">
        <div className="container container-narrow">
          <div className="contact__content animate-on-scroll">
            
            <div className="contact__info">
              <h2 className="contact__heading">Get in touch</h2>
              <p className="contact__text">
                Whether you have a project in mind, want to discuss a potential collaboration, or just want to say hi, my inbox is always open.
              </p>
              <a href={`mailto:${personalInfo.email}`} className="contact__email">
                {personalInfo.email}
              </a>
            </div>

            <div className="contact__form-wrapper">
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div 
                    key="success"
                    className="contact__success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.4 }}
                  >
                    <motion.svg 
                      width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </motion.svg>
                    <h3>Message Sent!</h3>
                    <p>Thanks for reaching out. I'll get back to you soon.</p>
                  </motion.div>
                ) : (
                  <motion.form 
                    key="form"
                    className="contact__form" 
                    onSubmit={handleSubmit} 
                    noValidate
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="contact__form-group">
                      <label htmlFor="name" className="contact__label">Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="contact__input"
                        required
                        placeholder="John Doe"
                        maxLength={100}
                        minLength={2}
                        autoComplete="name"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="contact__form-group">
                      <label htmlFor="email" className="contact__label">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="contact__input"
                        required
                        placeholder="john@example.com"
                        maxLength={254}
                        autoComplete="email"
                        pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="contact__form-group">
                      <label htmlFor="message" className="contact__label">Message</label>
                      <textarea
                        id="message"
                        name="message"
                        className="contact__input contact__textarea"
                        required
                        placeholder="Tell me about your project..."
                        maxLength={2000}
                        minLength={10}
                        disabled={isSubmitting}
                      ></textarea>
                    </div>
                    <button type="submit" className={`contact__submit ${isSubmitting ? 'contact__submit--loading' : ''}`} disabled={isSubmitting}>
                      <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                      {!isSubmitting && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
            
          </div>
        </div>
      </section>
    </main>
  );
}
