// Modern Portfolio Enhancements
// Smooth scrolling, particle effects, and scroll animations

document.addEventListener('DOMContentLoaded', () => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ===== COMMENTS FROM comment.md =====
    const parseComments = (markdown) => {
        return markdown
            .replace(/\r/g, '')
            .trim()
            .split(/\n\s*\n(?=")/)
            .map((entry) => {
                const attribution = entry.match(/\s+-\s+([^\n]+)\s*$/);
                const author = attribution ? attribution[1].trim() : 'Người bạn ẩn danh';
                let message = attribution ? entry.slice(0, attribution.index) : entry;

                message = message.trim().replace(/^"\s*/, '').replace(/\s*"$/, '').trim();
                return { author, message };
            })
            .filter(({ message }) => message);
    };

    const renderComments = (comments) => {
        const list = document.querySelector('#comments-list');
        const status = document.querySelector('#comments-status');
        if (!list || !status) return;

        list.replaceChildren();
        comments.forEach(({ author, message }) => {
            const article = document.createElement('article');
            article.className = 'comment-card';

            const text = document.createElement('p');
            text.className = 'comment-card__text';
            text.textContent = message;

            const byline = document.createElement('cite');
            byline.className = 'comment-card__author';
            byline.textContent = `— ${author}`;

            article.append(text, byline);
            list.append(article);
        });

        list.setAttribute('aria-busy', 'false');
        status.textContent = `${comments.length} lời nhắn`;
    };

    const loadComments = async () => {
        const list = document.querySelector('#comments-list');
        const status = document.querySelector('#comments-status');
        if (!list || !status) return;

        try {
            const response = await fetch('comment.md');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            renderComments(parseComments(await response.text()));
        } catch (error) {
            list.setAttribute('aria-busy', 'false');
            status.textContent = 'Không thể tải lời nhắn';
            const notice = document.createElement('p');
            notice.className = 'comments-empty';
            notice.textContent = 'Hãy mở trang qua web server để hiển thị nội dung từ comment.md.';
            list.replaceChildren(notice);
        }
    };

    loadComments();

    // ===== SMOOTH SCROLLING WITH EASING =====
    const smoothScrollTo = (targetY, duration) => {
        if (prefersReducedMotion) {
            window.scrollTo({ top: targetY, behavior: 'auto' });
            return;
        }

        const startY = window.pageYOffset;
        const distance = targetY - startY;
        let startTime = null;

        const easeOutCubic = (t) => {
            return 1 - Math.pow(1 - t, 3);
        };

        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const easedProgress = easeOutCubic(progress);
            window.scrollTo(0, startY + distance * easedProgress);

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    };

    // Handle navigation clicks
    document.querySelectorAll('.navbar a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const targetY = targetElement.offsetTop - 80; // Account for navbar height
                    smoothScrollTo(targetY, 800);

                    // Update active link
                    document.querySelectorAll('.navbar a').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            }
        });
    });

    // Update active section on scroll
    const updateActiveNav = () => {
        const scrollPos = window.pageYOffset;

        document.querySelectorAll('section[id]').forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
                const sectionId = section.getAttribute('id');
                document.querySelectorAll('.navbar a').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    };

    // Navbar scroll effect
    const updateNavbarScroll = () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', updateActiveNav);
    window.addEventListener('scroll', updateNavbarScroll);
    updateActiveNav(); // Initial check
    updateNavbarScroll(); // Initial check

    // ===== INTERACTIVE MOUSE-FOLLOWING PARTICLES =====
    const createParticleSystem = () => {
        if (prefersReducedMotion) return; // Skip particles if reduced motion preferred

        // Check if device can handle particles (simple heuristic)
        if (navigator.deviceMemory && navigator.deviceMemory < 2) return;

        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '-1';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Particle class
        class Particle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 3 + 1;
                this.alpha = Math.random() * 0.5 + 0.2;
                this.color = `rgba(255, 0, 64, ${this.alpha})`;
                this.originalSize = this.size;
                this.driftX = Math.random() * 0.2 - 0.1;
                this.driftY = Math.random() * 0.2 - 0.1;
            }

            update(mouseX, mouseY) {
                // Mouse repulsion effect
                const dx = mouseX - this.x;
                const dy = mouseY - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 150) {
                    const force = (150 - distance) / 150;
                    this.vx -= (dx / distance) * force * 0.5;
                    this.vy -= (dy / distance) * force * 0.5;
                }

                // Add drift for natural movement
                this.vx += this.driftX * 0.01;
                this.vy += this.driftY * 0.01;

                // Apply velocity
                this.x += this.vx;
                this.y += this.vy;

                // Boundary wrapping
                if (this.x < -50) this.x = canvas.width + 50;
                if (this.x > canvas.width + 50) this.x = -50;
                if (this.y < -50) this.y = canvas.height + 50;
                if (this.y > canvas.height + 50) this.y = -50;

                // Slow down over time
                this.vx *= 0.98;
                this.vy *= 0.98;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
        }

        // Create particles
        const particles = [];
        const particleCount = Math.min(80, Math.floor(window.innerWidth / 15));

        for (let i = 0; i < particleCount; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            particles.push(new Particle(x, y));
        }

        // Mouse tracking
        let mouseX = canvas.width / 2;
        let mouseY = canvas.height / 2;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(particle => {
                particle.update(mouseX, mouseY);
                particle.draw();
            });

            requestAnimationFrame(animate);
        };

        animate();
    };

    // Initialize particle system
    createParticleSystem();

    // ===== ELEMENT-LEVEL STAGGER ANIMATIONS =====
    const createStaggerAnimations = () => {
        if (prefersReducedMotion) return;

        // Observer options
        const observerOptions = {
            root: null,
            threshold: 0.1,
            rootMargin: '0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Animate children with stagger
                    const children = Array.from(entry.target.children)
                        .filter(child => child.tagName !== 'H1' && child.tagName !== 'H2' && child.tagName !== 'SCRIPT' && child.tagName !== 'DIV' ||
                                      (child.classList && !child.classList.contains('decree-content') && !child.classList.contains('update-item') &&
                                       !child.classList.contains('sidebar-widget') && !child.classList.contains('media-widget'))); // Skip titles and containers

                    children.forEach((child, index) => {
                        // Skip if already animated
                        if (child.classList.contains('animated')) return;

                        const delay = index * 80; // 80ms stagger

                        setTimeout(() => {
                            child.style.opacity = '0';
                            child.style.transform = 'translateY(30px) scale(0.95)';
                            child.style.transition = 'all 0.6s ease-out';

                            // Trigger reflow
                            void child.offsetWidth;

                            child.style.opacity = '1';
                            child.style.transform = 'translateY(0) scale(1)';
                            child.classList.add('animated');
                        }, delay);
                    });

                    // Unobserve after animation
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe sections that should animate
        const sectionsToAnimate = document.querySelectorAll('.central-content > *:not(.mascot-container)');
        sectionsToAnimate.forEach(section => {
            observer.observe(section);

            // Set initial state for children
            const children = Array.from(section.children)
                .filter(child => child.tagName !== 'H1' && child.tagName !== 'H2' && child.tagName !== 'SCRIPT' && child.tagName !== 'DIV' ||
                              (child.classList && !child.classList.contains('decree-content') && !child.classList.contains('update-item') &&
                               !child.classList.contains('sidebar-widget') && !child.classList.contains('media-widget')));
            children.forEach(child => {
                child.style.opacity = '0';
                child.style.transform = 'translateY(30px) scale(0.95)';
                child.style.transition = 'all 0.6s ease-out';
            });
        });

        // Also observe sidebar widgets for animation
        const sidebarSections = document.querySelectorAll('.left-sidebar > .sidebar-widget, .right-sidebar > .sidebar-widget, .right-sidebar > .media-widget');
        sidebarSections.forEach(section => {
            observer.observe(section);

            // Set initial state for children
            const children = Array.from(section.children);
            children.forEach(child => {
                child.style.opacity = '0';
                child.style.transform = 'translateY(30px) scale(0.95)';
                child.style.transition = 'all 0.6s ease-out';
            });
        });
    };

    // Initialize stagger animations
    createStaggerAnimations();

    // Handle window resize for animations
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // Recalculate positions for animations if needed
        }, 250);
    });

    // Add active class to current nav on initial load
    updateActiveNav();
});

// Utility function for debouncing
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}
