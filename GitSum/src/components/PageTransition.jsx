import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8,  transition: { duration: 0.2, ease: 'easeIn' } },
};

/**
 * Wrapper that applies page-transition animation.
 * Used inside <AnimatePresence mode="wait"> in App.jsx.
 */
export function PageTransition({ children }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
}

PageTransition.propTypes = {
  children: PropTypes.node.isRequired,
};
