import { createContext } from 'react';
import { LANDING_ROUTES } from './landingData';
export const LandingContext = createContext(LANDING_ROUTES['/']);
