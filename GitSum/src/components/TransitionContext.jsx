/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

const TransitionContext = createContext({ direction: 1 });

/**
 * Provider that tracks the navigation depth to determine if the page change
 * is a forward slide (right to left) or backward slide (left to right).
 */
export function TransitionProvider({ children }) {
  const location = useLocation();
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  const [direction, setDirection] = useState(1);

  if (location.pathname !== prevPathname) {
    const getPathDepth = (pathname) => {
      if (pathname === '/') return 0;
      if (pathname.startsWith('/login')) return 1;
      if (pathname.startsWith('/profile')) return 2;
      if (pathname.startsWith('/compare')) return 3;
      return 0;
    };

    const prevDepth = getPathDepth(prevPathname);
    const currentDepth = getPathDepth(location.pathname);

    let nextDirection = direction;
    if (currentDepth < prevDepth) {
      nextDirection = -1;
    } else if (currentDepth > prevDepth) {
      nextDirection = 1;
    }

    setPrevPathname(location.pathname);
    setDirection(nextDirection);
  }

  return (
    <TransitionContext.Provider value={{ direction }}>
      {children}
    </TransitionContext.Provider>
  );
}

TransitionProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useTransitionDirection() {
  return useContext(TransitionContext);
}
