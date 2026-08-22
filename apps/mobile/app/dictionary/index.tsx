import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, TextInput, View } from "react-native";
import { getCategories, getSigns } from "../../lib/api-client";
import type { CategoryDto, SignDto } from "../../lib/api-client";
import { colors, shared } from "../../lib/styles";

export default function DictionaryScreen() {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [signs, setSigns] = useState<SignDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback((q: string) => {
    setIsLoading(true);
    Promise.all([getCategories(), getSigns({ q: q || undefined, pageSize: 30 })]).then(
      ([categoryResult, signResult]) => {
        setCategories(categoryResult);
        setSigns(signResult.items);
        setTotalCount(signResult.totalCount);
        setIsLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  return (
    <View style={shared.screen}>
      <View style={{ padding: 20, gap: 12 }}>
        <Text style={shared.eyebrow}>ALSL dictionary</Text>
        <Text style={shared.title}>Sign dictionary</Text>
        <View>
          <Text style={shared.label}>Search</Text>
          <TextInput
            style={shared.input}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => load(query)}
            placeholder="Arabic label or gloss"
            returnKeyType="search"
          />
        </View>
        <Text style={shared.body}>
          {totalCount} record{totalCount === 1 ? "" : "s"} · {categories.length} categories
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
      ) : signs.length === 0 ? (
        <View style={{ paddingHorizontal: 20 }}>
          <View style={shared.emptyState}>
            <Text style={{ fontWeight: "700", color: colors.ink }}>No signs found</Text>
            <Text style={shared.body}>
              {query
                ? "No entries match this search yet."
                : "The dictionary is empty until a lawful 3DZSignDB import is performed against the backend."}
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={signs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          renderItem={({ item }) => (
            <Link href={`/dictionary/${item.id}`} asChild>
              <View style={shared.card}>
                <Text style={shared.cardTitleAr}>{item.arabicLabel}</Text>
                {item.gloss ? <Text style={shared.cardSubtitle}>{item.gloss}</Text> : null}
                <Text style={shared.cardSubtitle}>{item.category ?? "Uncategorized"}</Text>
              </View>
            </Link>
          )}
        />
      )}
    </View>
  );
}
