import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { getSigns } from "../lib/api-client";
import type { SignDto } from "../lib/api-client";
import { colors, shared } from "../lib/styles";
import { StatusBadge } from "../lib/status-badge";

type QuizItem = { sign: SignDto; options: string[] };

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function PracticeScreen() {
  const [pool, setPool] = useState<SignDto[] | null>(null);
  const [current, setCurrent] = useState<QuizItem | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSigns({ pageSize: 50 }).then((result) => {
      setPool(result.items.filter((s) => s.gloss));
      setLoading(false);
    });
  }, []);

  const nextQuestion = useCallback((source: SignDto[]) => {
    if (source.length < 2) {
      setCurrent(null);
      return;
    }
    const [target, ...rest] = shuffle(source);
    const distractors = shuffle(rest).slice(0, 3).map((s) => s.gloss as string);
    setCurrent({ sign: target, options: shuffle([target.gloss as string, ...distractors]) });
    setSelected(null);
  }, []);

  useEffect(() => {
    if (pool && pool.length >= 2) nextQuestion(pool);
  }, [pool, nextQuestion]);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;
  }

  if (!pool || pool.length < 2) {
    return (
      <View style={[shared.screen, shared.content]}>
        <View style={shared.emptyState}>
          <Text style={{ fontWeight: "700", color: colors.ink }}>Not enough imported signs to practice yet</Text>
          <Text style={shared.body}>
            Practice quizzes you on real dictionary entries with a gloss set. Import 3DZSignDB signs with glosses to
            enable this.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.content}>
      <Text style={shared.eyebrow}>Practice</Text>
      <Text style={shared.title}>Quiz yourself</Text>
      <Text style={shared.body}>
        Score: {score.correct} / {score.total}
      </Text>

      {current ? (
        <View style={shared.card}>
          <Text style={{ fontWeight: "700", color: colors.ink }}>What is the gloss for:</Text>
          <Text style={shared.cardTitleAr}>{current.sign.arabicLabel}</Text>
          <View style={{ gap: 8 }}>
            {current.options.map((option) => {
              const isCorrect = option === current.sign.gloss;
              const isChosen = option === selected;
              const shown = selected !== null;
              return (
                <TouchableOpacity
                  key={option}
                  disabled={shown}
                  onPress={() => {
                    setSelected(option);
                    setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
                  }}
                  style={[
                    shared.buttonGhost,
                    shown && isCorrect ? { backgroundColor: "#e2f2e8", borderColor: colors.success } : null,
                    shown && isChosen && !isCorrect ? { backgroundColor: "#fbe3df", borderColor: colors.error } : null
                  ]}
                >
                  <Text style={shared.buttonGhostText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selected !== null ? (
            <TouchableOpacity style={shared.buttonPrimary} onPress={() => nextQuestion(pool)}>
              <Text style={shared.buttonPrimaryText}>Next sign →</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <View style={shared.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontWeight: "700", color: colors.ink }}>Camera-based practice</Text>
          <StatusBadge status="unavailable" />
        </View>
        <Text style={shared.body}>
          Performing the sign and getting model feedback (Phase 12) depends on the recognition pipeline. Not
          available yet.
        </Text>
      </View>
    </ScrollView>
  );
}
