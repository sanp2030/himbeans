/**
 * HimBean — Cross-Platform Mobile Foundation (Expo / React Native).
 * Tabs: Home (personalized), Order, Altitude Perks, Account.
 * API base points at the same Next.js backend (/api/*).
 */
import { useState } from "react";
import { SafeAreaView, ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { colors, spacing } from "./theme";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "https://himbean.coffee";

type Tab = "home" | "order" | "perks" | "account";

const TIERS = ["Base Camp", "Langtang", "Annapurna", "Everest"];

export default function App() {
  const [tab, setTab] = useState<Tab>("home");

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={s.body}>
        {tab === "home" && (
          <>
            <Text style={s.eyebrow}>GOOD MORNING</Text>
            <Text style={s.h1}>Your usual, ready in 12 min?</Text>
            <Pressable style={s.cta}><Text style={s.ctaText}>Reorder Summit Latte · 6.25</Text></Pressable>
            <Text style={s.sub}>Personalized by time, weather, and your last orders.</Text>
          </>
        )}
        {tab === "order" && (
          <>
            <Text style={s.eyebrow}>ORDER AHEAD</Text>
            <Text style={s.h1}>Choose in five seconds</Text>
            <Text style={s.sub}>Menu loads from {API_BASE}/api — same catalog as the café.</Text>
          </>
        )}
        {tab === "perks" && (
          <>
            <Text style={s.eyebrow}>ALTITUDE PERKS</Text>
            <Text style={s.h1}>2,340 vertical meters</Text>
            <Text style={s.sub}>Langtang tier · 2,160 m to Annapurna</Text>
            <View style={s.tierRow}>
              {TIERS.map((t) => (
                <Text key={t} style={[s.tier, t === "Langtang" && s.tierOn]}>{t}</Text>
              ))}
            </View>
            <Pressable style={s.qr}><Text style={s.qrText}>HB-4F7K2M</Text><Text style={s.sub}>Show at pickup</Text></Pressable>
          </>
        )}
        {tab === "account" && (
          <>
            <Text style={s.eyebrow}>ACCOUNT</Text>
            <Text style={s.h1}>Subscription, wallet, saved orders</Text>
            <Text style={s.sub}>Manage the Elevation Box: pause, roast &amp; grind preferences.</Text>
          </>
        )}
      </ScrollView>

      <View style={s.tabbar}>
        {(["home", "order", "perks", "account"] as Tab[]).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={s.tabBtn} accessibilityRole="tab" accessibilityState={{ selected: tab === t }}>
            <Text style={[s.tabLabel, tab === t && s.tabOn]}>{t.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.naturalWhite },
  body: { padding: spacing(3), paddingTop: spacing(8) },
  eyebrow: { color: colors.gold, letterSpacing: 4, fontSize: 11, fontWeight: "600" },
  h1: { color: colors.espresso, fontSize: 32, fontWeight: "700", marginTop: spacing(1), lineHeight: 38 },
  sub: { color: colors.espresso, opacity: 0.6, marginTop: spacing(2), fontSize: 15 },
  cta: { backgroundColor: colors.forest, borderRadius: 999, paddingVertical: spacing(2), paddingHorizontal: spacing(3), marginTop: spacing(3), alignSelf: "flex-start", minHeight: 48, justifyContent: "center" },
  ctaText: { color: colors.cream, fontWeight: "600" },
  tierRow: { flexDirection: "row", gap: spacing(1), marginTop: spacing(3), flexWrap: "wrap" },
  tier: { borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14, fontSize: 12, color: colors.espresso, opacity: 0.55 },
  tierOn: { backgroundColor: colors.forest, color: colors.cream, opacity: 1, borderColor: colors.forest },
  qr: { marginTop: spacing(4), backgroundColor: "#fff", borderRadius: 16, padding: spacing(3), alignItems: "center", borderWidth: 1, borderColor: colors.line },
  qrText: { fontFamily: "Courier", fontSize: 24, letterSpacing: 4, color: colors.espresso },
  tabbar: { flexDirection: "row", borderTopWidth: 1, borderColor: colors.line, backgroundColor: colors.naturalWhite },
  tabBtn: { flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center" },
  tabLabel: { fontSize: 10, letterSpacing: 2, color: colors.espresso, opacity: 0.45 },
  tabOn: { opacity: 1, color: colors.forest, fontWeight: "700" },
});
