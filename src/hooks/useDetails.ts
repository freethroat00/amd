import { useState, useEffect } from 'react';

export const useDetails = () => {
  const [details, setDetails] = useState<boolean>(() => {
    return localStorage.getItem('calendarDetails') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('calendarDetails', String(details));
  }, [details]);

  const toggle = () => setDetails(d => !d);

  return { details, toggle };
};
