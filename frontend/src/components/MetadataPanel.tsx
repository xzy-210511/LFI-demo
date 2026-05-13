import type { MetadataItem } from '../types/dataset';

interface MetadataPanelProps {
  metadata: MetadataItem[];
}

export default function MetadataPanel({ metadata }: MetadataPanelProps) {
  return (
    <section className="panel">
      <h2>Metadata</h2>
      <dl className="metadata-grid">
        {metadata.map((item) => (
          <div key={item.key}>
            <dt>{item.key}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
