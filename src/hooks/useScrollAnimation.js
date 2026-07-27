import { useEffect, useRef } from 'react';

/**
 * Custom hook for scroll-triggered animations using IntersectionObserver.
 * Adds 'visible' class to elements when they enter the viewport.
 *
 * @param {Object} options
 * @param {number} options.threshold - Visibility threshold (0-1)
 * @param {string} options.rootMargin - Root margin for early/late triggering
 * @param {boolean} options.triggerOnce - Only animate once
 */
export function useScrollAnimation({
  threshold = 0.15,
  rootMargin = '0px 0px -60px 0px',
  triggerOnce = true
} = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          } else if (!triggerOnce) {
            entry.target.classList.remove('visible');
          }
        });
      },
      { threshold, rootMargin }
    );

    // Observe all children with .animate-on-scroll class
    const animatedElements = element.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach((el) => observer.observe(el));

    // Also observe the container itself if it has the class
    if (element.classList.contains('animate-on-scroll')) {
      observer.observe(element);
    }

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
      if (element.classList.contains('animate-on-scroll')) {
        observer.unobserve(element);
      }
    };
  }, [threshold, rootMargin, triggerOnce]);

  return ref;
}

/**
 * Hook to animate a single element on scroll.
 */
export function useAnimateOnScroll(options = {}) {
  const ref = useRef(null);
  const { threshold = 0.15, rootMargin = '0px 0px -60px 0px', triggerOnce = true } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add('visible');
          if (triggerOnce) observer.unobserve(element);
        } else if (!triggerOnce) {
          element.classList.remove('visible');
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [threshold, rootMargin, triggerOnce]);

  return ref;
}
