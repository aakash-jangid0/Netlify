import { useSpring, useTransform, MotionValue } from 'framer-motion';

export function useHeaderAnimation(scrollY: MotionValue<number>) {
  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
  const y = useSpring(scrollY, springConfig);
  const headerY = useTransform(y, [0, 200], [0, -50]);
  const headerOpacity = useTransform(y, [0, 100], [1, 0]);

  return { headerY, headerOpacity };
}