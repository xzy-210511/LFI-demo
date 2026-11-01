import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ResultPanel from './ResultPanel';

const urls = {
  amplitudeImageUrl: 'http://localhost:8080/api/datasets/5/frames/120/amplitude-image',
  phaseImageUrl: 'http://localhost:8080/api/datasets/5/frames/120/phase-image',
  combinedImageUrl: 'http://localhost:8080/api/datasets/5/frames/120/combined-image'
};

describe('ResultPanel', () => {
  it('requests all three views for the same selected frame', () => {
    render(<ResultPanel frame={120} {...urls} />);

    expect(screen.getByAltText('Amplitude frame 120')).toHaveAttribute('src', urls.amplitudeImageUrl);
    expect(screen.getByAltText('Phase frame 120')).toHaveAttribute('src', urls.phaseImageUrl);
    expect(screen.getByAltText('Combined THz frame 120')).toHaveAttribute('src', urls.combinedImageUrl);
  });

  it('replaces a failed image with a message instead of a broken image', () => {
    render(<ResultPanel frame={120} {...urls} />);

    fireEvent.error(screen.getByAltText('Phase frame 120'));

    expect(screen.getByText('Unable to load this image.')).toBeInTheDocument();
    expect(screen.queryByAltText('Phase frame 120')).not.toBeInTheDocument();
  });
});
