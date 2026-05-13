import { Link } from 'react-router-dom';

interface StatusCardProps {
  label: string;
  value: string | number;
  helper?: string;
  to?: string;
  accent?: 'blue' | 'green' | 'amber' | 'slate';
}

export default function StatusCard({ label, value, helper, to, accent = 'slate' }: StatusCardProps) {
  const cardContent = (
    <>
      <div className={`status-mark ${accent}`} aria-hidden="true" />
      <p>{label}</p>
      <strong>{value}</strong>
      {helper && <span>{helper}</span>}
      {to && <em>Open</em>}
    </>
  );

  if (to) {
    return (
      <Link className={`status-card clickable ${accent}`} to={to}>
        {cardContent}
      </Link>
    );
  }

  return (
    <section className={`status-card ${accent}`}>
      {cardContent}
    </section>
  );
}
