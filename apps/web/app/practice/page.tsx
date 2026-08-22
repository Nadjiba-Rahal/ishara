"use client";

import { useCallback, useEffect, useState } from "react";
import { getSigns } from "../lib/api-client";
import type { Sign } from "../lib/api-client";

type QuizItem = { sign: Sign; options: string[] };

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function PracticePage() {
  const [pool, setPool] = useState<Sign[] | null>(null);
  const [current, setCurrent] = useState<QuizItem | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSigns({ page: 1, pageSize: 50 }).then((result) => {
      setPool(result.items.filter((s) => s.gloss));
      setLoading(false);
    });
  }, []);

  const nextQuestion = useCallback((source: Sign[]) => {
    if (source.length < 2) {
      setCurrent(null);
      return;
    }
    const [target, ...rest] = shuffle(source);
    const distractors = shuffle(rest)
      .slice(0, 3)
      .map((s) => s.gloss as string);
    setCurrent({ sign: target, options: shuffle([target.gloss as string, ...distractors]) });
    setSelected(null);
  }, []);

  useEffect(() => {
    if (pool && pool.length >= 2) nextQuestion(pool);
  }, [pool, nextQuestion]);

  if (loading) {
    return (
      <div className="page-shell">
        <p className="muted">Loading practice questions…</p>
      </div>
    );
  }

  if (!pool || pool.length < 2) {
    return (
      <div className="page-shell">
        <div className="empty-state" role="status">
          <h3>Not enough imported signs to practice yet</h3>
          <p>
            Practice quizzes you on real dictionary entries with a gloss set. Import 3DZSignDB signs with glosses
            to enable this.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="page-header">
        <p className="eyebrow">Practice</p>
        <h1>Quiz yourself</h1>
        <p className="hero-copy">
          Score: {score.correct} / {score.total}
        </p>
      </section>

      {current ? (
        <section className="card">
          <h2>What is the gloss for:</h2>
          <p className="arabic" lang="ar" dir="rtl">
            {current.sign.arabicLabel}
          </p>
          <div className="quiz-options">
            {current.options.map((option) => {
              const isCorrect = option === current.sign.gloss;
              const isChosen = option === selected;
              const shown = selected !== null;
              let className = "quiz-option";
              if (shown && isCorrect) className += " quiz-option-correct";
              if (shown && isChosen && !isCorrect) className += " quiz-option-wrong";
              return (
                <button
                  key={option}
                  type="button"
                  disabled={shown}
                  className={className}
                  onClick={() => {
                    setSelected(option);
                    setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {selected !== null ? (
            <button type="button" onClick={() => nextQuestion(pool)}>
              Next sign →
            </button>
          ) : null}
        </section>
      ) : null}

      <section className="card">
        <h2>Camera-based practice</h2>
        <p className="muted">
          Performing the sign and getting model feedback depends on the recognition pipeline and isn&apos;t
          available in this mode yet. Try the <a href="/translate">translator</a> for live camera recognition.
        </p>
      </section>
    </div>
  );
}
