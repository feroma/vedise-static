import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initAnimations() {
    const mm = gsap.matchMedia();

    // rispetta "riduci movimento" del sistema operativo
    mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray('.js-fade-in').forEach((el) => {
            gsap.from(el, {
                opacity: 0,
                y: 30,
                duration: 0.8,
                ease: 'power2.out',
                scrollTrigger: { trigger: el, start: 'top 85%' },
            });
        });
    });
}