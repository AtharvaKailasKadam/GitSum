import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useTransitionDirection } from './TransitionContext.jsx';

const variants = {
  initial: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
  }),
  animate: {
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1], // Premium easeOutExpo transition curve
    },
  },
  exit: (direction) => ({
    x: direction > 0 ? '-100%' : '100%',
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

/**
 * Wrapper that applies slide-in / slide-out page transitions.
 * Coordinates with TransitionProvider to determine navigation direction.
 */
export function PageTransition({ children }) {
  const { direction } = useTransitionDirection();

  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {children}
    </motion.div>
  );
}

PageTransition.propTypes = {
  children: PropTypes.node.isRequired,
};
