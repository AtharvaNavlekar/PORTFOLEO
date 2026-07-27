import { Link } from 'react-router-dom';
import { socials, personalInfo } from '../../data/socials';
import * as TablerIcons from '@tabler/icons-react';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__card">
          <div className="footer__grid">
            
            {/* Column 1: Brand & Bio */}
            <div className="footer__brand-col">
              <Link to="/" className="footer__brand-logo">
                <span className="footer__logo-text">Atharva</span>
              </Link>
              <p className="footer__bio">
                Building digital experiences that matter, one line of code at a time. Crafting interfaces that feel alive, solving problems that make a difference, and turning ideas into reality. Every pixel has a purpose. Every interaction tells a story.
              </p>
            </div>

            {/* Column 2: General */}
            <div className="footer__nav-col">
              <h4 className="footer__col-title">General</h4>
              <ul className="footer__nav-list">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/blogs">Blogs</Link></li>
                <li><Link to="/guestbook">Guestbook</Link></li>
                <li><Link to="/uses">Uses</Link></li>
              </ul>
            </div>

            {/* Column 3: About */}
            <div className="footer__nav-col">
              <h4 className="footer__col-title">About</h4>
              <ul className="footer__nav-list">
                <li><Link to="/about">About Me</Link></li>
                <li><Link to="/projects">Projects</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>

            {/* Column 4: Startup */}
            <div className="footer__nav-col">
              <h4 className="footer__col-title">Startup</h4>
              <ul className="footer__nav-list">
                <li><Link to="#">Rune</Link></li>
                <li><Link to="#">RuneHub</Link></li>
                <li><Link to="#">RuneLearn</Link></li>
                <li><Link to="#">RuneCareer</Link></li>
                <li><Link to="#">RuneAI</Link></li>
              </ul>
            </div>

            {/* Column 5: Products */}
            <div className="footer__nav-col">
              <h4 className="footer__col-title">Products</h4>
              <ul className="footer__nav-list">
                <li><Link to="#">Wensity</Link></li>
                <li><Link to="#">Wensity UI</Link></li>
              </ul>
            </div>

            {/* Column 6: Legal */}
            <div className="footer__nav-col footer__nav-col--legal">
              <h4 className="footer__col-title">Legal</h4>
              <ul className="footer__nav-list">
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms &amp; Conditions</Link></li>
              </ul>
              
              <div className="footer__dmca">
                <div className="footer__dmca-badge">
                  <span className="dmca-logo">DMCA</span> PROTECTED
                </div>
                <p className="footer__legal-text">
                  This site is protected. Read our <Link to="/privacy">Privacy Policy</Link> &amp; <Link to="/terms">Terms</Link>.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer__bottom">
          <p className="footer__copyright">
            © {currentYear} {personalInfo.fullName.toUpperCase()}. ALL RIGHTS RESERVED.
          </p>
          <div className="footer__socials">
            {socials.map((social) => {
              const iconMap = {
                'github': 'IconBrandGithub',
                'linkedin': 'IconBrandLinkedin',
                'twitter': 'IconBrandX',
                'instagram': 'IconBrandInstagram',
                'telegram': 'IconBrandTelegram',
              };
              const IconComponent = TablerIcons[iconMap[social.icon]] || TablerIcons.IconLink;
              
              return (
                <a
                  key={social.name}
                  href={social.url}
                  className="footer__social-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                >
                  <IconComponent size={20} stroke={1.5} />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
