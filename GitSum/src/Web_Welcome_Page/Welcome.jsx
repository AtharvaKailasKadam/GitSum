import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import FloatingMarks from './FloatingMarks';
import logo from '../assets/logo.png';
import './Welcome.css';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};



export const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-overlay">
      <FloatingMarks count={12} />

      <div className="welcome-background">
        <motion.div
          className="welcome-container"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo */}
          <motion.div className="welcome-logo-container" variants={itemVariants}>
            <img className="welcome-logo" src={logo} alt="GitSum logo" />
          </motion.div>

          {/* Heading */}
          <motion.h1 className="welcome-hero-title" variants={itemVariants}>
            Visualize Your GitHub<br />
            <span className="welcome-hero-accent comic-font">GitSum</span>
          </motion.h1>

          {/* Value prop */}
          <motion.p className="welcome-description" variants={itemVariants}>
            Explore stats, languages, repos, and coding habits — in seconds.
          </motion.p>
          <motion.p className="welcome-instruction" variants={itemVariants}>
            Powered by the GitHub API with a secure server-side proxy.
            No account required.
          </motion.p>

          {/* Primary CTA */}
          <motion.div variants={itemVariants}>
            <motion.button
              className="get-started-button"
              onClick={() => navigate('/login')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              aria-label="Get started with GitSum"
            >
              Get Started →
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
