import type { SupportDashboardMetrics } from "@/shared/interfaces/dashboard.interface";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  type DocumentProps,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";

const styles = StyleSheet.create({
  page: { padding: 32, fontFamily: "Helvetica", fontSize: 9, color: "#1f2937" },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 9, color: "#6b7280", marginBottom: 18 },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 7 },
  summary: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  summaryItem: { width: "31%", border: "1 solid #d1d5db", padding: 8 },
  summaryLabel: { fontSize: 7, color: "#6b7280", marginBottom: 3 },
  summaryValue: { fontSize: 14, fontWeight: 700 },
  row: { flexDirection: "row", borderBottom: "1 solid #e5e7eb", paddingVertical: 4 },
  cellGrow: { flexGrow: 1 },
  cellNumber: { width: 55, textAlign: "right" },
  header: { fontWeight: 700, backgroundColor: "#f3f4f6", paddingHorizontal: 4 },
  footer: { position: "absolute", bottom: 18, left: 32, right: 32, color: "#9ca3af" },
});

const MetricTable = ({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: number }>;
}) => (
  <View style={styles.section} wrap={false}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={[styles.row, styles.header]}>
      <Text style={styles.cellGrow}>Concepto</Text>
      <Text style={styles.cellNumber}>Total</Text>
    </View>
    {rows.length === 0 ? (
      <Text style={{ paddingVertical: 5, color: "#6b7280" }}>Sin datos en el periodo</Text>
    ) : (
      rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.cellGrow}>{row.label}</Text>
          <Text style={styles.cellNumber}>{row.value}</Text>
        </View>
      ))
    )}
  </View>
);

const DashboardPdfDocument = ({
  metrics,
}: {
  metrics: SupportDashboardMetrics;
}): ReactElement<DocumentProps> => (
  <Document title="Reporte de mesa de soporte MDSJ">
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Reporte de mesa de soporte MDSJ</Text>
      <Text style={styles.subtitle}>
        Periodo: {metrics.period.from} al {metrics.period.to} · Zona horaria: America/Lima
      </Text>

      <View style={styles.summary}>
        {[
          ["Tickets creados", metrics.summary.created],
          ["Tickets resueltos", metrics.summary.resolved],
          ["Tickets activos", metrics.summary.active],
          ["Sin asignar", metrics.summary.unassigned],
          ["Promedio asignación", `${metrics.summary.avgAssignmentHours} h`],
          ["Promedio resolución", `${metrics.summary.avgResolutionHours} h`],
        ].map(([label, value]) => (
          <View key={String(label)} style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{label}</Text>
            <Text style={styles.summaryValue}>{value}</Text>
          </View>
        ))}
      </View>

      <MetricTable
        title="Tickets por estado"
        rows={metrics.byStatus.map((item) => ({ label: item.key, value: item.count }))}
      />
      <MetricTable
        title="Tickets por prioridad"
        rows={metrics.byPriority.map((item) => ({ label: item.key, value: item.count }))}
      />
      <MetricTable
        title="Áreas con más tickets"
        rows={metrics.byArea.map((item) => ({ label: item.key, value: item.count }))}
      />
      <MetricTable
        title="Subáreas con más tickets"
        rows={metrics.bySubarea.map((item) => ({ label: item.key, value: item.count }))}
      />
      <MetricTable
        title="Categorías con más tickets"
        rows={metrics.byCategory.map((item) => ({ label: item.key, value: item.count }))}
      />
      <MetricTable
        title="Tipos de problema más frecuentes"
        rows={metrics.byProblemType.map((item) => ({
          label: item.key,
          value: item.count,
        }))}
      />

      <Text
        style={styles.footer}
        render={({ pageNumber, totalPages }) =>
          `Generado ${new Date().toLocaleString("es-PE")} · Página ${pageNumber} de ${totalPages}`
        }
        fixed
      />
    </Page>
  </Document>
);

export default DashboardPdfDocument;
