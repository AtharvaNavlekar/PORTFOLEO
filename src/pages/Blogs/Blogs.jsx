import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import HeroSection from '../../components/HeroSection/HeroSection';
import BlogCard from '../../components/BlogCard/BlogCard';
import { blogs } from '../../data/blogs';
import './Blogs.css';

export default function Blogs() {
  const sectionRef = useScrollAnimation();

  return (
    <main className="blogs" ref={sectionRef}>
      <HeroSection
        title="Writings"
        subtitle="THOUGHTS ON TECH, DESIGN, AND"
        scriptText="everything in between"
        className="hero--page"
      />

      <section className="section">
        <div className="container">
          <div className="blogs__grid">
            {blogs.map((blog, index) => (
              <BlogCard key={blog.id} blog={blog} index={index} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
