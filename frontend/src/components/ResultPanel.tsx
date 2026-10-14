import { useEffect, useState } from 'react';

interface ResultPanelProps {
  frame: number;
  amplitudeImageUrl: string;
  phaseImageUrl: string;
  combinedImageUrl: string;
}

function ResultImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  if (failed) {
    return <p className="image-error">Unable to load this image.</p>;
  }

  return (
    <div className="result-image-frame">
      {!loaded && <span>Loading image...</span>}
      <img
        className={loaded ? 'loaded' : ''}
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default function ResultPanel({
  frame,
  amplitudeImageUrl,
  phaseImageUrl,
  combinedImageUrl
}: ResultPanelProps) {
  return (
    <section className="panel">
      <div className="panel-heading-row">
        <div>
          <p className="section-kicker">Frame {frame}</p>
          <h2>Image Visualisation</h2>
        </div>
      </div>
      <div className="result-grid">
        <article className="result-card image-result-card">
          <h3>Amplitude Image</h3>
          <ResultImage src={amplitudeImageUrl} alt={`Amplitude frame ${frame}`} />
        </article>
        <article className="result-card image-result-card">
          <h3>Phase Image</h3>
          <ResultImage src={phaseImageUrl} alt={`Phase frame ${frame}`} />
        </article>
        <article className="result-card image-result-card">
          <h3>Combined THz Image</h3>
          <ResultImage src={combinedImageUrl} alt={`Combined THz frame ${frame}`} />
        </article>
      </div>
    </section>
  );
}
