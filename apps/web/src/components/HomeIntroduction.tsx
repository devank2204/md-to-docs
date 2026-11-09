import { useContext } from 'react';
import { LandingContext } from '../routes/LandingContext';
/** The incumbent web home is the typography/copy authority for every viewport. */
export function HomeIntroduction() {
  const spec = useContext(LandingContext);
  return (
    <div className="text-center mb-8 max-w-xl mx-auto">
      <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight text-on-surface mb-3 tracking-tight font-medium">
        {spec.h1}
      </h1>
      <p className="font-serif text-base sm:text-lg text-secondary max-w-[560px] mx-auto leading-relaxed">
        {spec.path === '/' ? <>Paste Markdown or drop a file. Diagrams, tables, and formatting convert
        cleanly to Google Docs, Word, and PDF.</> : spec.lead}
      </p>
    </div>
  );
}
