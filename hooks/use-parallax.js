import {useEffect, useState} from "react";

export const useParallax = () => {
  const [scrolly ,setScrolly] = useState(0);

  useEffect(() => {
      const handleScroll = () => (setScrolly(window.scrollY));

      window.addEventListener('scroll', handleScroll);

      return () => window.removeEventListener('scroll', handleScroll);
  },[])
    return scrolly;
};