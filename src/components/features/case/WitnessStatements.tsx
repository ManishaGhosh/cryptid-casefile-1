import type { WitnessStatement } from '@/types/domain'

/** Witness statements as transcribed interview cards. */
export default function WitnessStatements({ statements }: { statements: WitnessStatement[] }) {
  return (
    <section aria-labelledby="witness-heading">
      <h2 id="witness-heading" className="type-title mb-3 text-off-white/90">
        Witness Statements
      </h2>
      {statements.length === 0 ? (
        <p className="type-label">NO WITNESS STATEMENTS ON FILE</p>
      ) : (
        <ul className="space-y-4">
          {statements.map((s, i) => (
            <li
              key={`${s.witness}-${i}`}
              className="texture-grain rounded-sm border border-gold-dark/30 border-l-4 border-l-gold-dark bg-bureau-dark p-4 sm:p-5"
            >
              <div className="type-label mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-gold-dark/20 pb-2">
                <span className="text-gold/80">TRANSCRIPT — WITNESS {String(i + 1).padStart(2, '0')}</span>
                <span>{s.witness}</span>
              </div>
              <blockquote className="break-words font-serif text-step-heading font-normal italic leading-relaxed text-off-white/90">
                &ldquo;{s.statement}&rdquo;
              </blockquote>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
