import './BlogCard.css';

export default function BlogCard({ blog, index = 0 }) {
  const formattedDate = new Date(blog.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article className={`blog-card animate-on-scroll stagger-${(index % 6) + 1}`}>
      <a href={`/blog/${blog.slug}`} className="blog-card__link">
        {/* Image */}
        <div className="blog-card__image">
          <div className="blog-card__image-placeholder">
            <span className="blog-card__category-badge">{blog.category}</span>
          </div>
        </div>

        {/* Content */}
        <div className="blog-card__content">
          <div className="blog-card__meta">
            <time className="blog-card__date" dateTime={blog.date}>{formattedDate}</time>
            <span className="blog-card__dot">·</span>
            <span className="blog-card__read-time">{blog.readTime}</span>
          </div>
          <h3 className="blog-card__title">{blog.title}</h3>
          <p className="blog-card__excerpt">{blog.excerpt}</p>
        </div>

        {/* Read arrow */}
        <div className="blog-card__arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </div>
      </a>
    </article>
  );
}
