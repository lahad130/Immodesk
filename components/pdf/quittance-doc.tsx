import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export interface QuittanceProps {
  agency: {
    name: string
    address: string | null
    phone: string | null
  }
  tenant: {
    full_name: string
    phone: string | null
    email: string | null
  }
  property: {
    title: string
    neighborhood: string | null
    city: string
  } | null
  payment: {
    id: string
    amount_fcfa: number
    due_date: string
    paid_date: string | null
    status: string
  }
  lease: {
    start_date: string
    end_date: string
    monthly_rent: number
  }
}

function formatFCFAPDF(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

function formatDatePDF(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: '#000000',
    paddingTop: 48,
    paddingBottom: 48,
    paddingLeft: 56,
    paddingRight: 56,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 20,
    letterSpacing: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  agencyBlock: {
    flex: 1,
  },
  agencyName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  agencyDetail: {
    fontSize: 10,
    color: '#444444',
    marginBottom: 2,
  },
  refBlock: {
    alignItems: 'flex-end',
  },
  refLabel: {
    fontSize: 8,
    color: '#666666',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  refValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginVertical: 16,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 32,
  },
  column: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 8,
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 10,
    marginBottom: 2,
    color: '#000000',
  },
  bodyTextBold: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
    color: '#000000',
  },
  detailsSection: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailKey: {
    fontSize: 10,
    color: '#666666',
    width: 80,
  },
  detailValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    flex: 1,
  },
  statusPaye: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#3ECF8E',
    marginBottom: 4,
  },
  statusEnAttente: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#F59E0B',
    marginBottom: 4,
  },
  statusRetard: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#EF4444',
    marginBottom: 4,
  },
  paidDateText: {
    fontSize: 10,
    color: '#444444',
  },
  footer: {
    marginTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#999999',
  },
})

export default function QuittanceDoc(props: QuittanceProps) {
  const { agency, tenant, property, payment, lease } = props

  const statusLabel = (() => {
    switch (payment.status) {
      case 'paye':
        return (
          <Text style={styles.statusPaye}>PAYE</Text>
        )
      case 'en_attente':
        return <Text style={styles.statusEnAttente}>EN ATTENTE</Text>
      case 'retard':
        return <Text style={styles.statusRetard}>EN RETARD</Text>
      default:
        return <Text style={styles.bodyText}>{payment.status.toUpperCase()}</Text>
    }
  })()

  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const shortId = payment.id.slice(0, 8).toUpperCase()

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Title */}
        <Text style={styles.title}>QUITTANCE DE LOYER</Text>

        {/* Agency + Reference */}
        <View style={styles.headerRow}>
          <View style={styles.agencyBlock}>
            <Text style={styles.agencyName}>{agency.name}</Text>
            {agency.address ? (
              <Text style={styles.agencyDetail}>{agency.address}</Text>
            ) : null}
            {agency.phone ? (
              <Text style={styles.agencyDetail}>{agency.phone}</Text>
            ) : null}
          </View>
          <View style={styles.refBlock}>
            <Text style={styles.refLabel}>Reference</Text>
            <Text style={styles.refValue}>N° {shortId}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Tenant + Property columns */}
        <View style={styles.twoColumns}>
          {/* Tenant */}
          <View style={styles.column}>
            <Text style={styles.sectionLabel}>Locataire</Text>
            <Text style={styles.bodyTextBold}>{tenant.full_name}</Text>
            {tenant.phone ? (
              <Text style={styles.bodyText}>{tenant.phone}</Text>
            ) : null}
            {tenant.email ? (
              <Text style={styles.bodyText}>{tenant.email}</Text>
            ) : null}
          </View>

          {/* Property */}
          <View style={styles.column}>
            <Text style={styles.sectionLabel}>Bien</Text>
            {property ? (
              <>
                <Text style={styles.bodyTextBold}>{property.title}</Text>
                <Text style={styles.bodyText}>
                  {[property.neighborhood, property.city]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </>
            ) : (
              <Text style={styles.bodyText}>—</Text>
            )}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Payment details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionLabel}>Details du paiement</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Periode</Text>
            <Text style={styles.detailValue}>
              {formatMonthYear(payment.due_date)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Loyer</Text>
            <Text style={styles.detailValue}>
              {formatFCFAPDF(lease.monthly_rent)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Montant</Text>
            <Text style={styles.detailValue}>
              {formatFCFAPDF(payment.amount_fcfa)}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Status */}
        <View>
          {statusLabel}
          {payment.status === 'paye' && payment.paid_date ? (
            <Text style={styles.paidDateText}>
              le {formatDatePDF(payment.paid_date)}
            </Text>
          ) : null}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Document genere le {today}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
