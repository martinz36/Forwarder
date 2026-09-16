import React from "react";
import { View, Text, StyleSheet, Svg, Path, Circle } from "@react-pdf/renderer";

interface PdfHeaderProps {
  docTitle: string;
  docCode: string;
  docSubtitle?: string;
  codeColor?: string;
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "#1e3a8a",
    paddingBottom: 8,
    marginBottom: 10,
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBox: {
    width: 36,
    height: 36,
    backgroundColor: "#0f172a",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  companyGroup: {
    flexDirection: "column",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  brandMain: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    letterSpacing: 0.5,
  },
  brandBadge: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  companyTagline: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a8a",
    marginTop: 1,
  },
  companyInfo: {
    fontSize: 6.5,
    color: "#475569",
    marginTop: 2,
  },
  rightBox: {
    alignItems: "flex-end",
  },
  docTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textTransform: "uppercase",
  },
  docCode: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
    marginTop: 2,
  },
  docSub: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    marginTop: 1,
  },
});

export function PdfHeader({ docTitle, docCode, docSubtitle, codeColor }: PdfHeaderProps) {
  return (
    <View style={headerStyles.container}>
      {/* Left: Brand Vector Emblem & Details */}
      <View style={headerStyles.leftGroup}>
        <View style={headerStyles.logoBox}>
          <Svg width="22" height="22" viewBox="0 0 24 24">
            <Path
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              fill="#1e3a8a"
              stroke="#60a5fa"
              strokeWidth="1.2"
            />
            <Circle cx="12" cy="8" r="1.8" fill="#ffffff" />
            <Path
              d="M12 10v6.5M9.5 12h5M8.5 15a3.5 3.5 0 0 0 7 0"
              stroke="#ffffff"
              strokeWidth="1.3"
              fill="none"
            />
          </Svg>
        </View>

        <View style={headerStyles.companyGroup}>
          <View style={headerStyles.titleRow}>
            <Text style={headerStyles.brandMain}>MARIVAN</Text>
            <Text style={headerStyles.brandBadge}>LOGISTICS</Text>
          </View>
          <Text style={headerStyles.companyTagline}>
            MARIVAN LOGISTICS SAC • Operador Logístico Perú
          </Text>
          <Text style={headerStyles.companyInfo}>
            Agenciamiento Aduanero & Transporte Internacional
          </Text>
          <Text style={headerStyles.companyInfo}>
            Calle Españoletto 115, Dpto. 101, San Borja • Tel: 969 3010 95
          </Text>
        </View>
      </View>

      {/* Right: Document Identification Box */}
      <View style={headerStyles.rightBox}>
        <Text style={headerStyles.docTitle}>{docTitle}</Text>
        <Text style={[headerStyles.docCode, codeColor ? { color: codeColor } : {}]}>
          {docCode}
        </Text>
        {docSubtitle && <Text style={headerStyles.docSub}>{docSubtitle}</Text>}
      </View>
    </View>
  );
}
